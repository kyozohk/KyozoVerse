
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
  label?: string;
}

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
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
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
];

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Phone number',
  error,
  disabled = false,
  required = false,
  id,
  name,
  className,
  label = 'Phone'
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES.find(c => c.code === 'HK') || COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      // Find matching country by checking if value starts with the dial code (without +)
      const matchingCountry = COUNTRIES.sort((a, b) => b.dialCode.length - a.dialCode.length).find(c => {
        const dialCodeWithoutPlus = c.dialCode.replace('+', '');
        return value.startsWith(dialCodeWithoutPlus);
      });
      
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        const dialCodeWithoutPlus = matchingCountry.dialCode.replace('+', '');
        setPhoneNumber(value.substring(dialCodeWithoutPlus.length));
      } else {
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber('');
    }
  }, [value]);

  useEffect(() => {
    const fullNumber = phoneNumber ? `${selectedCountry.dialCode.replace('+', '')}${phoneNumber.replace(/\D/g, '')}` : '';
    if (onChange && fullNumber !== value) {
      onChange(fullNumber);
    }
  }, [selectedCountry, phoneNumber, onChange, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDropdownOpen(!isDropdownOpen);
      if (!isDropdownOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d]/g, '');
    setPhoneNumber(newValue);
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputId = id || React.useId();

  return (
    <div className={cn("inputWrapper", className)} ref={containerRef}>
      <div className={cn("inputContainer phone-input-container relative flex items-center", error ? "hasError" : "")}>
        <button
          type="button"
          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-1 bg-transparent z-20 rounded hover:bg-muted/50 border-r border-gray-300"
          onClick={handleCountryButtonClick}
          disabled={disabled}
          style={{ minWidth: '85px' }}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-sm font-medium whitespace-nowrap text-gray-900">{selectedCountry.dialCode}</span>
          <span className="text-xs text-gray-600 ml-0.5">▼</span>
        </button>

        {isDropdownOpen && !disabled && (
          <div className="phone-dropdown absolute top-full left-0 z-50 mt-1 w-72 max-h-60 overflow-y-auto bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b bg-white">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-sm border rounded-md text-gray-900 bg-white"
              />
            </div>
            <div className="py-1 bg-white">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-900",
                    selectedCountry.code === country.code ? "bg-gray-100" : ""
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCountrySelect(country);
                  }}
                >
                  <span className="mr-2">{country.flag}</span>
                  <span className="text-sm flex-grow truncate">{country.name}</span>
                  <span className="text-sm text-gray-600">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          type="tel"
          id={inputId}
          name={name}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder=" "
          disabled={disabled}
          required={required}
          className="input pl-[100px]" 
          style={{ paddingLeft: '100px' }}
        />
        <label htmlFor={inputId} className="floatingLabel" style={{ left: '100px' }}>
          {label}
        </label>
      </div>
      {error && <div className="errorMessage">{error}</div>}
    </div>
  );
};

export { PhoneInput };
