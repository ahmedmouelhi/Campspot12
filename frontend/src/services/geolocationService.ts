import { toast } from 'react-toastify';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface NearbyService {
  id: string;
  name: string;
  type: 'campsite' | 'activity' | 'equipment';
  distance: number;
  latitude: number;
  longitude: number;
  rating: number;
  price?: number;
  description: string;
}

class GeolocationService {
  private static instance: GeolocationService;
  private currentLocation: LocationData | null = null;

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  // Get user's current location
  public async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      // Check if we already have a cached location
      if (this.currentLocation) {
        resolve(this.currentLocation);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          this.currentLocation = location;
          toast.success('Location detected successfully!');
          resolve(location);
        },
        (error) => {
          let message = 'Unable to retrieve your location.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          
          toast.error(message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Mock data for nearby services
  private getMockServices(): Omit<NearbyService, 'distance'>[] {
    return [
      {
        id: '1',
        name: 'Mountain View Campsite',
        type: 'campsite',
        latitude: 46.2044,
        longitude: 6.1432,
        rating: 4.8,
        price: 45,
        description: 'Beautiful mountain views with hiking trails'
      },
      {
        id: '2',
        name: 'Lake Geneva Camping',
        type: 'campsite',
        latitude: 46.4312,
        longitude: 6.9123,
        rating: 4.6,
        price: 38,
        description: 'Peaceful lakeside camping experience'
      },
      {
        id: '3',
        name: 'Alpine Adventure Tours',
        type: 'activity',
        latitude: 46.0207,
        longitude: 7.7491,
        rating: 4.9,
        price: 75,
        description: 'Guided mountain climbing and hiking'
      },
      {
        id: '4',
        name: 'Outdoor Gear Rental',
        type: 'equipment',
        latitude: 46.5197,
        longitude: 6.6323,
        rating: 4.7,
        description: 'Complete camping equipment rental service'
      },
      {
        id: '5',
        name: 'Forest Adventure Park',
        type: 'activity',
        latitude: 46.8182,
        longitude: 8.2275,
        rating: 4.5,
        price: 55,
        description: 'Zip-lining and tree-top adventures'
      },
      {
        id: '6',
        name: 'Riverside Camping',
        type: 'campsite',
        latitude: 46.9481,
        longitude: 7.4474,
        rating: 4.4,
        price: 32,
        description: 'Camping by the crystal-clear river'
      }
    ];
  }

  // Find nearby services based on current location
  public async findNearbyServices(maxDistance: number = 50): Promise<NearbyService[]> {
    const location = await this.getCurrentLocation();
    
    if (!location) {
      // Return services without distance calculation
      return this.getMockServices().map(service => ({
        ...service,
        distance: Math.random() * 50 // Random distance for demo
      }));
    }

    const services = this.getMockServices().map(service => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        service.latitude,
        service.longitude
      );

      return {
        ...service,
        distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
      };
    });

    // Filter by distance and sort by proximity
    return services
      .filter(service => service.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  // Get directions URL for a service
  public getDirectionsUrl(service: NearbyService): string {
    const destination = `${service.latitude},${service.longitude}`;
    
    // Check if user is on mobile for app deep linking
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open in Google Maps app
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    } else {
      // Open in web browser
      return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
  }

  // Clear cached location (useful for testing or when user changes location significantly)
  public clearLocationCache(): void {
    this.currentLocation = null;
    toast.info('Location cache cleared. Next search will request your location again.');
  }
}

export default GeolocationService;
