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
  Bell
} from 'lucide-react';
import RealAdminApiService from '../../services/RealAdminApiService';
import CampsiteManagement from '../../components/admin/CampsiteManagement';
import ActivityManagement from '../../components/admin/ActivityManagement';
import BlogManagement from '../../components/admin/BlogManagement';
import EquipmentManagement from '../../components/admin/EquipmentManagement';
import UsersManagement from '../../components/admin/UsersManagement';
import NotificationManagement from '../../components/admin/NotificationManagement';

const AdminDashboard = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminService = RealAdminApiService.getInstance();

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
    { id: 'users', name: 'Users', icon: Users },
    { id: 'campsites', name: 'Campsites', icon: MapPin },
    { id: 'activities', name: 'Activities', icon: Activity },
    { id: 'blog', name: 'Blog Posts', icon: FileText },
    { id: 'equipment', name: 'Equipment', icon: Package },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color} flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
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
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white min-h-screen shadow-lg">
          <nav className="mt-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); if (item.id === 'overview') refreshStats(); }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  activeSection === item.id
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
                className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 text-xs transition-colors min-w-[75px] ${
                  activeSection === item.id
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
        <div className="flex-1 p-3 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-6 max-w-full overflow-x-hidden">
          {activeSection === 'overview' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h2>
              
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  <StatCard
                    title="Total Users"
                    value={stats.users.total}
                    subtitle={`${stats.users.active} active`}
                    icon={Users}
                    color="bg-indigo-500"
                  />
                  <StatCard
                    title="Total Campsites"
                    value={stats.campsites.total}
                    subtitle={`${stats.campsites.available} available`}
                    icon={MapPin}
                    color="bg-blue-500"
                  />
                  <StatCard
                    title="Activities"
                    value={stats.activities.total}
                    subtitle={`${stats.activities.categories} categories`}
                    icon={Activity}
                    color="bg-green-500"
                  />
                  <StatCard
                    title="Blog Posts"
                    value={stats.blog.total}
                    subtitle={`${stats.blog.published} published`}
                    icon={FileText}
                    color="bg-purple-500"
                  />
                  <StatCard
                    title="Equipment Items"
                    value={stats.equipment.total}
                    subtitle={`${stats.equipment.available} available`}
                    icon={Package}
                    color="bg-orange-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <button
                      onClick={() => setActiveSection('users')}
                      className="w-full flex items-center justify-between p-2 sm:p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-indigo-600" />
                        <span className="text-xs sm:text-sm text-indigo-800">Manage Users</span>
                      </div>
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                    </button>
                    <button
                      onClick={() => setActiveSection('campsites')}
                      className="w-full flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-600" />
                        <span className="text-xs sm:text-sm text-blue-800">Add New Campsite</span>
                      </div>
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => setActiveSection('activities')}
                      className="w-full flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-600" />
                        <span className="text-xs sm:text-sm text-green-800">Add New Activity</span>
                      </div>
                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setActiveSection('blog')}
                      className="w-full flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-600" />
                        <span className="text-xs sm:text-sm text-purple-800">Write Blog Post</span>
                      </div>
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                    </button>
                    <button
                      onClick={() => setActiveSection('equipment')}
                      className="w-full flex items-center justify-between p-2 sm:p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-orange-600" />
                        <span className="text-xs sm:text-sm text-orange-800">Add Equipment</span>
                      </div>
                      <Package className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                    </button>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-lg">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">System Status</h3>
                  <div className="space-y-2 sm:space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-600" />
                        <span className="text-xs sm:text-sm text-gray-800">System Online</span>
                      </div>
                      <span className="text-green-600 text-xs sm:text-sm font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-600" />
                        <span className="text-xs sm:text-sm text-gray-800">Last Updated</span>
                      </div>
                      <span className="text-gray-600 text-xs sm:text-sm">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-600" />
                        <span className="text-xs sm:text-sm text-gray-800">Admin Access</span>
                      </div>
                      <span className="text-purple-600 text-xs sm:text-sm font-medium">Full Control</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
