"use client";

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PhoneNumberInputProps {
    value: string;
    onChange: (value: string) => void;
}

const countryCodes = [
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
];

export function PhoneNumberInput({ value, onChange }: PhoneNumberInputProps) {
    const [countryCode, setCountryCode] = useState(countryCodes[0].code);
    const [number, setNumber] = useState('');

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNumber(e.target.value);
        onChange(`${countryCode} ${e.target.value}`);
    }

    return (
        <div>
            <label className="text-sm text-muted-foreground mb-2 block">Phone Number</label>
            <div className="flex items-center gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {countryCodes.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.code} ({c.country})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="tel"
                    label="Phone Number"
                    value={number}
                    onChange={handleNumberChange}
                    placeholder="123-456-7890"
                />
            </div>
        </div>
    );
}
