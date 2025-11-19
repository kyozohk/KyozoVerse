'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

// Common countries with their dial codes
const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter phone number',
  error,
  disabled = false,
  required = false,
  id,
  name,
  className
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      console.log('PhoneInput received value:', value);
      
      // Try to parse the phone number to extract country code and number
      // First, handle the case where the value starts with a plus sign
      if (value.startsWith('+')) {
        // Find the country by dial code
        for (const country of COUNTRIES) {
          const dialCodeWithoutPlus = country.dialCode.substring(1); // Remove the + sign
          if (value.startsWith(`+${dialCodeWithoutPlus}`)) {
            console.log(`Found country match: ${country.name} for ${value}`);
            setSelectedCountry(country);
            setPhoneNumber(value.substring(country.dialCode.length).trim());
            return;
          }
        }
      }
      
      // Try to find by dial code with space
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) {
        console.log(`Found country by dial code: ${country.name} for ${value}`);
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length).trim());
      } else {
        // If no country code found, check if it's a number with + but without space
        const plusCountry = COUNTRIES.find(c => {
          const dialCodeWithoutPlus = c.dialCode.substring(1); // Remove the + sign
          return value.startsWith(`+${dialCodeWithoutPlus}`);
        });
        
        if (plusCountry) {
          console.log(`Found country by plus code: ${plusCountry.name} for ${value}`);
          setSelectedCountry(plusCountry);
          setPhoneNumber(value.substring(plusCountry.dialCode.length).trim());
        } else {
          // If still no match, assume it's just the number
          console.log('No country match found, using full value as phone number');
          setPhoneNumber(value);
        }
      }
    }
  }, [value]);

  // Update parent component when values change
  useEffect(() => {
    const fullNumber = phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : '';
    if (onChange && fullNumber !== value) {
      onChange(fullNumber);
    }
  }, [selectedCountry, phoneNumber, onChange, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryButtonRef.current && !countryButtonRef.current.contains(event.target as Node)) {
        const dropdown = document.querySelector('.phone-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleCountryButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDropdownOpen(!isDropdownOpen);
      if (!isDropdownOpen) {
        // Focus search input when opening dropdown
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm('');
    // Force update the phone number to trigger onChange
    const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : '';
    if (onChange) {
      onChange(fullNumber);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, spaces, dashes, parentheses, and plus sign
    const newValue = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
    console.log('Phone number changed to:', newValue);
    setPhoneNumber(newValue);
    
    // Force update the combined value
    const fullNumber = newValue ? `${selectedCountry.dialCode} ${newValue}` : '';
    if (onChange) {
      console.log('Updating parent with full number:', fullNumber);
      onChange(fullNumber);
    }
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredCountries.length > 0) {
      handleCountrySelect(filteredCountries[0]);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className={cn(
        "flex items-center border rounded-md overflow-hidden",
        error ? "border-destructive" : "border-input",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      )}>
        <div className="relative">
          <button
            ref={countryButtonRef}
            type="button"
            className="flex items-center h-10 px-3 bg-muted/20 border-r"
            onClick={handleCountryButtonClick}
            disabled={disabled}
          >
            <span className="mr-2">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.dialCode}</span>
            <span className="ml-1 text-xs">▼</span>
          </button>

          {isDropdownOpen && !disabled && (
            <div className="phone-dropdown absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-y-auto bg-background border rounded-md shadow-lg">
              <div className="p-2 border-b">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-2 text-sm border rounded-md"
                />
              </div>
              <div className="py-1">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-left hover:bg-muted/50",
                        selectedCountry.code === country.code ? "bg-muted" : ""
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCountrySelect(country);
                      }}
                    >
                      <span className="mr-2">{country.flag}</span>
                      <span className="text-sm flex-grow truncate">{country.name}</span>
                      <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No countries found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <input
          type="tel"
          id={id}
          name={name}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="flex-grow h-10 px-3 bg-transparent focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
};

export { PhoneInput };
