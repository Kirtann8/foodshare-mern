import React, { useState, useEffect, useRef } from 'react';

// Popular Indian cities
const POPULAR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
  'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
  'Varanasi', 'Srinagar', 'Amritsar', 'Chandigarh', 'Gurgaon', 'Noida'
];

const LocationAutocomplete = ({ value, onChange, name, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  // Get recent searches from localStorage
  const getRecentSearches = () => {
    try {
      const recent = localStorage.getItem('recentCitySearches');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Error reading recent searches:', error);
      return [];
    }
  };

  // Save to recent searches
  const saveToRecentSearches = (city) => {
    if (!city || city.trim() === '') return;
    
    try {
      const recent = getRecentSearches();
      const filtered = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
      const updated = [city, ...filtered].slice(0, 5); // Keep only top 5
      localStorage.setItem('recentCitySearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Filter suggestions based on input
  useEffect(() => {
    if (!value || value.trim() === '') {
      const recent = getRecentSearches();
      setSuggestions([
        ...recent.map(city => ({ type: 'recent', value: city })),
        ...POPULAR_CITIES.slice(0, 5 - recent.length).map(city => ({ type: 'popular', value: city }))
      ]);
    } else {
      const searchTerm = value.toLowerCase();
      const filtered = POPULAR_CITIES.filter(city =>
        city.toLowerCase().includes(searchTerm)
      );
      setSuggestions(filtered.map(city => ({ type: 'match', value: city })));
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    onChange({ target: { name, value: city } });
    saveToRecentSearches(city);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    onChange(e);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value) {
      saveToRecentSearches(value);
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelect(suggestion.value)}
              className="px-4 py-2.5 hover:bg-green-50 cursor-pointer transition-colors flex items-center gap-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-lg">
                {suggestion.type === 'recent' ? '🕐' : suggestion.type === 'match' ? '📍' : '⭐'}
              </span>
              <span className="text-gray-800 font-medium">{suggestion.value}</span>
              {suggestion.type === 'recent' && (
                <span className="ml-auto text-xs text-gray-500">Recent</span>
              )}
              {suggestion.type === 'popular' && (
                <span className="ml-auto text-xs text-gray-500">Popular</span>
              )}
            </div>
          ))}
          {!value && (
            <div className="px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-200 bg-gray-50">
              Start typing to search cities
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
