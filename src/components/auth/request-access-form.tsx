
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, CustomButton, Checkbox, PasswordInput } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { FirebaseError } from 'firebase/app';

interface RequestAccessFormProps {
  onCancel: () => void;
  onSignInClick: () => void;
  formType: string;
  setFormType: (formType: string) => void;
}

export function RequestAccessForm({ onCancel, onSignInClick, formType, setFormType }: RequestAccessFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleFormToggle = () => {
    setFormType(formType === 'waitlist' ? 'signup' : 'waitlist');
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (formType === 'signup') {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      try {
        await signUp(email, password, { firstName, lastName, phone });
        // Redirect to dashboard after successful sign-up
        router.push('/dashboard');
      } catch (error: any) {
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/email-already-in-use') {
                setError("This email is already in use. Please sign in or use a different email.");
            } else if (error.code === 'auth/weak-password') {
                setError("The password is too weak. Please use a stronger password.");
            } else {
                setError("An unexpected error occurred during sign-up. Please try again.");
            }
        } else {
            setError("An unexpected error occurred. Please try again.");
        }
      }
    } else {
      // Handle waitlist submission
    }
  };

  return (
    <div>
        {formType === 'waitlist' ? (
            <div className="space-y-4">
                <div className="flex space-x-4">
                <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        
                <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="newsletter" checked={newsletter} onCheckedChange={(checked) => setNewsletter(Boolean(checked))} />
                        <label htmlFor="newsletter" className="text-sm text-secondary">Sign me up to the CreativeLab newsletter</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="whatsapp" checked={whatsapp} onCheckedChange={(checked) => setWhatsapp(Boolean(checked))} />
                        <label htmlFor="whatsapp" className="text-sm text-secondary">By submitting this form I agree to be contacted via WhatsApp</label>
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <PasswordInput label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
        )}

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <div className="grid grid-cols-2 gap-4 mt-8">
            <CustomButton variant="default" onClick={onCancel}>Cancel</CustomButton>
            <CustomButton variant="primary" onClick={handleSubmit}>{formType === 'waitlist' ? 'Submit' : 'Sign Up'}</CustomButton>
        </div>

        <div className="text-center text-sm text-secondary mt-6">
            {formType === 'waitlist' ? (
                 <p>Already have an account? <button type="button" className="text-primary hover:underline" onClick={onSignInClick}>Sign In here</button></p>
            ) : (
                <p>Already have an account? <button type="button" className="text-primary hover:underline" onClick={onSignInClick}>Sign In here</button></p>
            )}
        </div>
        
        <div className="text-center text-sm text-secondary mt-2">
            {formType === 'waitlist' ? (
              <p></p>
                // <p>Don't have an account? <button type="button" className="text-primary hover:underline" onClick={handleFormToggle}>Sign Up here</button></p>
            ) : (
                <p>Back to <button type="button" className="text-primary hover:underline" onClick={handleFormToggle}>waitlist</button></p>
            )}
        </div>
    </div>
  );
}
