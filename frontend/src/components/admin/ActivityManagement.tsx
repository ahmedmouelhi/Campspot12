import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Activity as ActivityIcon, Clock, Users, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import RealAdminApiService, { type Activity } from '../../services/RealAdminApiService';

const ActivityManagement = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Activity, 'id'>>({
    name: '',
    icon: '',
    description: '',
    duration: '',
    difficulty: 'Easy',
    price: 0,
    category: '',
    maxParticipants: 0,
    equipment: [],
    images: [],
    location: '',
    status: 'active'
  });

  const adminService = RealAdminApiService.getInstance();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const activitiesData = await adminService.getActivities();
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      icon: '',
      description: '',
      duration: '',
      difficulty: 'Easy',
      price: 0,
      category: '',
      maxParticipants: 0,
      equipment: [],
      images: [],
      location: '',
      status: 'active'
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      name: activity.name,
      icon: activity.icon,
      description: activity.description,
      duration: activity.duration,
      difficulty: activity.difficulty,
      price: activity.price,
      category: activity.category,
      maxParticipants: activity.maxParticipants,
      equipment: [...activity.equipment],
      images: activity.images || [],
      location: activity.location || '',
      status: activity.status || 'active'
    });
    setEditingId(activity.id || null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        setLoading(true);
        await adminService.deleteActivity(id);
        toast.success('Activity deleted successfully');
        await loadActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        toast.error('Failed to delete activity');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Activity form submission started');
    console.log('📝 Form data:', formData);
    console.log('✏️ Editing ID:', editingId);
    
    try {
      setLoading(true);
      
      console.log('🎯 Form data to submit:', formData);
      
      let response;
      if (editingId) {
        console.log('🔄 Updating existing activity with ID:', editingId);
        response = await adminService.updateActivity(editingId, formData);
      } else {
        console.log('➕ Creating new activity');
        response = await adminService.addActivity(formData);
      }
      
      console.log('📥 Admin service response:', response);
      
      if (response?.success) {
        console.log('✅ Activity save successful');
        toast.success(editingId ? 'Activity updated successfully' : 'Activity created successfully');
        console.log('🔄 Reloading activities list...');
        await loadActivities();
        setIsFormOpen(false);
        console.log('✅ Form reset and closed');
      } else {
        console.error('❌ Failed to save activity:', response?.message || 'Unknown error');
        toast.error(response?.message || 'Failed to save activity');
      }
    } catch (error) {
      console.error('❌ Error saving activity:', error);
      toast.error('Failed to save activity');
    } finally {
      setLoading(false);
      console.log('🏁 Activity form submission completed');
    }
  };

  const handleEquipmentAdd = (equipment: string) => {
    if (equipment && !formData.equipment.includes(equipment)) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipment]
      }));
    }
  };

  const handleEquipmentRemove = (equipmentToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(e => e !== equipmentToRemove)
    }));
  };

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const iconOptions = ['🥾', '🎣', '🛶', '🧗', '⭐', '🦌', '🚴', '🏊', '🎯', '🔥'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Management</h2>
        <button
          onClick={handleAddNew}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Activity</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <input
          type="text"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingId ? 'Edit Activity' : 'Add New Activity'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {iconOptions.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon }))}
                          className={`p-2 text-xl border rounded-lg ${formData.icon === icon ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="Or enter custom emoji"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., Hiking, Water Sports"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 2-4 hours"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty *
                    </label>
                    <select
                      required
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Participants *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Equipment
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.equipment.map((item, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleEquipmentRemove(item)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Hiking boots', 'Backpack', 'Water bottle', 'Fishing rod', 'Kayak', 'Helmet', 'Harness', 'Life jacket'].map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleEquipmentAdd(item)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                        disabled={formData.equipment.includes(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{editingId ? 'Update' : 'Create'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div>
        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              All Activities ({filteredActivities.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max People
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{activity.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{activity.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {activity.category}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock size={14} className="mr-1 text-gray-400" />
                        {activity.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(activity.difficulty)}`}>
                        {activity.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSign size={14} className="mr-1 text-gray-400" />
                        {activity.price}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users size={14} className="mr-1 text-gray-400" />
                        {activity.maxParticipants}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(activity)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id || '')}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              All Activities ({filteredActivities.length})
            </h3>
          </div>
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-3xl">{activity.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{activity.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">{activity.category}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id || '')}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center text-sm">
                  <Clock size={14} className="mr-2 text-gray-400" />
                  <span>{activity.duration}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users size={14} className="mr-2 text-gray-400" />
                  <span>{activity.maxParticipants} max</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(activity.difficulty)}`}>
                    {activity.difficulty}
                  </span>
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign size={16} className="mr-1" />
                    <span>{activity.price}</span>
                  </div>
                </div>
              </div>
              
              {activity.equipment.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Required equipment:</p>
                  <div className="flex flex-wrap gap-1">
                    {activity.equipment.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {item}
                      </span>
                    ))}
                    {activity.equipment.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{activity.equipment.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first activity.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityManagement;
