import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Filter,
  Search,
  Eye,
  Instagram
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';
import WebSocketService from '../../services/WebSocketService';

interface Booking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    instagramUrl?: string;
  };
  campingSite: {
    _id: string;
    name: string;
    location: string;
    image?: string;
    price: number;
  };
  startDate: string;
  endDate: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  bookingDetails?: {
    equipment?: string[];
    activities?: string[];
    specialRequests?: string;
  };
  adminNotes?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancelledBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchBookings();
    fetchStats();

    // Auto-refresh every 5 seconds for near real-time updates
    const refreshInterval = setInterval(() => {
      fetchBookings();
      fetchStats();
    }, 5000); // 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedStatus, searchTerm]);


  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching all booking types from admin API...');

      // Fetch all three types of bookings in parallel
      const [campsiteResponse, activityResponse, equipmentResponse] = await Promise.all([
        apiService.getAllBookings({ page: 1, limit: 100 }),
        apiService.getAllActivityBookings({ page: 1, limit: 100 }),
        apiService.getAllEquipmentBookings({ page: 1, limit: 100 })
      ]);

      // Merge all bookings with type indicator
      const allBookings = [
        ...(campsiteResponse.success ? campsiteResponse.data.bookings.map((b: any) => ({ ...b, bookingType: 'campsite' })) : []),
        ...(activityResponse.success ? activityResponse.data.bookings.map((b: any) => ({ ...b, bookingType: 'activity' })) : []),
        ...(equipmentResponse.success ? equipmentResponse.data.bookings.map((b: any) => ({ ...b, bookingType: 'equipment' })) : [])
      ];

      // Sort by creation date (newest first)
      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`✅ Received ${allBookings.length} total bookings (${campsiteResponse.data?.bookings.length || 0} campsites, ${activityResponse.data?.bookings.length || 0} activities, ${equipmentResponse.data?.bookings.length || 0} equipment)`);

      // Debug: Log booking statuses
      const statusCounts = allBookings.reduce((acc: any, b: any) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Booking status counts:', statusCounts);

      // Debug: Log cancelled bookings
      const cancelledBookings = allBookings.filter((b: any) => b.status === 'cancelled');
      console.log(`🚫 Cancelled bookings: ${cancelledBookings.length}`, cancelledBookings.map((b: any) => ({ id: b._id, name: b.campingSite?.name || b.activity?.name || b.equipment?.name })));

      setBookings(allBookings);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch stats from all three booking types in parallel
      const [campsiteStats, activityStats, equipmentStats] = await Promise.all([
        apiService.getBookingStats(),
        apiService.getActivityBookingStats(),
        apiService.getEquipmentBookingStats()
      ]);

      // Initialize combined stats
      const combinedStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        completed: 0
      };

      // Helper function to add stats from a response
      const addStats = (response: any) => {
        if (response.success && response.data) {
          Object.keys(response.data).forEach(status => {
            if (combinedStats.hasOwnProperty(status)) {
              combinedStats[status as keyof typeof combinedStats] += response.data[status]?.count || 0;
            }
          });
        }
      };

      // Combine stats from all three types
      addStats(campsiteStats);
      addStats(activityStats);
      addStats(equipmentStats);

      setStats(combinedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.campingSite?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.campingSite?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const handleApproveBooking = async () => {
    if (!selectedBooking) return;

    try {
      let response;
      const bookingType = (selectedBooking as any).bookingType || 'campsite';

      // Call appropriate API based on booking type
      if (bookingType === 'activity') {
        response = await apiService.approveActivityBooking(selectedBooking._id, adminNotes);
      } else if (bookingType === 'equipment') {
        response = await apiService.approveEquipmentBooking(selectedBooking._id, adminNotes);
      } else {
        response = await apiService.approveBooking(selectedBooking._id, adminNotes);
      }

      if (response.success) {
        toast.success(`${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} booking approved successfully!`);
        setBookings(prev =>
          prev.map(booking =>
            booking._id === selectedBooking._id
              ? { ...booking, status: 'approved' as const, adminNotes }
              : booking
          )
        );
        setShowApprovalModal(false);
        setSelectedBooking(null);
        setAdminNotes('');
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve booking');
    }
  };

  const handleRejectBooking = async () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      let response;
      const bookingType = (selectedBooking as any).bookingType || 'campsite';

      // Call appropriate API based on booking type
      if (bookingType === 'activity') {
        response = await apiService.rejectActivityBooking(selectedBooking._id, rejectionReason, adminNotes);
      } else if (bookingType === 'equipment') {
        response = await apiService.rejectEquipmentBooking(selectedBooking._id, rejectionReason, adminNotes);
      } else {
        response = await apiService.rejectBooking(selectedBooking._id, rejectionReason, adminNotes);
      }

      if (response.success) {
        toast.success(`${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} booking rejected`);
        setBookings(prev =>
          prev.map(booking =>
            booking._id === selectedBooking._id
              ? { ...booking, status: 'rejected' as const, rejectionReason, adminNotes }
              : booking
          )
        );
        setShowRejectionModal(false);
        setSelectedBooking(null);
        setAdminNotes('');
        setRejectionReason('');
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Booking Management</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={() => {
              fetchBookings();
              fetchStats();
            }}
            className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{stats.completed}</div>
            <div className="text-sm text-blue-600">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by guest name, email, or campsite..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {/* Booking Type Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${(booking as any).bookingType === 'activity' ? 'bg-purple-100 text-purple-800' :
                      (booking as any).bookingType === 'equipment' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {((booking as any).bookingType || 'campsite').toUpperCase()}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(booking as any).campingSite?.name ||
                        (booking as any).activity?.name ||
                        (booking as any).equipment?.name ||
                        'Item Unavailable'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  {/* User Name - Prominent Display */}
                  <div className="flex items-center mb-2">
                    <Users size={16} className="mr-2 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-600">
                      Booked by: {booking.user?.name || 'Unknown User'}
                    </span>
                    {booking.user?.email && (
                      <span className="text-xs text-gray-500 ml-2">({booking.user.email})</span>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 text-sm space-x-4">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {(booking as any).campingSite?.location ||
                        (booking as any).activity?.description ||
                        (booking as any).equipment?.description ||
                        'N/A'}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Users size={16} className="mr-1" />
                      {booking.guests} guests
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {getDaysBetween(booking.startDate, booking.endDate)} nights
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-teal-600">€{booking.totalPrice.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Guest Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name: <span className="font-medium">{booking.user?.name || 'N/A'}</span></p>
                    <p className="text-sm text-gray-600">Email: <span className="font-medium">{booking.user?.email || 'N/A'}</span></p>
                  </div>
                  <div>
                    {booking.user?.instagramUrl && (
                      <a
                        href={booking.user.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-teal-600 hover:text-teal-700"
                      >
                        <Instagram size={16} className="mr-1" />
                        Instagram Profile
                      </a>
                    )}
                    <p className="text-sm text-gray-600">
                      Booked: {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              {booking.bookingDetails && (
                <div className="mb-4">
                  {booking.bookingDetails.equipment && booking.bookingDetails.equipment.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Equipment: </span>
                      {booking.bookingDetails.equipment.map((item, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  {booking.bookingDetails.activities && booking.bookingDetails.activities.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Activities: </span>
                      {booking.bookingDetails.activities.map((activity, index) => (
                        <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1">
                          {activity}
                        </span>
                      ))}
                    </div>
                  )}
                  {booking.bookingDetails.specialRequests && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Special Requests: </span>
                      <span className="text-sm text-gray-600">{booking.bookingDetails.specialRequests}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              {booking.adminNotes && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <span className="text-sm font-medium text-blue-900">Admin Notes: </span>
                  <span className="text-sm text-blue-800">{booking.adminNotes}</span>
                </div>
              )}

              {/* Rejection Reason */}
              {booking.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <span className="text-sm font-medium text-red-900">Rejection Reason: </span>
                  <span className="text-sm text-red-800">{booking.rejectionReason}</span>
                </div>
              )}

              {/* Cancellation Info */}
              {booking.status === 'cancelled' && booking.cancelledAt && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Cancelled: </span>
                      <span className="text-sm text-gray-700">
                        {new Date(booking.cancelledAt).toLocaleString()}
                      </span>
                    </div>
                    {booking.cancelledBy && (
                      <span className="text-xs text-gray-600">
                        by {booking.cancelledBy.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {booking.status === 'pending' && (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowRejectionModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} className="mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowApprovalModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Booking</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve this booking for {selectedBooking?.user?.name || 'this user'}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Add any notes for the booking approval..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedBooking(null);
                  setAdminNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveBooking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Booking</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this booking.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Explain why this booking is being rejected..."
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Additional internal notes..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedBooking(null);
                  setAdminNotes('');
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectBooking}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
