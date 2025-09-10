import React, { useState, useEffect } from 'react';
import { Calendar, Users, X, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';
import { useCart } from '../contexts/CartContext';

// Define Equipment interface locally
interface Equipment {
  _id: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  period: string;
  description: string;
  features: string[] | string; // Can be array or space-separated string
  image: string;
  imageId?: string;
  imageUrl?: string;
  availability: 'Available' | 'Limited' | 'Unavailable';
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Fair';
}

const Equipment = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [rentalData, setRentalData] = useState({
    startDate: '',
    endDate: '',
    quantity: 1
  });
  
  const { addEquipment, isDateAvailable } = useCart();

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getEquipment();
        // Handle standardized API response format
        const equipmentData = response.success ? response.data : (response.data || response);
        setEquipment(Array.isArray(equipmentData) ? equipmentData : []);
      } catch (err: any) {
        console.error('Error loading equipment:', err);
        setError('Failed to load equipment. Please try again later.');
        toast.error('Failed to load equipment');
      } finally {
        setLoading(false);
      }
    };
    
    loadEquipment();
    
    // Set up interval to refresh equipment data every 30 seconds
    const refreshInterval = setInterval(() => {
      if (!loading) {
        loadEquipment();
      }
    }, 30000);

    // Listen for focus events to refresh when user returns to tab
    const handleFocus = () => {
      if (!loading) {
        loadEquipment();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Remove loading dependency to prevent infinite loop

  // Get unique categories from equipment data
  const categories = ['All', ...Array.from(new Set(equipment.map(item => item.category)))];

  const filteredEquipment = selectedCategory === 'All' 
    ? equipment 
    : equipment.filter(item => item.category === selectedCategory);

  const getAvailabilityColor = (availability: string) => {
    switch(availability) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Limited': return 'bg-yellow-100 text-yellow-800';
      case 'Unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to render equipment image with fallback
  const renderEquipmentImage = (item: Equipment) => {
    if (item.imageUrl) {
      return (
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      );
    }
    return null;
  };

  const handleRentClick = (item: Equipment) => {
    if (item.availability === 'Unavailable') {
      return;
    }
    setSelectedEquipment(item);
    setRentalData({
      startDate: '',
      endDate: '',
      quantity: 1
    });
    setShowRentalModal(true);
  };

  const handleRentalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment || !rentalData.startDate || !rentalData.endDate) {
      return;
    }

    // Check if dates are available
    if (!isDateAvailable('equipment', selectedEquipment.id, rentalData.startDate, rentalData.endDate)) {
      alert('These dates conflict with an existing booking for this equipment.');
      return;
    }

    // Check if quantity is available
    if (rentalData.quantity > selectedEquipment.quantity) {
      alert(`Only ${selectedEquipment.quantity} items available.`);
      return;
    }

    // Use _id if available, fallback to id for backward compatibility
    const equipmentForCart = {
      ...selectedEquipment,
      id: selectedEquipment.id || selectedEquipment._id
    };
    addEquipment(equipmentForCart, rentalData.startDate, rentalData.endDate, rentalData.quantity);
    toast.success(`🎒 ${selectedEquipment.name} added to cart!`);
    setShowRentalModal(false);
    setSelectedEquipment(null);
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 365); // 1 year from now
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Équipement de Location</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Louez tout l'équipement dont vous avez besoin pour votre aventure en plein air. 
            Matériel professionnel, entretenu et vérifié régulièrement.
          </p>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border border-gray-300 hover:bg-teal-600 hover:text-white hover:border-teal-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading equipment...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEquipment.map((item) => (
              <div key={item._id || item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-teal-400 to-blue-500">
                  {renderEquipmentImage(item)}
                  <div className="absolute inset-0 flex items-center justify-center text-6xl" style={item.imageUrl ? {display: 'none'} : {}}>
                    {item.image || '🎒'}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {item.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(item.availability)}`}>
                      {item.availability}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Caractéristiques:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {(typeof item.features === 'string' ? item.features.split(' ') : item.features).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-teal-600 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-teal-600">
                      €{item.price}
                      <span className="text-sm font-normal text-gray-600">/{item.period}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRentClick(item)}
                    className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      item.availability === 'Available'
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : item.availability === 'Limited'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    disabled={item.availability === 'Unavailable'}
                  >
                    {item.availability !== 'Unavailable' && <ShoppingCart size={16} />}
                    <span>
                      {item.availability === 'Available' && 'Louer maintenant'}
                      {item.availability === 'Limited' && 'Stock limité - Réserver'}
                      {item.availability === 'Unavailable' && 'Non disponible'}
                    </span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
          
          {!loading && !error && filteredEquipment.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedCategory === 'All' ? 'No equipment available at the moment.' : `No equipment available in ${selectedCategory} category.`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Rental Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Information de Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Réservation Simple</h3>
              <p className="text-gray-600">Réservez votre équipement en ligne et récupérez-le le jour de votre départ.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Matériel Vérifié</h3>
              <p className="text-gray-600">Tout notre équipement est vérifié et entretenu régulièrement par des professionnels.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Livraison Possible</h3>
              <p className="text-gray-600">Service de livraison disponible pour les grosses commandes dans un rayon de 50km.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'Aide pour Choisir?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Nos experts sont là pour vous conseiller et vous aider à choisir l'équipement adapté à votre aventure.
          </p>
          <button className="bg-yellow-500 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
            Contactez nos Experts
          </button>
        </div>
      </section>

      {/* Rental Modal */}
      {showRentalModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Louer {selectedEquipment.name}
                </h3>
                <button
                  onClick={() => setShowRentalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{selectedEquipment.image}</span>
                  <div>
                    <div className="text-lg font-semibold">{selectedEquipment.name}</div>
                    <div className="text-sm text-gray-600">€{selectedEquipment.price}/{selectedEquipment.period}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRentalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      required
                      min={getTomorrowDate()}
                      max={getMaxDate()}
                      value={rentalData.startDate}
                      onChange={(e) => setRentalData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      required
                      min={rentalData.startDate || getTomorrowDate()}
                      max={getMaxDate()}
                      value={rentalData.endDate}
                      onChange={(e) => setRentalData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité * (Disponible: {selectedEquipment.quantity})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedEquipment.quantity}
                    value={rentalData.quantity}
                    onChange={(e) => setRentalData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Price Preview */}
                {rentalData.startDate && rentalData.endDate && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Prix estimé:</div>
                    <div className="text-lg font-semibold text-teal-600">
                      €{(selectedEquipment.price * rentalData.quantity * Math.max(1, Math.ceil((new Date(rentalData.endDate).getTime() - new Date(rentalData.startDate).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.max(1, Math.ceil((new Date(rentalData.endDate).getTime() - new Date(rentalData.startDate).getTime()) / (1000 * 60 * 60 * 24)))} jour(s) × {rentalData.quantity} article(s)
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart size={16} />
                    <span>Ajouter au panier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRentalModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
