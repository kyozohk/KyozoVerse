"use client";

import React from 'react';
import { CustomButton } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, Check } from 'lucide-react';

export default function UiDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">UI Components Demo</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <CustomButton>Default Button</CustomButton>
          <CustomButton variant="primary">Primary Button</CustomButton>
          <CustomButton variant="outline">Outline Button</CustomButton>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <CustomButton size="small">Small Button</CustomButton>
          <CustomButton>Default Size</CustomButton>
          <CustomButton size="large">Large Button</CustomButton>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <CustomButton icon={Mail}>With Icon</CustomButton>
          <CustomButton icon={Send} variant="primary">Send Message</CustomButton>
          <CustomButton isLoading>Loading</CustomButton>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input placeholder="Default Input" />
          <Input label="With Label" placeholder="Enter text" />
          <Input label="Required Field" required placeholder="Required field" />
          <Input label="With Error" error="This field has an error" placeholder="Error state" />
          <Input label="Floating Label" floatingLabel placeholder="Type something..." />
          <Input label="Disabled Input" disabled placeholder="Disabled" />
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Checkboxes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox label="Default Checkbox" />
          <Checkbox label="Checked Checkbox" checked onCheckedChange={() => {}} />
          <Checkbox label="Disabled Checkbox" disabled />
          <Checkbox label="With Error" error="This checkbox has an error" />
        </div>
      </section>
    </div>
  );
}
