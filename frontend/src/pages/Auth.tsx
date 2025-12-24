import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Instagram, ArrowLeft, MapPin, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    instagramUrl: ''
  });

  const resetForms = () => {
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '', confirmPassword: '', instagramUrl: '' });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};

    if (!loginForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!loginForm.password) {
      newErrors.password = 'Password is required';
    } else if (loginForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};

    if (!registerForm.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (registerForm.name.trim().length < 2 || registerForm.name.trim().length > 50) {
      newErrors.name = 'Name must be between 2 and 50 characters';
    }

    if (!registerForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!registerForm.password) {
      newErrors.password = 'Password is required';
    } else if (registerForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(registerForm.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!registerForm.instagramUrl.trim()) {
      newErrors.instagramUrl = 'Instagram profile URL is required';
    } else if (!/^https?:\/\/(www\.)?instagram\.com\/.+/.test(registerForm.instagramUrl.trim())) {
      newErrors.instagramUrl = 'Please provide a valid Instagram profile URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const success = await login(loginForm.email, loginForm.password, navigate);
      if (success) {
        resetForms();
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      const success = await register(
        registerForm.name, 
        registerForm.email, 
        registerForm.password, 
        registerForm.instagramUrl, 
        navigate
      );
      if (success) {
        resetForms();
      }
    } catch (error) {
      console.error('Register error:', error);
    }
    setLoading(false);
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForms();
    // Update URL without navigation
    window.history.replaceState({}, '', `/auth?mode=${newMode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-teal-300/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-300/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding and Info */}
        <div className="hidden lg:block text-center lg:text-left">
          <Link to="/" className="inline-flex items-center space-x-3 mb-8 text-teal-600 hover:text-teal-700 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-lg font-medium">Back to CampSpot</span>
          </Link>
          
          <div className="mb-8">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-4xl font-bold text-teal-600">CampSpot</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              {mode === 'login' ? 'Welcome Back!' : 'Join the Adventure'}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              {mode === 'login' 
                ? 'Sign in to access your bookings, explore new destinations, and continue your outdoor journey with us.'
                : 'Create your account and start exploring premium camping spots, activities, and equipment rentals worldwide.'
              }
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 max-w-md">
            {[
              { icon: '🏕️', text: '500+ Premium Campsites', gradient: 'from-green-500 to-emerald-600' },
              { icon: '🎯', text: '50+ Adventure Activities', gradient: 'from-blue-500 to-cyan-600' },
              { icon: '🎒', text: '1000+ Equipment Items', gradient: 'from-purple-500 to-indigo-600' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center text-lg shadow-lg`}>
                  {feature.icon}
                </div>
                <span className="font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-8 flex items-center justify-center lg:justify-start space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Star className="text-yellow-400 fill-current" size={16} />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="text-teal-500" size={16} />
              <span>50+ countries</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="text-blue-500" size={16} />
              <span>10K+ users</span>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden p-6 text-center border-b border-gray-100">
              <Link to="/" className="inline-flex items-center space-x-2 text-teal-600 hover:text-teal-700 transition-colors mb-4">
                <ArrowLeft size={18} />
                <span>Back to CampSpot</span>
              </Link>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="text-2xl font-bold text-teal-600">CampSpot</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-50">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-4 px-6 text-center transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-white text-teal-600 font-semibold shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-4 px-6 text-center transition-all duration-200 ${
                  mode === 'register'
                    ? 'bg-white text-teal-600 font-semibold shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'login' 
                    ? 'Enter your credentials to access your account'
                    : 'Fill in your details to get started'
                  }
                </p>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.email ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.password ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 focus:ring-4 focus:ring-teal-200 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.name ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.email ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.password ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Instagram Profile URL
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="url"
                        value={registerForm.instagramUrl}
                        onChange={(e) => setRegisterForm({ ...registerForm, instagramUrl: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                          errors.instagramUrl ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="https://instagram.com/yourusername"
                      />
                    </div>
                    {errors.instagramUrl && <p className="text-red-500 text-sm mt-1">{errors.instagramUrl}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 focus:ring-4 focus:ring-teal-200 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>
              )}

              {/* Footer Text */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                  >
                    {mode === 'login' ? 'Sign up here' : 'Sign in here'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;