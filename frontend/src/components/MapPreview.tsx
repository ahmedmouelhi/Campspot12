import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface MapPreviewProps {
    location: string;
    latitude?: number;
    longitude?: number;
    className?: string;
}

const MapPreview: React.FC<MapPreviewProps> = ({
    location,
    latitude,
    longitude,
    className = ''
}) => {
    // Google Maps embed URL (requires API key in production)
    const getMapEmbedUrl = () => {
        if (latitude && longitude) {
            return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${latitude},${longitude}&zoom=14`;
        }
        return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(location)}&zoom=12`;
    };

    // Google Maps directions URL
    const getDirectionsUrl = () => {
        if (latitude && longitude) {
            return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
    };

    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 font-heading">Location & Access</h2>
                <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                    aria-label="Get directions to campsite"
                >
                    <Navigation size={16} />
                    <span>Get Directions</span>
                    <ExternalLink size={14} />
                </a>
            </div>

            <div className="flex items-start space-x-3 mb-4">
                <MapPin size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900 mb-1">Address</p>
                    <p className="text-gray-700 text-sm">{location}</p>
                </div>
            </div>

            {/* Map Preview - Placeholder for Google Maps */}
            <div className="relative h-64 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl overflow-hidden">
                {/* Placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <MapPin size={48} className="text-teal-600 mb-3" />
                    <p className="text-gray-700 font-semibold mb-2">Map Preview</p>
                    <p className="text-sm text-gray-600 mb-4">
                        Interactive map will appear here with Google Maps integration
                    </p>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        <span>View on Google Maps</span>
                        <ExternalLink size={16} />
                    </a>
                </div>

                {/* Uncomment this when Google Maps API key is available */}
                {/* <iframe
                    src={getMapEmbedUrl()}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map showing location of ${location}`}
                    className="absolute inset-0"
                ></iframe> */}
            </div>

            {/* Access Information */}
            <div className="mt-4 space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Navigation size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-gray-900 text-sm mb-1">Getting Here</p>
                        <p className="text-gray-700 text-sm">
                            Located 15 minutes from downtown. Take Highway 101 North, exit at Pine Street.
                            Follow signs for campground entrance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPreview;
