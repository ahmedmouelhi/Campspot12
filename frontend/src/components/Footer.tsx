import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Send } from 'lucide-react';
import Logo from './Logo';
import ContactModal from './ContactModal';

const Footer = () => {
    const [email, setEmail] = React.useState('');
    const [showContactModal, setShowContactModal] = React.useState(false);

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement newsletter signup
        console.log('Newsletter signup:', email);
        setEmail('');
    };

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div>
                        <Logo variant="light" size="md" />
                        <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                            Discover the perfect camping experience. Book campsites, activities, and equipment all in one place.
                        </p>
                        <div className="flex space-x-4 mt-6">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-teal-400 transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook size={20} />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-teal-400 transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram size={20} />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-teal-400 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/" className="text-sm hover:text-teal-400 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/campsites" className="text-sm hover:text-teal-400 transition-colors">
                                    Campsites
                                </Link>
                            </li>
                            <li>
                                <Link to="/activities" className="text-sm hover:text-teal-400 transition-colors">
                                    Activities
                                </Link>
                            </li>
                            <li>
                                <Link to="/equipment" className="text-sm hover:text-teal-400 transition-colors">
                                    Equipment
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-sm hover:text-teal-400 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="text-sm hover:text-teal-400 transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={() => setShowContactModal(true)}
                                    className="text-sm hover:text-teal-400 transition-colors text-left"
                                >
                                    Contact Us
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <Mail size={16} className="mt-1 text-teal-400 flex-shrink-0" />
                                <a href="mailto:info@campspot.com" className="text-sm hover:text-teal-400 transition-colors">
                                    info@campspot.com
                                </a>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Phone size={16} className="mt-1 text-teal-400 flex-shrink-0" />
                                <a href="tel:+33123456789" className="text-sm hover:text-teal-400 transition-colors">
                                    +33 1 23 45 67 89
                                </a>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin size={16} className="mt-1 text-teal-400 flex-shrink-0" />
                                <span className="text-sm">
                                    123 Camping Avenue<br />
                                    75001 Paris, France
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-lg">Newsletter</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Subscribe to get special offers and camping tips.
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                            <div className="flex">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email"
                                    required
                                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-teal-500 text-sm text-white placeholder-gray-500"
                                />
                                <button
                                    type="submit"
                                    className="bg-teal-600 text-white px-4 py-2 rounded-r-lg hover:bg-teal-700 transition-colors"
                                    aria-label="Subscribe to newsletter"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} CampSpot. All rights reserved.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link to="/privacy" className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
                                Terms of Service
                            </Link>
                            <Link to="/cookies" className="text-sm text-gray-400 hover:text-teal-400 transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
        </footer>
    );
};

export default Footer;
