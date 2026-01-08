'use client';

import { CreditCard, Star } from 'lucide-react';
import { Header } from '@/components/ui/header';
import { CustomButton } from '@/components/ui/CustomButton';

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-gradient-to-r from-[#E1B327] to-[#F0CB5C] text-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-2">
          <CreditCard className="h-6 w-6 mr-2" />
          <h2 className="text-2xl md:text-3xl font-bold">Subscription Plans</h2>
        </div>
        
        <div className="flex items-center text-white/90 mb-4 bg-white/10 px-3 py-1 rounded-full w-fit">
          <Star className="h-5 w-5 mr-2" />
          <span>Manage your subscription</span>
        </div>
        
        <p className="text-white/90 max-w-md backdrop-blur-sm bg-black/5 p-3 rounded-lg">
          Choose the right plan for your communities and unlock premium features.
        </p>
      </div>

      <Header title="Subscription" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-xl font-medium">Basic</h3>
            <div className="mt-2 text-3xl font-bold">Free</div>
            <p className="text-muted-foreground mt-1">Forever</p>
          </div>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>1 Community</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Basic analytics</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Standard support</span>
            </li>
          </ul>
          
          <CustomButton variant="default" className="w-full">Current Plan</CustomButton>
        </div>
        
        <div className="bg-card p-6 rounded-lg border-2 border-[#E1B327] shadow-md relative">
          <div className="absolute top-0 right-0 bg-[#E1B327] text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg">
            Popular
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-xl font-medium">Pro</h3>
            <div className="mt-2 text-3xl font-bold">$19<span className="text-lg font-normal">/mo</span></div>
            <p className="text-muted-foreground mt-1">Billed monthly</p>
          </div>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>5 Communities</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Priority support</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Custom branding</span>
            </li>
          </ul>
          
          <CustomButton variant="semi-rounded" className="w-full">Upgrade</CustomButton>
        </div>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-xl font-medium">Enterprise</h3>
            <div className="mt-2 text-3xl font-bold">Custom</div>
            <p className="text-muted-foreground mt-1">Contact sales</p>
          </div>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Unlimited communities</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Enterprise analytics</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Dedicated support</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Custom integrations</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>SLA guarantees</span>
            </li>
          </ul>
          
          <CustomButton variant="outline" className="w-full">Contact Sales</CustomButton>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-medium mb-4">Billing History</h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No billing history available</p>
        </div>
      </div>
    </div>
  );
}
