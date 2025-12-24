import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MapPin, Users, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import RealAdminApiService, { type Campsite } from '../../services/RealAdminApiService';
import ImageUpload from './ImageUpload';


const CampsiteManagement = () => {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Omit<Campsite, 'id'>>({
    name: '',
    location: '',
    price: 0,
    rating: 0,
    description: '',
    features: [],
    image: '',
    images: [],
    capacity: 0,
    availability: 'available',
    type: 'tent',
    status: 'active'
  });

  const adminService = RealAdminApiService.getInstance();

  useEffect(() => {
    loadCampsites();
  }, []);

  const loadCampsites = async () => {
    try {
      console.log('🔄 Loading campsites...');
      const campsitesData = await adminService.getCampsites();
      console.log('📊 Campsites data received:', campsitesData);
      console.log('🔢 Number of campsites:', campsitesData.length);
      setCampsites(campsitesData);
      console.log('✅ Campsites state updated');
    } catch (error) {
      console.error('❌ Error loading campsites:', error);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      location: '',
      price: 0,
      rating: 0,
      description: '',
      features: [],
      image: '',
      images: [],
      capacity: 0,
      availability: 'available',
      type: 'tent',
      status: 'active'
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (campsite: Campsite) => {
    setFormData({
      name: campsite.name,
      location: campsite.location,
      price: campsite.price,
      rating: campsite.rating,
      description: campsite.description,
      features: [...campsite.features],
      image: campsite.image || '',
      images: campsite.images || [],
      capacity: campsite.capacity,
      availability: campsite.availability,
      type: campsite.type,
      status: campsite.status
    });
    setEditingId(campsite.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campsite?')) {
      try {
        const result = await adminService.deleteCampsite(id);
        if (result.success) {
          console.log('✅ Campsite deleted successfully, reloading list...');
          await loadCampsites();
        } else {
          console.error('❌ Failed to delete campsite:', result.message);
        }
      } catch (error) {
        console.error('❌ Error deleting campsite:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Campsite form submission started');
    console.log('📝 Form data:', formData);
    console.log('✏️ Editing ID:', editingId);

    // Store original campsite data BEFORE making API call
    let originalCampsite: Campsite | undefined = undefined;
    if (editingId) {
      originalCampsite = campsites.find(campsite => campsite.id === editingId);
      console.log('📋 Stored original campsite data:', originalCampsite);
    }

    try {
      console.log('🎯 Form data to submit:', formData);

      let response;
      if (editingId) {
        console.log('🔄 Updating existing campsite with ID:', editingId);
        response = await adminService.updateCampsite(editingId, formData);
      } else {
        console.log('➕ Creating new campsite');
        response = await adminService.addCampsite(formData);
      }

      console.log('📥 Admin service response:', response);

      if (response?.success) {
        console.log('✅ Campsite save successful');

        // Log campsite changes for debugging
        if (editingId && originalCampsite) {
          console.log('🔍 Using stored original campsite data for comparison');
          console.log('🔔 Checking for campsite changes...');
          console.log('📋 Original campsite found:', {
            id: originalCampsite.id,
            name: originalCampsite.name,
            location: originalCampsite.location,
            price: originalCampsite.price,
            capacity: originalCampsite.capacity,
            status: originalCampsite.status
          });
          console.log('📋 Updated data:', {
            name: formData.name,
            location: formData.location,
            price: formData.price,
            capacity: formData.capacity,
            status: formData.status
          });

          // Check for changes in location, price, capacity, or status
          const changes: string[] = [];

          if (originalCampsite.location !== formData.location) {
            changes.push(`location changed from "${originalCampsite.location}" to "${formData.location}"`);
            console.log('ℹ️ Location change detected');
          }

          if (originalCampsite.price !== formData.price) {
            changes.push(`price changed from $${originalCampsite.price} to $${formData.price}`);
            console.log('ℹ️ Price change detected');
          }

          if (originalCampsite.capacity !== formData.capacity) {
            changes.push(`capacity changed from ${originalCampsite.capacity} to ${formData.capacity} people`);
            console.log('ℹ️ Capacity change detected');
          }

          if (originalCampsite.status !== formData.status) {
            changes.push(`status changed from "${originalCampsite.status}" to "${formData.status}"`);
            console.log('ℹ️ Status change detected');
          }

          console.log('📋 Total changes detected:', changes.length);
          console.log('📋 Changes array:', changes);

          if (changes.length > 0) {
            const changeMessage = `${formData.name}: ${changes.join(', ')}`;
            console.log('✅ Campsite changes logged:', changeMessage);
          } else {
            console.log('😐 No significant changes detected');
          }
        } else if (!editingId) {
          console.log('🆕 New campsite created:', formData.name);
        } else {
          console.warn('⚠️ Original campsite not found for ID:', editingId);
          console.log('📋 Current campsites state:', campsites.map(c => ({ id: c.id, name: c.name })));
        }

        toast.success(editingId ? 'Campsite updated successfully' : 'Campsite created successfully');
        console.log('🔄 Reloading campsites list...');
        await loadCampsites();
        setIsFormOpen(false);
        console.log('✅ Form reset and closed');
      } else {
        console.error('❌ Failed to save campsite:', response?.message || 'Unknown error');
        toast.error(response?.message || 'Failed to save campsite');
      }
    } catch (error) {
      console.error('❌ Error submitting campsite:', error);
    } finally {
      console.log('🏁 Campsite form submission completed');
    }
  };

  const handleFeatureAdd = (feature: string) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const handleFeatureRemove = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  const filteredCampsites = campsites.filter(campsite =>
    campsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campsite.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Campsite Management</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Campsite</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <input
          type="text"
          placeholder="Search campsites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingId ? 'Edit Campsite' : 'Add New Campsite'}
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
                      Campsite Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Night ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity (people) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating (1-5) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="tent">Tent Site</option>
                      <option value="rv">RV Site</option>
                      <option value="cabin">Cabin</option>
                      <option value="glamping">Glamping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability *
                    </label>
                    <select
                      required
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="available">Available</option>
                      <option value="limited">Limited</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleFeatureRemove(feature)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['WiFi', 'Bathrooms', 'Fire Pits', 'Hiking Trails', 'Lake Access', 'Picnic Tables', 'Electricity', 'Showers'].map(feature => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => handleFeatureAdd(feature)}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                        disabled={formData.features.includes(feature)}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Image Upload */}
                <ImageUpload
                  mode="single"
                  currentImages={formData.image ? [formData.image] : []}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, image: images[0] || '' }))}
                  label="Main Image"
                  required={false}
                />

                {/* Additional Images Upload */}
                <ImageUpload
                  mode="multiple"
                  currentImages={formData.images || []}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                  label="Additional Images (Gallery)"
                  maxFiles={10}
                  required={false}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
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

      {/* Campsites List */}
      <div>
        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              All Campsites ({filteredCampsites.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campsite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCampsites.map((campsite) => (
                  <tr key={campsite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campsite.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{campsite.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        {campsite.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${campsite.price}/night
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users size={14} className="mr-1 text-gray-400" />
                        {campsite.capacity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Star size={14} className="mr-1 text-yellow-400" />
                        {campsite.rating}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(campsite.availability)}`}>
                        {campsite.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(campsite)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(campsite.id)}
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
              All Campsites ({filteredCampsites.length})
            </h3>
          </div>
          {filteredCampsites.map((campsite) => (
            <div key={campsite.id} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{campsite.name}</h4>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={14} className="mr-1" />
                    <span className="text-sm">{campsite.location}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{campsite.description}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(campsite)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(campsite.id)}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center">
                  <Users size={16} className="mr-2 text-gray-400" />
                  <span className="text-sm font-medium">{campsite.capacity} people</span>
                </div>
                <div className="flex items-center">
                  <Star size={16} className="mr-2 text-yellow-400" />
                  <span className="text-sm font-medium">{campsite.rating}/5</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-gray-900">
                  ${campsite.price}/night
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getAvailabilityColor(campsite.availability)}`}>
                  {campsite.availability}
                </span>
              </div>

              {campsite.features.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {campsite.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                    {campsite.features.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{campsite.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampsites.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campsites found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first campsite.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampsiteManagement;
