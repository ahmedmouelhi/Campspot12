import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BarChart3,
  Users,
  MapPin,
  Activity,
  FileText,
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  Menu,
  X,
  Bell,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import RealAdminApiService from '../../services/RealAdminApiService';
import CampsiteManagement from '../../components/admin/CampsiteManagement';
import ActivityManagement from '../../components/admin/ActivityManagement';
import BlogManagement from '../../components/admin/BlogManagement';
import EquipmentManagement from '../../components/admin/EquipmentManagement';
import UsersManagement from '../../components/admin/UsersManagement';
import NotificationManagement from '../../components/admin/NotificationManagement';
import BookingManagement from '../../components/admin/BookingManagement';

const AdminDashboard = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const adminService = RealAdminApiService.getInstance();

  // Mock recent activity data
  const recentActivity = [
    { icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-100', action: 'New campsite added', detail: '"Mountain View Lodge"', time: '2 hours ago' },
    { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100', action: 'Blog post published', detail: '"Top 10 Camping Tips"', time: '5 hours ago' },
    { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', action: 'Booking approved', detail: '#BK-1234', time: '1 day ago' },
    { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', action: 'New user registered', detail: 'john@example.com', time: '2 days ago' },
  ];

  // Function to refresh stats
  const refreshStats = async () => {
    try {
      const realStats = await adminService.getStatistics();
      setStats(realStats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const initializeData = async () => {
      setLoading(true);
      try {
        // Get real statistics from database (without seeding)
        const realStats = await adminService.getStatistics();
        setStats(realStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isAdmin, navigate]);

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'campsites', name: 'Campsites', icon: MapPin },
    { id: 'activities', name: 'Activities', icon: Activity },
    { id: 'blog', name: 'Blog Posts', icon: FileText },
    { id: 'equipment', name: 'Equipment', icon: Package },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, quickLink, onQuickLinkClick }: any) => (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {quickLink && (
        <button
          onClick={onQuickLinkClick}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2 group"
        >
          {quickLink}
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      )}
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="p-2 bg-red-600 rounded-lg">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">CampSpot Admin</h1>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Content Management System</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-2xl mx-8">
            {/* Global Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, campsites, bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, Admin</span>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
            >
              View Site
            </button>
            <button
              onClick={() => logout(navigate)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <span className="block text-sm text-gray-600">Welcome, Admin</span>
              <button
                onClick={() => navigate('/')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 py-2"
              >
                View Site
              </button>
              <button
                onClick={() => logout(navigate)}
                className="block w-full text-left bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar - Sticky */}
        <div className="hidden md:block w-64 bg-white shadow-lg sticky top-0 h-screen overflow-y-auto">
          <nav className="mt-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); if (item.id === 'overview') refreshStats(); }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${activeSection === item.id
                  ? 'bg-red-50 text-red-600 border-r-4 border-red-600'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
          <div className="flex overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === 'overview') refreshStats();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 text-xs transition-colors min-w-[75px] ${activeSection === item.id
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-tight truncate max-w-full whitespace-nowrap">
                  {item.name === 'Overview' ? 'Home' :
                    item.name === 'Activities' ? 'Acts' :
                      item.name === 'Equipment' ? 'Equip' :
                        item.name === 'Blog Posts' ? 'Blog' :
                          item.name === 'Notifications' ? 'Notifs' :
                            item.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {activeSection === 'overview' && (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600">Monitor your camping platform at a glance</p>
              </div>

              {/* Stats Grid */}
              {stats && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    <StatCard
                      title="Total Users"
                      value={stats.users.total}
                      subtitle={`${stats.users.active} active users`}
                      icon={Users}
                      color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                      trend={12}
                      quickLink="View all users"
                      onQuickLinkClick={() => setActiveSection('users')}
                    />
                    <StatCard
                      title="Campsites"
                      value={stats.campsites.total}
                      subtitle={`${stats.campsites.available} available now`}
                      icon={MapPin}
                      color="bg-gradient-to-br from-blue-500 to-blue-600"
                      trend={8}
                      quickLink="Manage campsites"
                      onQuickLinkClick={() => setActiveSection('campsites')}
                    />
                    <StatCard
                      title="Activities"
                      value={stats.activities.total}
                      subtitle={`${stats.activities.categories} categories`}
                      icon={Activity}
                      color="bg-gradient-to-br from-green-500 to-green-600"
                      trend={5}
                      quickLink="View activities"
                      onQuickLinkClick={() => setActiveSection('activities')}
                    />
                    <StatCard
                      title="Blog Posts"
                      value={stats.blog.total}
                      subtitle={`${stats.blog.published} published`}
                      icon={FileText}
                      color="bg-gradient-to-br from-purple-500 to-purple-600"
                      trend={-3}
                      quickLink="Manage blog"
                      onQuickLinkClick={() => setActiveSection('blog')}
                    />
                    <StatCard
                      title="Equipment"
                      value={stats.equipment.total}
                      subtitle={`${stats.equipment.available} in stock`}
                      icon={Package}
                      color="bg-gradient-to-br from-orange-500 to-orange-600"
                      trend={15}
                      quickLink="View equipment"
                      onQuickLinkClick={() => setActiveSection('equipment')}
                    />
                  </div>
                </div>
              )}

              {/* Quick Actions & System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveSection('bookings')}
                      className="w-full group hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-start p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-2 bg-red-500 rounded-lg mr-4">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-red-900 mb-1">Manage Bookings</h4>
                          <p className="text-sm text-red-700">Review and approve booking requests</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveSection('campsites')}
                      className="w-full group hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-2 bg-blue-500 rounded-lg mr-4">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-blue-900 mb-1">Add New Campsite</h4>
                          <p className="text-sm text-blue-700">Create and publish a new location</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveSection('blog')}
                      className="w-full group hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-start p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-2 bg-purple-500 rounded-lg mr-4">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-purple-900 mb-1">Write Blog Post</h4>
                          <p className="text-sm text-purple-700">Share camping tips and stories</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-800">System Online</span>
                      </div>
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                        <span className="text-sm font-medium text-gray-800">Last Updated</span>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-3 text-purple-600" />
                        <span className="text-sm font-medium text-gray-800">Admin Access</span>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Full Control</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Bell className="w-4 h-4 mr-3 text-orange-600" />
                        <span className="text-sm font-medium text-gray-800">Notifications</span>
                      </div>
                      <button
                        onClick={() => setActiveSection('notifications')}
                        className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full hover:bg-orange-200 transition-colors"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Timeline */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-lg ${activity.bg} flex-shrink-0`}>
                          <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-600 truncate">{activity.detail}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1">
                    View all activity
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Analytics Preview */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Quick Insights</h2>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-4">
                    {/* Booking Trend */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">Bookings This Week</span>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-500 text-white rounded-full">+24%</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">47</span>
                        <span className="text-sm text-gray-600">vs 38 last week</span>
                      </div>
                    </div>

                    {/* Popular Campsite */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">Most Popular</span>
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Riverside Retreat</p>
                      <p className="text-sm text-gray-600">23 bookings this month</p>
                    </div>

                    {/* Revenue Insight */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">Peak Season</span>
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">Summer Months</p>
                      <p className="text-sm text-gray-600">June - August (avg 85% occupancy)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Management */}
          {activeSection === 'bookings' && <BookingManagement />}

          {/* Users Management */}
          {activeSection === 'users' && <UsersManagement />}

          {/* Campsites Management */}
          {activeSection === 'campsites' && <CampsiteManagement />}

          {/* Activities Management */}
          {activeSection === 'activities' && <ActivityManagement />}

          {/* Blog Management */}
          {activeSection === 'blog' && <BlogManagement />}

          {/* Equipment Management */}
          {activeSection === 'equipment' && <EquipmentManagement />}

          {/* Notification Management */}
          {activeSection === 'notifications' && <NotificationManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
