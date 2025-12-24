import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Calendar, Users, Download, Mail,
    X, AlertCircle, CheckCircle, Clock, CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { bookings, cancelBooking: cancelBookingContext } = useAuth();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');
    const [sendingSupport, setSendingSupport] = useState(false);

    useEffect(() => {
        loadBookingDetails();
    }, [id, bookings]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);

            console.log('Looking for booking with ID:', id);
            console.log('Available bookings:', bookings);

            // Try to get booking from context - check both id and _id
            const contextBooking = bookings?.find((b: any) =>
                b.id === id || b._id === id || b.id?.toString() === id || b._id?.toString() === id
            );

            console.log('Found booking:', contextBooking);

            if (contextBooking) {
                setBooking(contextBooking);
            } else {
                console.error('Booking not found. ID:', id, 'Available:', bookings?.map((b: any) => ({ id: b.id, _id: b._id })));
                toast.error('Booking not found');
                setTimeout(() => {
                    navigate('/profile#bookings');
                }, 1500);
            }
        } catch (error) {
            console.error('Error loading booking:', error);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        setCancelling(true);
        try {
            // Call the appropriate cancel endpoint based on booking type
            if (booking?.type === 'activity') {
                await apiService.request(`/activity-bookings/${id}/cancel`, { method: 'POST' });
            } else if (booking?.type === 'equipment') {
                await apiService.request(`/equipment-bookings/${id}/cancel`, { method: 'POST' });
            } else {
                // Default to campsite booking
                await cancelBookingContext(id!);
            }
            toast.success('Booking cancelled successfully');
            setShowCancelModal(false);
            navigate('/profile#bookings');
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    const handleDownloadReceipt = async () => {
        try {
            const response = await apiService.getBookingReceipt(id!);
            if (response.success) {
                const receipt = response.data;

                // Create a printable receipt view
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Booking Receipt - ${receipt.bookingReference}</title>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
                                .section { margin: 20px 0; }
                                .label { font-weight: bold; color: #666; }
                                .value { margin-left: 10px; }
                                .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
                                .status.confirmed { background: #d1fae5; color: #065f46; }
                                .status.cancelled { background: #fee2e2; color: #991b1b; }
                                .status.pending { background: #fef3c7; color: #92400e; }
                                .status.approved { background: #dbeafe; color: #1e40af; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                                th { background: #f9fafb; font-weight: bold; }
                                .total { font-size: 1.2em; font-weight: bold; color: #0d9488; }
                                @media print { button { display: none; } }
                            </style>
                        </head>
                        <body>
                            <h1>Booking Receipt</h1>
                            <div class="section">
                                <p><span class="label">Booking Reference:</span><span class="value">${receipt.bookingReference}</span></p>
                                <p><span class="label">Status:</span> <span class="status ${receipt.status}">${receipt.status.toUpperCase()}</span></p>
                                <p><span class="label">Booking Date:</span><span class="value">${new Date(receipt.createdAt).toLocaleDateString()}</span></p>
                                ${receipt.cancelledAt ? `<p><span class="label">Cancelled Date:</span><span class="value">${new Date(receipt.cancelledAt).toLocaleDateString()}</span></p>` : ''}
                            </div>
                            
                            <div class="section">
                                <h2>Guest Information</h2>
                                <p><span class="label">Name:</span><span class="value">${receipt.user.name}</span></p>
                                <p><span class="label">Email:</span><span class="value">${receipt.user.email}</span></p>
                            </div>
                            
                            <div class="section">
                                <h2>Campsite Details</h2>
                                <p><span class="label">Campsite:</span><span class="value">${receipt.campsite.name}</span></p>
                                <p><span class="label">Location:</span><span class="value">${receipt.campsite.location}</span></p>
                            </div>
                            
                            <div class="section">
                                <h2>Booking Details</h2>
                                <p><span class="label">Check-in:</span><span class="value">${new Date(receipt.checkIn).toLocaleDateString()}</span></p>
                                <p><span class="label">Check-out:</span><span class="value">${new Date(receipt.checkOut).toLocaleDateString()}</span></p>
                                <p><span class="label">Duration:</span><span class="value">${receipt.duration} night(s)</span></p>
                                <p><span class="label">Guests:</span><span class="value">${receipt.guests}</span></p>
                            </div>
                            
                            <div class="section">
                                <h2>Pricing</h2>
                                <table>
                                    <tr>
                                        <th>Description</th>
                                        <th>Amount</th>
                                    </tr>
                                    <tr>
                                        <td>${receipt.duration} night(s) × €${receipt.pricePerNight}/night</td>
                                        <td>€${receipt.subtotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td class="total">Total</td>
                                        <td class="total">€${receipt.totalPrice.toFixed(2)}</td>
                                    </tr>
                                </table>
                                <p><span class="label">Payment Status:</span><span class="value">${receipt.paymentStatus.toUpperCase()}</span></p>
                            </div>
                            
                            ${receipt.cancellation ? `
                                <div class="section">
                                    <h2>Cancellation Details</h2>
                                    <p><span class="label">Cancelled:</span><span class="value">${new Date(receipt.cancellation.cancelledAt).toLocaleDateString()}</span></p>
                                    <p><span class="label">Refund:</span><span class="value">${receipt.cancellation.refundPercentage}% (€${receipt.cancellation.refundAmount.toFixed(2)})</span></p>
                                </div>
                            ` : ''}
                            
                            <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #0d9488; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate receipt');
        }
    };

    const handleContactSupport = () => {
        setShowSupportModal(true);
        setSupportMessage('');
    };

    const handleSubmitSupport = async () => {
        if (!supportMessage.trim()) {
            toast.error('Please enter a message');
            return;
        }

        if (supportMessage.trim().length < 10) {
            toast.error('Message must be at least 10 characters');
            return;
        }

        setSendingSupport(true);
        try {
            const user = await apiService.getProfile();
            const response = await apiService.submitBookingSupport({
                bookingId: id!,
                name: user.data.name,
                email: user.data.email,
                message: supportMessage,
            });

            if (response.success) {
                toast.success('Support request sent successfully!');
                setShowSupportModal(false);
                setSupportMessage('');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to send support request');
        } finally {
            setSendingSupport(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="text-green-600" size={24} />;
            case 'pending': return <Clock className="text-yellow-600" size={24} />;
            case 'approved': return <CheckCircle className="text-blue-600" size={24} />;
            case 'cancelled':
            case 'rejected': return <X className="text-red-600" size={24} />;
            default: return <AlertCircle className="text-gray-600" size={24} />;
        }
    };

    const canCancel = booking && (booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'approved');

    const getRefundInfo = () => {
        if (!booking) return '';

        const checkInDate = new Date(booking.date);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilCheckIn > 48) {
            return '100% refund - Free cancellation (more than 48 hours before check-in)';
        } else if (hoursUntilCheckIn > 24) {
            return '50% refund - Cancelled within 48 hours of check-in';
        } else {
            return 'No refund - Cancelled within 24 hours of check-in';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h2>
                    <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
                    <Link to="/profile#bookings" className="text-teal-600 hover:text-teal-700 font-medium">
                        ← Back to Bookings
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    to="/profile#bookings"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    <span className="font-medium">Back to Bookings</span>
                </Link>

                {/* Header with Status */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{booking.name}</h1>
                            <p className="text-gray-600">Booking Reference: <span className="font-mono font-semibold">#{id?.slice(-8).toUpperCase()}</span></p>
                        </div>
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="font-semibold capitalize">{booking.status}</span>
                        </div>
                        {booking.status === 'cancelled' && booking.cancelledAt && (
                            <div className="mt-2 text-sm text-gray-600">
                                <Clock className="inline w-4 h-4 mr-1" />
                                Cancelled on {new Date(booking.cancelledAt).toLocaleDateString()} at {new Date(booking.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Dates & Duration */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <Calendar className="text-teal-600" size={24} />
                            <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Check-in</p>
                                <p className="font-semibold text-gray-900">{booking.date}</p>
                            </div>
                            {booking.endDate && (
                                <div>
                                    <p className="text-sm text-gray-600">Check-out</p>
                                    <p className="font-semibold text-gray-900">{booking.endDate}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <MapPin className="text-teal-600" size={24} />
                            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{booking.name}</p>
                            {booking.location && (
                                <p className="text-gray-600 mt-1">{booking.location}</p>
                            )}
                        </div>
                    </div>

                    {/* Guests */}
                    {booking.guests && (
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <Users className="text-teal-600" size={24} />
                                <h3 className="text-lg font-semibold text-gray-900">Guests</h3>
                            </div>
                            <p className="font-semibold text-gray-900">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</p>
                        </div>
                    )}

                    {/* Price */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <CreditCard className="text-teal-600" size={24} />
                            <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Amount</span>
                                <span className="font-bold text-2xl text-gray-900">€{typeof booking.price === 'number' ? booking.price.toFixed(2) : booking.price}</span>
                            </div>
                            {booking.status === 'approved' && (
                                <p className="text-sm text-yellow-600 font-medium">⚠️ Payment pending</p>
                            )}
                            {booking.status === 'confirmed' && (
                                <p className="text-sm text-green-600 font-medium">✓ Paid</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Booking</h3>
                    <div className="flex flex-wrap gap-3">
                        {booking.status === 'approved' && (
                            <button
                                onClick={() => navigate(`/payment/${id}`, { state: { booking } })}
                                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <CreditCard size={20} />
                                <span>Complete Payment</span>
                            </button>
                        )}

                        <button
                            onClick={handleDownloadReceipt}
                            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            <Download size={20} />
                            <span>Download Receipt</span>
                        </button>

                        <button
                            onClick={handleContactSupport}
                            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            <Mail size={20} />
                            <span>Contact Support</span>
                        </button>

                        {canCancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="flex items-center space-x-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                            >
                                <X size={20} />
                                <span>Cancel Booking</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                    <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                        <AlertCircle size={20} className="mr-2" />
                        Cancellation Policy
                    </h4>
                    <p className="text-sm text-yellow-800">
                        Free cancellation until 48 hours before check-in. After that, 50% refund if cancelled 24 hours before check-in.
                        No refund for cancellations within 24 hours of check-in.
                    </p>
                </div>
            </div>

            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Cancel Booking?</h3>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Are you sure you want to cancel this booking? This action cannot be undone.
                        </p>

                        {/* Refund Info */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">Refund Information</p>
                            <p className="text-sm text-yellow-800">{getRefundInfo()}</p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={cancelling}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Modal */}
            {showSupportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Contact Support</h3>
                            <button
                                onClick={() => setShowSupportModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Need help with booking <span className="font-mono font-semibold">#{id?.slice(-8).toUpperCase()}</span>?
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Message
                            </label>
                            <textarea
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Please describe your issue or question..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                rows={5}
                                disabled={sendingSupport}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {supportMessage.length}/1000 characters (minimum 10)
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowSupportModal(false)}
                                disabled={sendingSupport}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitSupport}
                                disabled={sendingSupport || supportMessage.trim().length < 10}
                                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {sendingSupport ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BookingDetails;
