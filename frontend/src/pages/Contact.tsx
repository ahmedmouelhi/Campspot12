import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageCircle, Star, ExternalLink, Shield, ChevronDown, CheckCircle, AlertCircle, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        privacyConsent: false,
        file: null as File | null
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const subjectOptions = [
        'General Inquiry',
        'Booking Question',
        'Campsite Information',
        'Equipment Rental',
        'Payment Issue',
        'Cancellation Request',
        'Feedback',
        'Other'
    ];

    const faqs = [
        {
            question: 'What are your cancellation policies?',
            answer: 'You can cancel up to 48 hours before your booking for a full refund. Cancellations within 48 hours will receive a 50% refund.'
        },
        {
            question: 'Do you provide camping equipment?',
            answer: 'Yes! We offer a full range of camping equipment for rent including tents, sleeping bags, cooking gear, and more.'
        },
        {
            question: 'Are pets allowed at campsites?',
            answer: 'Most of our campsites are pet-friendly. Please check the specific campsite details or contact us for confirmation.'
        },
        {
            question: 'How do I modify my existing booking?',
            answer: 'Log into your account and go to "My Bookings" to modify dates, add equipment, or make other changes to your reservation.'
        }
    ];

    const validateField = (name: string, value: string | boolean) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || (typeof value === 'string' && value.trim().length < 2)) {
                    error = 'Name must be at least 2 characters';
                }
                break;
            case 'email':
                if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'phone':
                if (value && !/^[\d\s\-\+\(\)]+$/.test(value as string)) {
                    error = 'Please enter a valid phone number';
                }
                break;
            case 'subject':
                if (!value) {
                    error = 'Please select a subject';
                }
                break;
            case 'message':
                if (!value || (typeof value === 'string' && value.trim().length < 10)) {
                    error = 'Message must be at least 10 characters';
                }
                break;
            case 'privacyConsent':
                if (!value) {
                    error = 'You must agree to the privacy policy';
                }
                break;
        }

        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        validateField(name, type === 'checkbox' ? checked : value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
                return;
            }
            setFormData(prev => ({ ...prev, file }));
            setErrors(prev => ({ ...prev, file: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const nameValid = validateField('name', formData.name);
        const emailValid = validateField('email', formData.email);
        const subjectValid = validateField('subject', formData.subject);
        const messageValid = validateField('message', formData.message);
        const consentValid = validateField('privacyConsent', formData.privacyConsent);

        if (!nameValid || !emailValid || !subjectValid || !messageValid || !consentValid) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const response = await apiService.submitContactForm({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                subject: formData.subject,
                message: formData.message
            });

            if (response.success) {
                setSubmitStatus('success');
                toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                    privacyConsent: false,
                    file: null
                });
                setErrors({});
            } else {
                setSubmitStatus('error');
                toast.error('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setSubmitStatus('error');
            toast.error('An error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Skip to main content for accessibility */}
            <a href="#contact-form" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-teal-600 text-white px-4 py-2 rounded-lg z-50">
                Skip to contact form
            </a>

            {/* Hero Section */}
            <section
                className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white py-28 overflow-hidden"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 30%),
                        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 30%),
                        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                    `,
                    backgroundSize: 'cover, cover, 60px 60px',
                    backgroundPosition: 'center, center, center'
                }}
            >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 via-transparent to-purple-900/10 animate-pulse" style={{ animationDuration: '4s' }}></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 drop-shadow-lg" style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}>
                        Get in Touch
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow-md">
                        Have questions about camping? We're here to help you plan the perfect outdoor adventure.
                    </p>

                    {/* Response Time Badge */}
                    <div className="inline-flex items-center bg-white/15 backdrop-blur-md border border-white/30 rounded-full px-8 py-4 space-x-3 shadow-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105">
                        <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-2 rounded-full">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-lg">Average response time: 2 hours</span>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 -mt-12 relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column - Contact Information */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Contact Cards */}
                            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 p-4 rounded-xl shadow-lg">
                                        <Phone className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Phone</h3>
                                        <a href="tel:+33123456789" className="text-emerald-600 hover:text-emerald-700 font-semibold text-lg block">
                                            +33 1 23 45 67 89
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">Mon-Fri 9am-6pm CET</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-xl shadow-lg">
                                        <Mail className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Email</h3>
                                        <a href="mailto:contact@campspot.com" className="text-emerald-600 hover:text-emerald-700 font-semibold block break-all">
                                            contact@campspot.com
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">24h response time</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-xl shadow-lg">
                                        <MapPin className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Office</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            123 Camping Street<br />
                                            Paris, France 75001
                                        </p>
                                        <a
                                            href="https://www.google.com/maps/search/?api=1&query=123+Camping+Street+Paris+France"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-semibold mt-2 group"
                                        >
                                            <span>Get Directions</span>
                                            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Social Proof */}
                            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl shadow-lg p-6 border border-emerald-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Trusted by Campers</h3>
                                    <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-700 text-base leading-relaxed mb-4">
                                    "Excellent customer service! They helped us find the perfect campsite for our family vacation."
                                </p>
                                <p className="text-sm text-gray-600 font-semibold">— Marie D., Happy Camper</p>
                                <div className="mt-4 pt-4 border-t border-emerald-200">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold text-emerald-600">10,000+</span> satisfied customers
                                    </p>
                                </div>
                            </div>

                            {/* Business Info */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                    <span>Business Information</span>
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p><span className="font-semibold">Registration:</span> FR 123 456 789</p>
                                    <p><span className="font-semibold">VAT:</span> FR 98765432101</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Contact Form */}
                        <div className="lg:col-span-2">
                            <div id="contact-form" className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                                <p className="text-gray-600 text-lg mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

                                {/* Success Message */}
                                {submitStatus === 'success' && (
                                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3" role="alert" aria-live="polite">
                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-green-900">Message sent successfully!</h4>
                                            <p className="text-green-700 text-sm mt-1">We'll respond within 24 hours.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {submitStatus === 'error' && (
                                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3" role="alert" aria-live="polite">
                                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-900">Failed to send message</h4>
                                            <p className="text-red-700 text-sm mt-1">Please try again or contact us directly.</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name Field */}
                                        <div>
                                            <label htmlFor="name" className="block text-base font-semibold text-gray-900 mb-2">
                                                Your Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('name', e.target.value)}
                                                aria-invalid={!!errors.name}
                                                aria-describedby={errors.name ? 'name-error' : undefined}
                                                className={`w-full px-4 py-3 text-base border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="John Doe"
                                            />
                                            {errors.name && (
                                                <p id="name-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{errors.name}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Email Field */}
                                        <div>
                                            <label htmlFor="email" className="block text-base font-semibold text-gray-900 mb-2">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('email', e.target.value)}
                                                aria-invalid={!!errors.email}
                                                aria-describedby={errors.email ? 'email-error' : undefined}
                                                className={`w-full px-4 py-3 text-base border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && (
                                                <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{errors.email}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Phone Field */}
                                        <div>
                                            <label htmlFor="phone" className="block text-base font-semibold text-gray-900 mb-2">
                                                Phone Number <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('phone', e.target.value)}
                                                aria-invalid={!!errors.phone}
                                                aria-describedby={errors.phone ? 'phone-error' : undefined}
                                                className={`w-full px-4 py-3 text-base border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all`}
                                                placeholder="+33 1 23 45 67 89"
                                            />
                                            {errors.phone && (
                                                <p id="phone-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{errors.phone}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Subject Dropdown */}
                                        <div>
                                            <label htmlFor="subject" className="block text-base font-semibold text-gray-900 mb-2">
                                                Subject <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="subject"
                                                name="subject"
                                                required
                                                value={formData.subject}
                                                onChange={handleChange}
                                                onBlur={(e) => validateField('subject', e.target.value)}
                                                aria-invalid={!!errors.subject}
                                                aria-describedby={errors.subject ? 'subject-error' : undefined}
                                                className={`w-full px-4 py-3 text-base border ${errors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-xl focus:ring-2 focus:border-transparent transition-all appearance-none bg-white cursor-pointer`}
                                            >
                                                <option value="">Select a topic...</option>
                                                {subjectOptions.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            {errors.subject && (
                                                <p id="subject-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{errors.subject}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Field */}
                                    <div>
                                        <label htmlFor="message" className="block text-base font-semibold text-gray-900 mb-2">
                                            Message <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={6}
                                            value={formData.message}
                                            onChange={handleChange}
                                            onBlur={(e) => validateField('message', e.target.value)}
                                            aria-invalid={!!errors.message}
                                            aria-describedby={errors.message ? 'message-error' : undefined}
                                            className={`w-full px-4 py-3 text-base border ${errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'} rounded-xl focus:ring-2 focus:border-transparent resize-none transition-all`}
                                            placeholder="Tell us how we can help you..."
                                        />
                                        {errors.message && (
                                            <p id="message-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.message}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label htmlFor="file" className="block text-base font-semibold text-gray-900 mb-2">
                                            Attachment <span className="text-gray-500 text-sm font-normal">(Optional, max 5MB)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="file"
                                                name="file"
                                                onChange={handleFileChange}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                className="sr-only"
                                            />
                                            <label
                                                htmlFor="file"
                                                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors"
                                            >
                                                <div className="flex items-center space-x-2 text-gray-600">
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-base">
                                                        {formData.file ? formData.file.name : 'Click to upload file'}
                                                    </span>
                                                </div>
                                            </label>
                                            {formData.file && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                        {errors.file && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.file}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Privacy Consent */}
                                    <div>
                                        <label className="flex items-start space-x-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                name="privacyConsent"
                                                checked={formData.privacyConsent}
                                                onChange={handleChange}
                                                aria-invalid={!!errors.privacyConsent}
                                                aria-describedby={errors.privacyConsent ? 'privacy-error' : undefined}
                                                className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <span className="text-base text-gray-700 group-hover:text-gray-900">
                                                I agree to the <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-semibold underline">Privacy Policy</a> and <a href="/terms" className="text-emerald-600 hover:text-emerald-700 font-semibold underline">Terms of Service</a> <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        {errors.privacyConsent && (
                                            <p id="privacy-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1 ml-8">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{errors.privacyConsent}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-6 h-6" />
                                                <span>Send Message</span>
                                            </>
                                        )}
                                    </button>

                                    <p className="text-sm text-gray-500 text-center">
                                        <span className="text-red-500">*</span> Required fields
                                    </p>
                                </form>
                            </div>

                            {/* FAQ Section */}
                            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                                <div className="space-y-4">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                                                aria-expanded={expandedFaq === index}
                                            >
                                                <span className="font-semibold text-gray-900 text-base pr-4">{faq.question}</span>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${expandedFaq === index ? 'transform rotate-180' : ''}`}
                                                />
                                            </button>
                                            {expandedFaq === index && (
                                                <div className="px-5 pb-5 text-gray-700 leading-relaxed">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Our Office</h2>
                        <p className="text-lg text-gray-600">Come say hello! We're located in the heart of Paris.</p>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-2xl">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937604!2d2.292292615674!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sfr!4v1234567890"
                            width="100%"
                            height="450"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Office Location Map"
                            className="w-full"
                        ></iframe>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
