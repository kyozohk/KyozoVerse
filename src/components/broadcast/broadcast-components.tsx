
'use client';

import React from 'react';
import { BroadcastStep, Member, Template, TemplateVariable, BroadcastResult } from './broadcast-types';
import { Avatar, AvatarImage, AvatarFallback, FloatingSelect } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Check, Image as ImageIcon } from 'lucide-react';
import { CommunityMember } from '@/lib/types';
import { MembersList } from './members-list';
import { usePathname } from 'next/navigation';
import { getThemeForPath } from '@/lib/theme-utils';

/**
 * Step indicator component
 */
export const StepIndicator = ({ currentStep }: { currentStep: BroadcastStep }) => {
  const steps = [
    { num: BroadcastStep.RECIPIENTS, label: 'Recipients' },
    { num: BroadcastStep.TEMPLATE, label: 'Template' },
    { num: BroadcastStep.PREVIEW, label: 'Preview' },
    { num: BroadcastStep.CONFIRM, label: 'Send' }
  ];
  
  return (
    <div className="flex items-center justify-between w-full mb-8">
      {steps.map((step) => (
        <div
          key={step.num}
          className={`flex flex-col items-center ${
            currentStep === step.num
              ? 'text-primary'
              : currentStep > step.num
              ? 'text-green-500'
              : 'text-gray-400'
          }`}
        >
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-2 
            ${
              currentStep === step.num
                ? 'border-primary text-primary'
                : currentStep > step.num
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 text-gray-400'
            }`}
          >
            {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
          </div>
          <div className="text-xs font-medium">{step.label}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Recipients step component
 */
export const RecipientsStep = ({ members, onMemberClick, selectedMembers }: { members: (Member | CommunityMember)[], onMemberClick: (member: Member | CommunityMember) => void, selectedMembers: (Member | CommunityMember)[] }) => {
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  return (
      <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Selected Recipients ({selectedMembers.length})</h3>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2 -mx-6 px-6">
              <MembersList
                  members={members as CommunityMember[]}
                  onMemberClick={onMemberClick}
                  selectedMembers={selectedMembers}
                  selectable={true}
                  viewMode="list"
                  showEmail={false}
                  showPhone={true}
                  showStatus={false}
                  showJoinDate={false}
                  activeColor={activeColor || '#C170CF'} // Default to purple if no theme
              />
          </div>
      </div>
  );
};


/**
 * Template step component
 */
export const TemplateStep = ({ 
  templates,
  selectedTemplate,
  onTemplateChange,
  templateVariables,
  onVariableChange,
  onVariableTypeChange,
  onFreeTextChange,
  headerImageUrl,
  onHeaderImageChange,
  hasImageHeader,
  loadingTemplates
}: { 
  templates: Template[],
  selectedTemplate: string,
  onTemplateChange: (id: string) => void,
  templateVariables: TemplateVariable[],
  onVariableChange: (index: number, value: string) => void,
  onVariableTypeChange: (index: number, type: string) => void,
  onFreeTextChange: (index: number, value: string) => void,
  headerImageUrl: string,
  onHeaderImageChange: (url: string) => void,
  hasImageHeader: boolean,
  loadingTemplates: boolean
}) => (
  <div className="space-y-6">
    <div className="inputWrapper">
      <div className="inputContainer">
        {loadingTemplates ? (
          <div className="text-center py-4 text-muted-foreground">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No templates available</div>
        ) : (
          <FloatingSelect
            label="Select Template"
            value={selectedTemplate}
            onValueChange={onTemplateChange}
          >
            <SelectContent className="max-h-80">
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </FloatingSelect>
        )}
      </div>
    </div>
    
    {selectedTemplate && (
      <div className="inputWrapper">
        {(() => {
          const template = templates.find(t => t.id === selectedTemplate);
          if (!template) return null;
          
          // Extract template content
          let templateContent = '';
          if (template.components) {
            const bodyComponent = template.components.find(c => c.type === 'BODY' || c.type === 'body');
            if (bodyComponent && bodyComponent.text) {
              templateContent = bodyComponent.text;
            }
          }
          
          return (
            <div className="inputContainer">
              <label className="floatingLabel">Template Preview</label>
              <Textarea
                placeholder=''
                label="Template Preview"
                readOnly
                value={templateContent || 'No content available'}
                rows={4}
                className="resize-none bg-muted/20"
              />
            </div>
          );
        })()}
      </div>
    )}
    
    {templateVariables.length > 0 && (
      <div className="space-y-4">
        {templateVariables.map((variable) => (
          <div key={variable.index} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <FloatingSelect
                  label={`Variable ${variable.index}`}
                  value={variable.variableType || 'freeText'}
                  onValueChange={(value) => onVariableTypeChange(variable.index, value)}
                >
                  <SelectContent className="max-h-80">
                    <SelectItem value="firstName">First Name</SelectItem>
                    <SelectItem value="lastName">Last Name</SelectItem>
                    <SelectItem value="communityName">Community Name</SelectItem>
                    <SelectItem value="freeText">Free Text</SelectItem>
                  </SelectContent>
                </FloatingSelect>
              </div>
            </div>
            
            {variable.variableType === 'freeText' && (
              <Input
                type="text"
                value={variable.freeText || ''}
                onChange={(e) => onFreeTextChange(variable.index, e.target.value)}
                placeholder="Enter custom text"
              />
            )}
          </div>
        ))}
      </div>
    )}
    
    {hasImageHeader && (
      <div className="inputWrapper">
        <Input
          type="text"
          value={headerImageUrl}
          onChange={(e) => onHeaderImageChange(e.target.value)}
          placeholder="Enter image URL for template header"
          label="Enter image URL for template header"
        />
      </div>
    )}
  </div>
);

/**
 * Preview step component
 */
export const PreviewStep = ({ 
  selectedTemplate,
  templates,
  templateVariables,
  members
}: {
  selectedTemplate: string,
  templates: Template[],
  templateVariables: TemplateVariable[],
  members: (Member | CommunityMember)[]
}) => {
  // Build final text once for display
  let displayText = '';
  const template = templates.find(t => t.id === selectedTemplate);

  if (template && template.components) {
    const bodyComponent = template.components.find(c => c.type === 'BODY' || c.type === 'body');
    if (bodyComponent && bodyComponent.text) {
      displayText = bodyComponent.text;
    }
  }

  if (displayText && templateVariables.length > 0) {
    templateVariables.forEach(variable => {
      const placeholder = `{{${variable.index}}}`;
      let value = '';

      if (variable.variableType === 'freeText') {
        value = variable.freeText?.trim() || `[${variable.placeholder}]`;
      } else {
        value = variable.value.trim() || `[${variable.placeholder}]`;
      }

      displayText = displayText.replace(new RegExp(placeholder, 'g'), value);
    });
  }

  return (
    <div className="space-y-4">

      <div className="inputWrapper">
        <div className="inputContainer">
          <label className="floatingLabel">Preview for {members.length} recipients</label>
          <Textarea
            label="Message Preview"
            readOnly
            value={displayText || 'No content available'}
            rows={12}
            className="resize-none bg-muted/20"
          />
        </div>
      </div>
      <div className="text-sm text-amber-600">
        Please review the message carefully before proceeding to send.
      </div>
    </div>
  );
};

/**
 * Confirm step component
 */
export const ConfirmStep = ({ 
  members,
  selectedTemplate,
  templates,
  templateVariables,
  pricingInfo,
  loadingPricing,
  broadcastResults
}: {
  members: (Member | CommunityMember)[],
  selectedTemplate: string,
  templates: Template[],
  templateVariables: TemplateVariable[],
  pricingInfo: any,
  loadingPricing: boolean,
  broadcastResults: BroadcastResult | null
}) => (
  <div className="space-y-6">
    <div className="text-foreground">
      <h3 className="text-lg font-medium mb-4">Confirm Broadcast</h3>
      
      <div className="space-y-2 mb-6">
        <div className="flex justify-between py-2 border-b">
          <span className="font-medium">Recipients:</span>
          <span>{members.length} members</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-medium">Template:</span>
          <span>{templates.find(t => t.id === selectedTemplate)?.name || 'Custom Message'}</span>
        </div>
      </div>
    </div>
    
    {/* Pricing Information */}
    <div className="border rounded-md p-4 bg-muted/30 text-foreground">
      <h4 className="text-sm font-medium mb-3">Broadcast Cost</h4>
      
      {loadingPricing ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm">Calculating cost...</span>
        </div>
      ) : pricingInfo ? (
        <div>
          <div className="text-2xl font-semibold text-center mb-2">
            {pricingInfo.currency} {pricingInfo.totalCost.toFixed(2)}
          </div>
          <div className="text-sm text-center text-muted-foreground">
            <p>{pricingInfo.recipientCount} recipients × {pricingInfo.currency} {pricingInfo.messageRate.toFixed(4)} per message</p>
            {pricingInfo.source === 'estimated' && (
              <p className="text-xs mt-1">* estimated cost based on standard rates</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">Unable to calculate cost</div>
      )}
    </div>
    
    {/* Broadcast Results */}
    {broadcastResults && (
      <div className="border rounded-md p-4 bg-muted/30 text-foreground">
        {broadcastResults.error ? (
          <div className="text-red-500">
            <h4 className="font-medium mb-2">Error Sending Broadcast</h4>
            <p className="text-sm">{broadcastResults.error}</p>
          </div>
        ) : (
          <div>
            <h4 className="font-medium mb-2">Broadcast Results</h4>
            <div className="flex justify-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-500">{broadcastResults.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-500">{broadcastResults.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
            
            {/* Detailed results for each recipient */}
            {broadcastResults.details && broadcastResults.details.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Recipient Details</h5>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {broadcastResults.details.map((detail, index) => (
                    <div 
                      key={detail.memberId || index} 
                      className={`p-2 rounded-md text-sm ${detail.status === 'sent' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{detail.name}</div>
                          {detail.phone && (
                            <div className="text-xs text-muted-foreground">{detail.phone}</div>
                          )}
                        </div>
                        <div>
                          {detail.status === 'sent' ? (
                            <span className="text-green-600 flex items-center">
                              <Check className="h-4 w-4 mr-1" /> Sent
                            </span>
                          ) : (
                            <span className="text-red-600">Failed</span>
                          )}
                        </div>
                      </div>
                      {detail.error && (
                        <div className="text-xs text-red-500 mt-1">
                          {detail.error.length > 160 ? `${detail.error.slice(0, 157)}...` : detail.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )}
    
    <div className="text-sm text-amber-600 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <p>You are about to send this message to {members.length} members. This action cannot be undone.</p>
      <p className="mt-1">Click "Send Message" to proceed or "Back" to make changes.</p>
    </div>
  </div>
);
