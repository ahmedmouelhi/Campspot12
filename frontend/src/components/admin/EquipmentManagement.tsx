import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Package, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';
import ImageUploadService from '../../services/imageUploadService';
import EquipmentNotificationService from '../../services/equipmentNotificationService';
import NotificationService from '../../services/notificationService';

// Define Equipment interface to match API
interface Equipment {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  image: string;
  imageId?: string;
  imageUrl?: string;
  availability: 'Available' | 'Limited' | 'Unavailable';
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Fair';
  status?: 'active' | 'inactive';
  lastUpdated?: string;
  createdAt?: string;
}

const EquipmentManagement = () => {
  const [items, setItems] = useState<Equipment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Equipment, 'id' | '_id'>>({
    name: '',
    category: '',
    price: 0,
    period: 'day',
    description: '',
    features: [],
    image: '',
    imageId: '',
    imageUrl: '',
    availability: 'Available',
    quantity: 1,
    condition: 'Good'
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const imageService = ImageUploadService.getInstance();
  const equipmentNotificationService = EquipmentNotificationService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEquipment();
      
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        console.error('Failed to load equipment:', response.message);
        toast.error('Failed to load equipment');
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Error loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      category: '',
      price: 0,
      period: 'day',
      description: '',
      features: [],
      image: '',
      imageId: '',
      imageUrl: '',
      availability: 'Available',
      quantity: 1,
      condition: 'Good'
    });
    setEditingId(null);
    setSelectedImage(null);
    setImagePreview('');
    setIsFormOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      period: item.period,
      description: item.description,
      features: [...item.features],
      image: item.image,
      imageId: item.imageId || '',
      imageUrl: item.imageUrl || '',
      availability: item.availability,
      quantity: item.quantity,
      condition: item.condition
    });
    setEditingId(item._id || item.id || null);
    setSelectedImage(null);
    setImagePreview(item.imageUrl || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string | undefined) => {
    console.log('🗑️ Delete button clicked for ID:', id);
    
    if (!id) {
      console.error('❌ No ID provided for delete');
      toast.error('Cannot delete: No ID provided');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this equipment item?')) {
      try {
        setLoading(true);
        console.log('🔄 Calling API delete for ID:', id);
        const response = await apiService.deleteEquipment(id);
        console.log('📤 Delete response:', response);
        
        if (response.success) {
          toast.success('Equipment deleted successfully');
          await loadItems(); // Reload the list
        } else {
          console.error('Failed to delete equipment:', response.message);
          toast.error('Failed to delete equipment');
        }
      } catch (error) {
        console.error('Error deleting equipment:', error);
        toast.error('Error deleting equipment');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Equipment form submission started');
    console.log('📝 Form data:', formData);
    console.log('🖼️ Selected image:', selectedImage?.name || 'None');
    console.log('✏️ Editing ID:', editingId);
    
    try {
      setLoading(true);
      let finalFormData = { ...formData };
      
      // Handle image upload if a new image was selected
      if (selectedImage) {
        console.log('📤 Uploading image...');
        try {
          const uploadResult = await imageService.uploadImage(selectedImage, {
            maxWidth: 800,
            maxHeight: 600,
            quality: 0.8
          });
          
          console.log('📥 Image upload result:', uploadResult);
          
          if (uploadResult.success && uploadResult.imageId) {
            finalFormData.imageId = uploadResult.imageId;
            finalFormData.imageUrl = uploadResult.previewUrl || '';
            finalFormData.image = uploadResult.previewUrl || formData.image;
            console.log('✅ Image upload successful, updated form data');
          } else {
            console.warn('⚠️ Image upload failed or no imageId returned');
          }
        } catch (error) {
          console.error('❌ Error uploading image:', error);
          toast.error('Error uploading image');
        }
      }
      
      console.log('🎯 Final form data to submit:', finalFormData);
      
      let response;
      if (editingId) {
        console.log('🔄 Updating existing equipment with ID:', editingId);
        response = await apiService.updateEquipment(editingId, finalFormData);
      } else {
        console.log('➕ Creating new equipment');
        response = await apiService.createEquipment(finalFormData);
      }
      
      console.log('📥 API response:', response);
      
      if (response.success) {
        console.log('✅ Equipment save successful');
        
        // Trigger notifications for equipment changes
        if (editingId) {
          // Find the original equipment item to compare changes
          const originalItem = items.find(item => (item._id || item.id) === editingId);
          if (originalItem) {
            console.log('🔔 Checking for availability changes...');
            console.log('📋 Original:', { availability: originalItem.availability, quantity: originalItem.quantity });
            console.log('📋 Updated:', { availability: finalFormData.availability, quantity: finalFormData.quantity });
            
            // Check if availability or quantity changed
            if (originalItem.availability !== finalFormData.availability || 
                originalItem.quantity !== finalFormData.quantity) {
              
              const updatedEquipment: Equipment = {
                ...originalItem,
                ...finalFormData,
                id: originalItem._id || originalItem.id || '',
                _id: originalItem._id
              };
              
              // Trigger equipment notification
              equipmentNotificationService.checkAvailabilityChange(originalItem, updatedEquipment);
              
              // Send general notification to all users
              let changeMessage = '';
              if (originalItem.availability !== finalFormData.availability) {
                changeMessage = `${finalFormData.name} availability changed from ${originalItem.availability} to ${finalFormData.availability}`;
              } else if (originalItem.quantity !== finalFormData.quantity) {
                changeMessage = `${finalFormData.name} quantity changed from ${originalItem.quantity} to ${finalFormData.quantity}`;
              }
              
              if (changeMessage) {
                await notificationService.sendNotification({
                  title: 'Equipment Updated',
                  message: changeMessage,
                  type: 'info',
                  metadata: {
                    equipmentId: updatedEquipment.id,
                    equipmentName: updatedEquipment.name,
                    changeType: 'equipment_update'
                  }
                });
                console.log('📢 Equipment change notification sent');
              }
            }
          }
        } else {
          // New equipment created - send notification
          await notificationService.sendNotification({
            title: 'New Equipment Added',
            message: `${finalFormData.name} has been added to the equipment inventory`,
            type: 'success',
            metadata: {
              equipmentName: finalFormData.name,
              changeType: 'equipment_created'
            }
          });
          console.log('📢 New equipment notification sent');
        }
        
        toast.success(editingId ? 'Equipment updated successfully' : 'Equipment created successfully');
        console.log('🔄 Reloading equipment list...');
        await loadItems(); // Reload the list
        setIsFormOpen(false);
        setSelectedImage(null);
        setImagePreview('');
        console.log('✅ Form reset and closed');
      } else {
        console.error('❌ Failed to save equipment:', response.message);
        toast.error('Failed to save equipment');
      }
    } catch (error) {
      console.error('❌ Error saving equipment:', error);
      toast.error('Error saving equipment');
    } finally {
      setLoading(false);
      console.log('🏁 Equipment form submission completed');
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = imageService.validateFile(file);
      if (!validation.isValid) {
        alert(`Invalid file: ${validation.error}`);
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '', imageId: '', imageUrl: '' }));
  };

  const getImageDisplay = (item: Equipment) => {
    if (item.imageUrl) {
      return (
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-12 h-12 object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    return <div className="text-2xl">{item.image || '🎒'}</div>;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Equipment Management</h2>
        <button
          onClick={handleAddNew}
          disabled={loading}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingId ? 'Edit Equipment' : 'Add New Equipment'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Shelter, Sleeping, Cooking"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Period *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rental Period *
                    </label>
                    <select
                      required
                      value={formData.period}
                      onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition *
                    </label>
                    <select
                      required
                      value={formData.condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {imagePreview ? (
                      <div className="text-center">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg mb-4"
                        />
                        <div className="flex flex-col sm:flex-row justify-center gap-2">
                          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                            <Upload size={16} />
                            <span>Change Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                          >
                            <X size={16} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="flex flex-col items-center">
                          <label className="cursor-pointer bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
                            <Upload size={16} />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                          <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Emoji/Icon fallback */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon/Emoji (fallback if no image)
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., 🏕️, ⛺, 🎒"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
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
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleFeatureRemove(feature)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Waterproof', 'Lightweight', 'Compact', 'Durable', 'Rechargeable', 'Insulated', 'All-weather', 'Portable'].map(feature => (
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

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    <span>{loading ? 'Saving...' : editingId ? 'Update' : 'Create'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    disabled={loading}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Equipment List */}
      <div>
        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Equipment ({filteredItems.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading equipment...
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id || item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getImageDisplay(item)}
                            <div className="text-2xl hidden">{item.image || '🎒'}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ${item.price}/{item.period}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.availability === 'Available' ? 'bg-green-100 text-green-800' : item.availability === 'Limited' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {item.availability}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            disabled={loading}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id || item.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Equipment ({filteredItems.length})
            </h3>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center text-gray-500">
                Loading equipment...
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item._id || item.id} className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {getImageDisplay(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                      disabled={loading}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id || item.id)}
                      className="text-red-600 hover:text-red-900 p-2"
                      disabled={loading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="font-medium text-orange-600">${item.price}/{item.period}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Quantity:</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Condition:</span>
                    <span className="text-sm font-medium">{item.condition}</span>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${item.availability === 'Available' ? 'bg-green-100 text-green-800' : item.availability === 'Limited' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {item.availability}
                  </span>
                </div>
                
                {item.features.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {item.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                      {item.features.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          +{item.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment items found</h3>
              <p className="text-gray-500">
                {searchTerm || filterCategory !== 'all' ? 'Try adjusting your search or filter.' : 'Get started by adding your first equipment item.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentManagement;

