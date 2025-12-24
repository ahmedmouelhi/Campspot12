import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface BookingIntent {
  item: {
    name: string;
    type: 'campsite' | 'activity' | 'equipment';
    id?: string;
  };
  page: string;
}

export const useAuthCheck = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const checkAuthAndExecute = (
    action: () => void,
    options?: {
      requireAuth?: boolean;
      bookingIntent?: BookingIntent;
      redirectPath?: string;
      message?: string;
    }
  ) => {
    const {
      requireAuth = true,
      bookingIntent,
      redirectPath,
      message = "Please log in to continue"
    } = options || {};

    if (requireAuth && !isAuthenticated) {
      // Store booking intent if provided
      if (bookingIntent) {
        sessionStorage.setItem('booking_intent', JSON.stringify(bookingIntent));
      }

      // Store redirect path if provided
      if (redirectPath) {
        sessionStorage.setItem('redirect_after_login', redirectPath);
        sessionStorage.setItem('add_to_cart_redirect', 'true');
      }

      toast.info(message);
      navigate('/auth?mode=login');
      return false;
    }

    // Execute the action if authenticated or auth not required
    action();
    return true;
  };

  const requireAuth = (
    action: () => void,
    bookingIntent?: BookingIntent,
    message?: string
  ) => {
    return checkAuthAndExecute(action, {
      requireAuth: true,
      bookingIntent,
      message
    });
  };

  const requireAuthForBooking = (
    campsite: { name: string; id?: string },
    redirectPage: string = '/campsites'
  ) => {
    if (!isAuthenticated) {
      const bookingIntent: BookingIntent = {
        item: {
          name: campsite.name,
          type: 'campsite',
          id: campsite.id
        },
        page: redirectPage
      };
      
      sessionStorage.setItem('booking_intent', JSON.stringify(bookingIntent));
      toast.info(`Please log in to book ${campsite.name}`);
      navigate('/auth?mode=login');
      return false;
    }
    return true;
  };

  const requireAuthForCart = (
    itemName: string,
    itemType: 'equipment' | 'activity' = 'equipment',
    redirectPath: string = '/equipment'
  ) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirect_after_login', redirectPath);
      sessionStorage.setItem('add_to_cart_redirect', 'true');
      toast.info(`Please log in to add ${itemName} to cart`);
      navigate('/auth?mode=login');
      return false;
    }
    return true;
  };

  const requireAuthForCheckout = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('checkout_redirect', 'true');
      toast.info("Please log in to complete your booking");
      navigate('/auth?mode=login');
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    user,
    checkAuthAndExecute,
    requireAuth,
    requireAuthForBooking,
    requireAuthForCart,
    requireAuthForCheckout
  };
};