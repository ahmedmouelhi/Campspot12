import React, { useState } from 'react';
import { X, Mail, Phone, User, MessageSquare, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        equipmentInterest: 'None',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const equipmentOptions = [
        'None',
        'Tents',
        'Sleeping Bags',
        'Backpacks',
        'Cooking Equipment',
        'Other',
    ];

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim() || formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim() || !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!formData.message.trim() || formData.message.length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        }

        if (formData.message.length > 1000) {
            newErrors.message = 'Message must not exceed 1000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiService.submitContactForm(formData);

            if (response.success) {
                toast.success(response.message || 'Thank you for contacting us! We will get back to you soon.');

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    message: '',
                    equipmentInterest: 'None',
                });
                setErrors({});

                // Close modal after a short delay
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                toast.error(response.error || 'Failed to send message. Please try again.');
            }
        } catch (error: any) {
            console.error('Contact form error:', error);
            toast.error(error.message || 'An error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-auto z-50 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Contact Us</h2>
                            <p className="text-teal-100 text-sm mt-1">
                                We'd love to hear from you!
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-teal-100 transition-colors"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Your full name"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="your.email@example.com"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone (Optional)
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="+33 1 23 45 67 89"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        {/* Equipment Interest */}
                        <div>
                            <label htmlFor="equipmentInterest" className="block text-sm font-medium text-gray-700 mb-1">
                                Equipment Interest
                            </label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    id="equipmentInterest"
                                    name="equipmentInterest"
                                    value={formData.equipmentInterest}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
                                    disabled={isSubmitting}
                                >
                                    {equipmentOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Message Field */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={5}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none ${errors.message ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Tell us how we can help you..."
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                {errors.message ? (
                                    <p className="text-sm text-red-600">{errors.message}</p>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {formData.message.length}/1000 characters
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Message'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
