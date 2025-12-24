import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Campsites from './pages/Campsites';
import CampsiteDetail from './pages/CampsiteDetail';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import About from './pages/About';
import Blog from './pages/Blog';
import Equipment from './pages/Equipment';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import BookingDetails from './pages/BookingDetails';
import Contact from './pages/Contact';
import AdminDashboard from './pages/admin/AdminDashboard';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname.startsWith('/auth');

  return (
    <div className="min-h-screen">
      {/* Conditionally render Navbar - hide on admin and auth routes */}
      {!isAdminRoute && !isAuthRoute && <Navbar />}

      {/* Conditionally apply padding - only when navbar is visible */}
      <main className={isAdminRoute || isAuthRoute ? '' : 'pt-16'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campsites" element={<Campsites />} />
          <Route path="/campsites/:id" element={<CampsiteDetail />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={
            <ProtectedRoute message="Please log in to access your profile">
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute message="Please log in to complete checkout">
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute message="Please log in to complete payment">
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/booking/:id" element={
            <ProtectedRoute message="Please log in to view booking details">
              <BookingDetails />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true} message="Admin access required">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>

      {/* Footer - hide on admin and auth routes */}
      {!isAdminRoute && !isAuthRoute && <Footer />}

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-bottom-right"
        toastClassName="toast-item"
        style={{
          bottom: '1rem',
          right: '1rem',
          top: 'auto'
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
