
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
  placeholder = 'Phone number',
  error,
  disabled = false,
  required = false,
  id,
  name,
  className,
  label = 'Phone'
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode + ' '));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length + 1));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  useEffect(() => {
    const fullNumber = phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : '';
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
    const newValue = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
    setPhoneNumber(newValue);
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputId = id || React.useId();
  const hasValue = phoneNumber.length > 0;

  return (
    <div className={cn("inputWrapper", className)} ref={containerRef}>
      <div className={cn("inputContainer relative flex items-center", error ? "hasError" : "")}>
        <button
          type="button"
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-between gap-1.5 px-2 py-1 bg-transparent z-10 rounded hover:bg-muted/50"
          onClick={handleCountryButtonClick}
          disabled={disabled}
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
          <span className="text-xs text-muted-foreground">▼</span>
        </button>

        {isDropdownOpen && !disabled && (
          <div className="phone-dropdown absolute top-full left-0 z-50 mt-1 w-72 max-h-60 overflow-y-auto bg-card border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 text-sm border rounded-md"
              />
            </div>
            <div className="py-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-left hover:bg-muted/50",
                    selectedCountry.code === country.code ? "bg-muted" : ""
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCountrySelect(country);
                  }}
                >
                  <span className="mr-2">{country.flag}</span>
                  <span className="text-sm flex-grow truncate">{country.name}</span>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
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
          className="input pl-20"
        />
        <label htmlFor={inputId} className={cn(
          "floatingLabel transition-all"
        )}>
          {label}
        </label>
      </div>
      {error && <div className="errorMessage">{error}</div>}
    </div>
  );
};

export { PhoneInput };
