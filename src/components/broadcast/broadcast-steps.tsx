'use client';

import React from 'react';
import { Member, Template, TemplateVariable, BroadcastStep, BroadcastResult } from './broadcast-types';
import { Avatar, AvatarImage, AvatarFallback, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="flex justify-between items-center w-full mb-6">
      {steps.map((step) => (
        <div 
          key={step.num} 
          className={cn(
            "flex flex-col items-center",
            currentStep === step.num ? "text-primary" : "",
            currentStep > step.num ? "text-success" : "",
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 mb-1",
            currentStep === step.num ? "border-primary bg-primary/10" : "",
            currentStep > step.num ? "border-success bg-success/10" : "border-muted",
          )}>
            {currentStep > step.num ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <span>{step.num}</span>
            )}
          </div>
          <div className="text-xs">{step.label}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Recipients step component
 */
export const RecipientsStep = ({ members }: { members: Member[] }) => (
  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
    {members.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">No members selected.</div>
    ) : (
      members.map((member) => (
        <div key={member.id} className="flex items-center p-3 border rounded-md">
          <div className="mr-3">
            <Avatar className="h-10 w-10">
              {member.photoURL ? (
                <AvatarImage src={member.photoURL} alt={member.displayName} />
              ) : (
                <AvatarFallback>
                  {member.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <div className="flex-grow">
            <div className="font-medium">{member.displayName}</div>
            <div className="text-sm text-muted-foreground">
              {member.email && <span className="mr-3">{member.email}</span>}
              {member.phone && <span>{member.phone}</span>}
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

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
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Template</label>
      {loadingTemplates ? (
        <div className="text-center py-4 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No templates available</div>
      ) : (
        <Select
          value={selectedTemplate}
          onValueChange={onTemplateChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
    
    {selectedTemplate && (
      <div className="p-4 border rounded-md bg-muted/30">
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
            <div className="whitespace-pre-wrap">
              {templateContent ? (
                templateContent
              ) : 'No content available'}                              
            </div>
          );
        })()}
      </div>
    )}
    
    {templateVariables.length > 0 && (
      <div className="space-y-4">
        {templateVariables.map((variable) => (
          <div key={variable.index} className="space-y-2">
            <div>
              <label className="text-sm font-medium">Variable {variable.index}</label>
              <Select
                value={variable.variableType || 'freeText'}
                onValueChange={(value) => onVariableTypeChange(variable.index, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="communityName">Community Name</SelectItem>
                  <SelectItem value="freeText">Free Text</SelectItem>
                </SelectContent>
              </Select>
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Header Image URL</label>
        <Input
          type="text"
          value={headerImageUrl}
          onChange={(e) => onHeaderImageChange(e.target.value)}
          placeholder="Enter image URL for template header"
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
  members: Member[]
}) => (
  <div className="space-y-6">
    <div className="p-3 bg-muted/30 rounded-md">
      <strong>To:</strong> {members.length} recipients
    </div>
    
    <div className="border rounded-md p-4">
      {selectedTemplate && (
        <div>
          {(() => {
            const template = templates.find(t => t.id === selectedTemplate);
            
            if (template) {
              // Get template content
              let displayText = '';
              
              if (template.components) {
                // For real templates
                const bodyComponent = template.components.find(c => c.type === 'BODY' || c.type === 'body');
                if (bodyComponent && bodyComponent.text) {
                  displayText = bodyComponent.text;
                }
              }
              
              // Replace variables in the text
              if (displayText && templateVariables.length > 0) {
                templateVariables.forEach(variable => {
                  const placeholder = `{{${variable.index}}}`;
                  let value = '';
                  
                  // Use the appropriate value based on variable type
                  if (variable.variableType === 'freeText') {
                    value = variable.freeText?.trim() || `[${variable.placeholder}]`;
                  } else {
                    value = variable.value.trim() || `[${variable.placeholder}]`;
                  }
                  
                  displayText = displayText.replace(new RegExp(placeholder, 'g'), value);
                });
              }
              
              return (
                <div>
                  <div className="mb-3 text-sm text-muted-foreground">
                    <strong>Template:</strong> {template.name} {template.language ? `(${typeof template.language === 'string' ? template.language : template.language.code})` : ''}
                  </div>
                  <div className="p-3 bg-background border rounded-md whitespace-pre-wrap">
                    {displayText || 'No content available'}
                  </div>
                </div>
              );
            }
            
            return <p>No template selected</p>;
          })()}
        </div>
      )}
    </div>
    
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
      This message will be sent to all {members.length} selected members.
    </div>
  </div>
);

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
  members: Member[],
  selectedTemplate: string,
  templates: Template[],
  templateVariables: TemplateVariable[],
  pricingInfo: any,
  loadingPricing: boolean,
  broadcastResults: BroadcastResult | null
}) => (
  <div className="space-y-6">                    
    <div className="space-y-2">
      <div className="p-2 border-b">
        <strong>Recipients:</strong> {members.length} members
      </div>
      <div className="p-2 border-b">
        <strong>Template:</strong> {templates.find(t => t.id === selectedTemplate)?.name || 'Custom Message'}
      </div>
      {templateVariables.length > 0 && (
        <div className="p-2 border-b">
          <strong>Variables:</strong> {templateVariables.map(v => `${v.placeholder}: ${v.value}`).join(', ')}
        </div>
      )}
    </div>
    
    {/* Pricing Information */}
    <div className="border rounded-md p-4">
      <h3 className="font-medium mb-2">Broadcast Cost</h3>
      
      {loadingPricing ? (
        <div className="text-center py-4 text-muted-foreground">Calculating cost...</div>
      ) : pricingInfo ? (
        <div>
          <div className="text-2xl font-bold mb-2">
            {pricingInfo.currency} {pricingInfo.totalCost.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{pricingInfo.recipientCount} recipients × {pricingInfo.currency} {pricingInfo.messageRate.toFixed(4)} per message</p>
            {pricingInfo.source === 'estimated' && (
              <p className="text-xs mt-1">* estimated cost based on standard rates</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-destructive">Unable to calculate cost</div>
      )}
    </div>
    
    {/* Broadcast Results */}
    {broadcastResults && (
      <div className="border rounded-md p-4">
        {broadcastResults.error ? (
          <div className="text-destructive">
            <h4 className="font-medium mb-2">Error Sending Broadcast</h4>
            <p>{broadcastResults.error}</p>
          </div>
        ) : (
          <div>
            <h4 className="font-medium mb-2">Broadcast Results</h4>
            <p className="mb-4">
              <span className="text-success font-medium">{broadcastResults.successful}</span> messages sent successfully,
              <span className="text-destructive font-medium ml-1">{broadcastResults.failed}</span> failed
            </p>
            
            {/* Detailed results for each recipient */}
            {broadcastResults.details && broadcastResults.details.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Recipient Details</h5>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {broadcastResults.details.map((detail, index) => (
                    <div 
                      key={detail.memberId || index} 
                      className={cn(
                        "p-2 rounded-md text-sm",
                        detail.status === 'sent' ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"
                      )}
                    >
                      <div className="font-medium">{detail.name}</div>
                      <div className="flex items-center mt-1">
                        {detail.status === 'sent' ? (
                          <span className="flex items-center text-success">
                            <Check className="h-4 w-4 mr-1" /> Sent
                          </span>
                        ) : (
                          <span className="flex items-center text-destructive">
                            <AlertCircle className="h-4 w-4 mr-1" /> Failed
                          </span>
                        )}
                      </div>
                      {detail.error && (
                        <div className="text-xs text-destructive mt-1">{detail.error}</div>
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
    
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
      <p>You are about to send this message to {members.length} members. This action cannot be undone.</p>
      <p className="mt-2">Click "Send Message" to proceed or "Back" to make changes.</p>
    </div>
  </div>
);
