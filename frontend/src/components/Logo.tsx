import React from 'react';
import { Tent } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md', className = '' }) => {
    const sizes = {
        sm: { icon: 20, text: 'text-lg' },
        md: { icon: 28, text: 'text-2xl' },
        lg: { icon: 36, text: 'text-3xl' }
    };

    const colors = {
        light: 'text-white',
        dark: 'text-teal-600'
    };

    return (
        <Link to="/" className={`flex items-center space-x-2 group ${className}`}>
            <div className={`${colors[variant]} group-hover:scale-110 transition-transform duration-200`}>
                <Tent size={sizes[size].icon} strokeWidth={2.5} />
            </div>
            <span className={`${sizes[size].text} font-bold ${colors[variant]} font-heading tracking-tight`}>
                CampSpot
            </span>
        </Link>
    );
};

export default Logo;
