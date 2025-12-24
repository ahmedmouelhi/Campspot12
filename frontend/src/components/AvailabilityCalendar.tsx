import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface AvailabilityCalendarProps {
    onDateSelect?: (startDate: string, endDate: string) => void;
    minDate?: string;
    maxDate?: string;
    unavailableDates?: string[];
    limitedDates?: string[];
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
    onDateSelect,
    minDate,
    maxDate,
    unavailableDates = [],
    limitedDates = []
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedStart, setSelectedStart] = useState<Date | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const isDateUnavailable = (date: Date) => {
        const dateStr = formatDate(date);
        return unavailableDates.includes(dateStr);
    };

    const isDateLimited = (date: Date) => {
        const dateStr = formatDate(date);
        return limitedDates.includes(dateStr);
    };

    const isDateInRange = (date: Date) => {
        if (!selectedStart) return false;
        const compareDate = hoveredDate || selectedEnd;
        if (!compareDate) return false;

        const start = selectedStart < compareDate ? selectedStart : compareDate;
        const end = selectedStart < compareDate ? compareDate : selectedStart;

        return date >= start && date <= end;
    };

    const handleDateClick = (date: Date) => {
        if (isDateUnavailable(date)) return;

        if (!selectedStart || (selectedStart && selectedEnd)) {
            setSelectedStart(date);
            setSelectedEnd(null);
        } else {
            if (date < selectedStart) {
                setSelectedEnd(selectedStart);
                setSelectedStart(date);
            } else {
                setSelectedEnd(date);
            }

            if (onDateSelect) {
                const start = date < selectedStart ? date : selectedStart;
                const end = date < selectedStart ? selectedStart : date;
                onDateSelect(formatDate(start), formatDate(end));
            }
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isUnavailable = isDateUnavailable(date);
            const isLimited = isDateLimited(date);
            const isSelected = (selectedStart && formatDate(date) === formatDate(selectedStart)) ||
                (selectedEnd && formatDate(date) === formatDate(selectedEnd));
            const isInRange = isDateInRange(date);
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            days.push(
                <button
                    key={day}
                    onClick={() => !isPast && !isUnavailable && handleDateClick(date)}
                    onMouseEnter={() => !isPast && !isUnavailable && setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    disabled={isPast || isUnavailable}
                    className={`h-10 rounded-lg text-sm font-medium transition-all ${isPast || isUnavailable
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                        : isSelected
                            ? 'bg-teal-600 text-white'
                            : isInRange
                                ? 'bg-teal-100 text-teal-900'
                                : isLimited
                                    ? 'bg-yellow-50 text-yellow-900 hover:bg-yellow-100'
                                    : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    aria-label={`${monthNames[currentMonth.getMonth()]} ${day}, ${currentMonth.getFullYear()}`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-2 text-xs text-gray-600 mb-2">
                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-teal-600 rounded"></div>
                            <span>Selected</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
                            <span>Limited availability</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                            <span>Unavailable</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
