import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    CreditCard, Lock, ArrowLeft, CheckCircle, Shield,
    MapPin, Calendar, Users, AlertCircle, HelpCircle
} from 'lucide-react';
import apiService from '../services/apiService';

interface PaymentFormData {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardName: string;
}

const Payment = () => {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const location = useLocation();
    const booking = location.state?.booking;

    const [isProcessing, setIsProcessing] = useState(false);
    const [cardBrand, setCardBrand] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentFormData>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: ''
    });

    // Calculate pricing breakdown
    const calculatePricing = () => {
        const basePrice = typeof booking?.price === 'number' ? booking.price : parseFloat(booking?.price || '0');
        const nights = booking?.nights || 1;
        const pricePerNight = basePrice / nights;
        const serviceFee = basePrice * 0.05; // 5% service fee
        const taxes = basePrice * 0.10; // 10% tax
        const total = basePrice + serviceFee + taxes;

        return {
            pricePerNight: pricePerNight.toFixed(2),
            nights,
            subtotal: basePrice.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            taxes: taxes.toFixed(2),
            total: total.toFixed(2)
        };
    };

    const pricing = booking ? calculatePricing() : null;

    // Detect card brand
    const detectCardBrand = (cardNumber: string) => {
        const number = cardNumber.replace(/\s/g, '');

        if (/^4/.test(number)) return 'visa';
        if (/^5[1-5]/.test(number)) return 'mastercard';
        if (/^3[47]/.test(number)) return 'amex';
        if (/^6(?:011|5)/.test(number)) return 'discover';

        return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
        setCardBrand(detectCardBrand(formatted));
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        setPaymentData(prev => ({ ...prev, expiryDate: value }));
    };

    const validateForm = (): boolean => {
        if (!paymentData.cardName.trim()) {
            toast.error('Please enter the name on card');
            return false;
        }

        const cardDigits = paymentData.cardNumber.replace(/\s/g, '');
        if (cardDigits.length !== 16) {
            toast.error('Please enter a valid 16-digit card number');
            return false;
        }

        const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!expiryRegex.test(paymentData.expiryDate)) {
            toast.error('Please enter a valid expiry date (MM/YY)');
            return false;
        }

        if (paymentData.cvv.length !== 3 && paymentData.cvv.length !== 4) {
            toast.error('Please enter a valid CVV');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!booking) {
            toast.error('Booking information not found');
            return;
        }

        setIsProcessing(true);

        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Call backend to mark booking as completed
            const response = await apiService.completePayment(booking._id || booking.id);

            if (response.success) {
                toast.success('🎉 Payment successful!');
                toast.info('Your booking is now completed. Check your email for details.');

                // Navigate back to profile
                setTimeout(() => {
                    navigate('/profile#bookings');
                }, 2000);
            }

        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error('❌ Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking not found</h2>
                    <p className="text-gray-600 mb-8">Please select a booking from your profile.</p>
                    <button
                        onClick={() => navigate('/profile#bookings')}
                        className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                        Go to Bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/profile#bookings')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Bookings
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Booking Summary */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Booking Reference & Status */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
                                    <p className="text-gray-600">
                                        Reference: <span className="font-mono font-semibold text-teal-600">#{bookingId?.slice(-8).toUpperCase()}</span>
                                    </p>
                                </div>
                                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold border-2 border-blue-200 flex items-center space-x-2">
                                    <CheckCircle size={20} />
                                    <span>Approved - Pending Payment</span>
                                </span>
                            </div>

                            {/* Booking Details */}
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <MapPin className="text-teal-600 mt-1 flex-shrink-0" size={24} />
                                    <div>
                                        <p className="font-semibold text-lg text-gray-900">{booking.name}</p>
                                        {booking.location && (
                                            <p className="text-gray-600">{booking.location}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Calendar className="text-teal-600 flex-shrink-0" size={24} />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {booking.date} {booking.endDate && `- ${booking.endDate}`}
                                        </p>
                                        {booking.nights && (
                                            <p className="text-sm text-gray-600">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</p>
                                        )}
                                    </div>
                                </div>

                                {booking.guests && (
                                    <div className="flex items-center space-x-3">
                                        <Users className="text-teal-600 flex-shrink-0" size={24} />
                                        <p className="font-medium text-gray-900">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                                <Lock className="text-green-600" size={24} />
                            </div>

                            {/* Trust Signals */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start space-x-3">
                                    <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <p className="font-semibold text-blue-900 mb-1">Secure Payment</p>
                                        <p className="text-sm text-blue-700 mb-3">
                                            Your payment is encrypted and secure. We accept:
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-3 py-1 bg-white rounded border border-blue-200 text-xs font-semibold">VISA</span>
                                            <span className="px-3 py-1 bg-white rounded border border-blue-200 text-xs font-semibold">Mastercard</span>
                                            <span className="px-3 py-1 bg-white rounded border border-blue-200 text-xs font-semibold">Amex</span>
                                            <span className="text-xs text-blue-600 ml-auto flex items-center">
                                                <Lock size={12} className="mr-1" /> SSL Encrypted
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name on Card
                                    </label>
                                    <input
                                        type="text"
                                        name="cardName"
                                        value={paymentData.cardName}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        required
                                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Card Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            value={paymentData.cardNumber}
                                            onChange={handleCardNumberChange}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                            required
                                            className="w-full border-2 border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                        />
                                        {cardBrand && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold uppercase">
                                                    {cardBrand}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            name="expiryDate"
                                            value={paymentData.expiryDate}
                                            onChange={handleExpiryChange}
                                            placeholder="MM/YY"
                                            maxLength={5}
                                            required
                                            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            name="cvv"
                                            value={paymentData.cvv}
                                            onChange={handleInputChange}
                                            placeholder="123"
                                            maxLength={4}
                                            required
                                            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Cancellation Policy */}
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                                        <AlertCircle size={18} className="mr-2" />
                                        Cancellation Policy
                                    </h4>
                                    <p className="text-sm text-yellow-800">
                                        Free cancellation until 48 hours before check-in. After that, 50% refund if cancelled 24h before check-in.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Processing Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={20} />
                                            <span>Pay €{pricing?.total}</span>
                                        </>
                                    )}
                                </button>

                                {/* Post-Payment Info */}
                                <div className="text-center text-sm text-gray-600 mt-4">
                                    <p className="font-medium mb-2">After payment, you'll receive:</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>✓ Instant booking confirmation email</li>
                                        <li>✓ Detailed itinerary and directions</li>
                                        <li>✓ Host contact information</li>
                                    </ul>
                                    <a href="/payment-help" className="text-teal-600 hover:text-teal-700 font-medium mt-3 inline-flex items-center">
                                        <HelpCircle size={14} className="mr-1" />
                                        Need help with payment?
                                    </a>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Price Breakdown */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Price Details</h3>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-gray-700">
                                    <span>€{pricing?.pricePerNight} × {pricing?.nights} {pricing?.nights === 1 ? 'night' : 'nights'}</span>
                                    <span>€{pricing?.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Service fee</span>
                                    <span>€{pricing?.serviceFee}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Taxes (10%)</span>
                                    <span>€{pricing?.taxes}</span>
                                </div>
                            </div>

                            <div className="border-t-2 border-gray-200 pt-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-teal-600">€{pricing?.total}</span>
                                </div>
                            </div>

                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                                <p className="text-xs text-green-800 font-medium">
                                    ✓ No hidden fees<br />
                                    ✓ Free cancellation until 48h before check-in
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
