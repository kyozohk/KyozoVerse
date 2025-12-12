"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomButton } from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';

interface AcceptInviteFormProps {
  inviteData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    tempFirstName?: string;
    tempLastName?: string;
    tempEmail?: string;
    tempDateOfBirth?: string;
    tempGender?: string;
    tempLocation?: string;
    communityName?: string;
  };
  token: string;
}

export function AcceptInviteForm({ inviteData, token }: AcceptInviteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: inviteData.firstName || inviteData.tempFirstName || '',
    lastName: inviteData.lastName || inviteData.tempLastName || '',
    email: inviteData.email || inviteData.tempEmail || '',
    phone: inviteData.phone || '',
    password: '',
    confirmPassword: '',
    dateOfBirth: inviteData.tempDateOfBirth ? new Date(inviteData.tempDateOfBirth).toISOString().split('T')[0] : '',
    gender: inviteData.tempGender || '',
    location: inviteData.tempLocation || '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeUpdates: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
    
    // Clear error when user checks a checkbox
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the Terms of Service';
    if (!formData.agreePrivacy) newErrors.agreePrivacy = 'You must agree to the Privacy Policy';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('📧 INVITE - Starting invite acceptance process');
    console.log('📧 INVITE - Token:', token);
    console.log('📧 INVITE - Invite data:', inviteData);
    
    if (!validateForm()) {
      console.log('❌ INVITE - Form validation failed:', errors);
      return;
    }
    
    console.log('✅ INVITE - Form validation passed');
    
    setIsSubmitting(true);
    
    try {
      const requestData = {
        token,
        ...formData,
      };
      
      console.log('📤 INVITE - Sending request to /api/accept-invite:', {
        token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        hasPassword: !!formData.password
      });
      
      const response = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      console.log('📥 INVITE - Response received:', {
        ok: response.ok,
        status: response.status,
        data
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }
      
      console.log('✅ INVITE - Successfully accepted invite!');
      
      toast({
        title: 'Success!',
        description: 'Your registration is complete. You can now log in.',
      });
      
      // Redirect to login page or dashboard
      router.push('/');
    } catch (err: any) {
      console.error('❌ INVITE - Error accepting invite:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to complete registration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md bg-blue-50 p-4 mb-6">
        <p className="text-sm text-blue-700">
          You've been invited to join {inviteData.communityName || 'our community'}!
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            error={errors.firstName}
          />
        </div>
        
        <div>
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            error={errors.lastName}
          />
        </div>
        
        <div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            error={errors.email}
          />
        </div>
        
        <div>
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />
        </div>
        
        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            error={errors.password}
          />
        </div>
        
        <div>
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            error={errors.confirmPassword}
          />
        </div>
        
        <div>
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            error={errors.dateOfBirth}
          />
        </div>
        
        <div>
          <Input
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            error={errors.gender}
          />
        </div>
        
        <div className="md:col-span-2">
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
          />
        </div>
      </div>
      
      <div className="space-y-4 pt-4">
        <div>
          <Checkbox
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => handleCheckboxChange('agreeTerms', checked === true)}
            label="I agree to the Terms of Service"
          />
          {errors.agreeTerms && <p className="mt-1 text-sm text-red-500">{errors.agreeTerms}</p>}
        </div>
        
        <div>
          <Checkbox
            checked={formData.agreePrivacy}
            onCheckedChange={(checked) => handleCheckboxChange('agreePrivacy', checked === true)}
            label="I agree to the Privacy Policy"
          />
          {errors.agreePrivacy && <p className="mt-1 text-sm text-red-500">{errors.agreePrivacy}</p>}
        </div>
        
        <div>
          <Checkbox
            checked={formData.agreeUpdates}
            onCheckedChange={(checked) => handleCheckboxChange('agreeUpdates', checked === true)}
            label="I would like to receive updates about new features and communities"
          />
        </div>
      </div>
      
      <div className="pt-6">
        <CustomButton
          type="submit"
          variant="waitlist"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Completing Registration...' : 'Complete Registration'}
        </CustomButton>
      </div>
    </form>
  );
}
