
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomFormDialog, Input, CustomButton, Textarea, Label } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { TemplateSelector } from './template-selector';
import { THEME_COLORS } from '@/lib/theme-colors';
import { BroadcastStep, BroadcastModalProps, Template, TemplateVariable, BroadcastResult, Member } from './broadcast-types';
import { StepIndicator, RecipientsStep, TemplateStep, PreviewStep, ConfirmStep } from './broadcast-components';
import { processTemplate, processVariablesForMember, autoFillVariables, templateHasImageHeader } from './broadcast-utils';
import { CommunityMember } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

/**
 * BroadcastDialog Component
 * 
 * A dialog for sending WhatsApp template messages to multiple recipients
 */
const BroadcastDialog: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  members,
  onContinue,
  templates = [],
  loadingTemplates = false,
  mode = 'whatsapp' // Default to WhatsApp for backward compatibility
}) => {
  // State management
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<BroadcastStep>(BroadcastStep.RECIPIENTS);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [pricingInfo, setPricingInfo] = useState<any>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResult | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<(Member | CommunityMember)[]>([]);

  
  // Refs for preventing double submissions
  const initialOpenRef = useRef(true);
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);
  
  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
        // Filter out owners and admins - only include regular members
        const regularMembers = members.filter(member => {
          const role = (member as CommunityMember).role || 'member';
          return role === 'member'; // Exclude 'owner' and 'admin'
        });
        setSelectedMembers(regularMembers);
        if (initialOpenRef.current) {
            setCurrentStep(BroadcastStep.RECIPIENTS);
            initialOpenRef.current = false;
        }
    } else {
        initialOpenRef.current = true;
    }
}, [isOpen, members]);


  // Use templates only from API/props; do not fall back to hard-coded templates
  const displayTemplates = templates && templates.length > 0 
    ? templates.map(template => {
        // Extract variables from template components if they exist
        const variables: TemplateVariable[] = [];
        
        if (template.components) {
          template.components.forEach(component => {
            if ((component.type === 'BODY' || component.type === 'body') && component.text) {
              // Find all {{number}} patterns in the text
              const matches = component.text.match(/\{\{(\d+)\}\}/g);
              if (matches) {
                // Create unique variables based on matches
                const uniqueIndices = new Set();
                matches.forEach(match => {
                  const index = parseInt(match.replace('{{', '').replace('}}', ''));
                  if (!uniqueIndices.has(index)) {
                    uniqueIndices.add(index);
                    variables.push({
                      index,
                      value: '',
                      placeholder: `Variable ${index}`
                    });
                  }
                });
              }
            }
          });
        }
        
        return { 
          ...template,
          variables: variables
        };
      })
    : [];
    
  // Set default template when templates are loaded
  useEffect(() => {
    if (displayTemplates.length > 0 && !selectedTemplate) {
      const defaultTemplate = displayTemplates[0];
      setSelectedTemplate(defaultTemplate.id);
      
      // Auto-fill variables for the default template
      if (defaultTemplate.variables) {
        const filledVariables = autoFillVariables(defaultTemplate.variables, members);
        setTemplateVariables(filledVariables);
      } else {
        setTemplateVariables([]);
      }
    }
  }, [displayTemplates, selectedTemplate, members]);
  
  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    const template = displayTemplates.find(t => t.id === templateId);
    setSelectedTemplate(templateId);
    
    if (template && template.variables) {
      // Auto-fill variables with user data when template is selected
      const filledVariables = autoFillVariables(template.variables, members);
      setTemplateVariables(filledVariables);
    } else {
      setTemplateVariables([]);
    }
  };
  
  // Handle header image URL change
  const handleHeaderImageChange = (url: string) => {
    setHeaderImageUrl(url);
  };
  
  // Handle variable value change
  const handleVariableChange = (index: number, value: string) => {
    setTemplateVariables(prev => 
      prev.map(v => v.index === index ? { ...v, value } : v)
    );
  };

  // Handle variable type selection
  const handleVariableTypeChange = (index: number, variableType: string) => {
    setTemplateVariables(prev => 
      prev.map(v => {
        if (v.index === index) {
          // Set default value based on variable type
          let value = '';
          if (variableType === 'firstName' && members.length > 0) {
            const displayName = 'userId' in members[0] ? members[0].userDetails?.displayName : (members[0] as Member).displayName;
            const fullName = displayName || '';
            value = fullName.split(' ')[0];
          } else if (variableType === 'lastName' && members.length > 0) {
            const displayName = 'userId' in members[0] ? members[0].userDetails?.displayName : (members[0] as Member).displayName;
            const fullName = displayName || '';
            value = fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : '';
          } else if (variableType === 'communityName') {
            value = 'Kyozo Community';
          }
          
          return { 
            ...v, 
            variableType: variableType as any,
            value: variableType === 'freeText' ? v.freeText || '' : value,
            freeText: v.freeText || ''
          };
        }
        return v;
      })
    );
  };

  // Handle free text input for variables
  const handleFreeTextChange = (index: number, freeText: string) => {
    setTemplateVariables(prev => 
      prev.map(v => {
        if (v.index === index) {
          return { 
            ...v, 
            freeText,
            value: v.variableType === 'freeText' ? freeText : v.value 
          };
        }
        return v;
      })
    );
  };
  
  // Check if all variables are filled
  const areVariablesFilled = () => {
    if (templateVariables.length === 0) return true;
    return templateVariables.every(v => v.value.trim() !== '');
  };
  
  // Check if the selected template has an image header
  const hasImageHeader = () => {
    const template = displayTemplates.find(t => t.id === selectedTemplate);
    const result = template ? templateHasImageHeader(template) : false;
    console.log('[BroadcastDialog] hasImageHeader check:', {
      selectedTemplate,
      hasTemplate: !!template,
      templateComponents: template?.components,
      result
    });
    return result;
  };
  
  // Function to check pricing for the broadcast
  const checkPricing = async () => {
    setLoadingPricing(true);
    setPricingInfo(null);
    
    try {
      const template = displayTemplates.find(t => t.id === selectedTemplate);
      
      const response = await fetch('/api/whatsapp/check-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientCount: members.length,
          templateName: template?.name,
          isTemplate: true
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setPricingInfo(data.pricing);
      } else {
        // Set default pricing as fallback
        setPricingInfo({
          recipientCount: members.length,
          messageRate: 0.005,
          totalCost: members.length * 0.005,
          currency: 'USD',
          isTemplate: true,
          templateName: template?.name || 'Unknown',
          source: 'estimated'
        });
      }
    } catch (error) {
      // Set default pricing as fallback
      setPricingInfo({
        recipientCount: members.length,
        messageRate: 0.005,
        totalCost: members.length * 0.005,
        currency: 'USD',
        isTemplate: true,
        source: 'estimated'
      });
    } finally {
      setLoadingPricing(false);
    }
  };

  // Function to send the broadcast
  const sendBroadcast = async () => {
    console.log('[BroadcastDialog] Starting broadcast send', {
      membersCount: members.length,
      selectedTemplate,
      hasImageHeader: hasImageHeader(),
      headerImageUrl,
    });

    setSendingBroadcast(true);
    setBroadcastResults(null);
    
    try {
      // Validate header image requirements
      if (hasImageHeader()) {
        if (!headerImageUrl || !headerImageUrl.trim()) {
          alert('Please provide an image URL for the template header');
          setSendingBroadcast(false);
          return;
        }
        // Validate URL format
        try {
          new URL(headerImageUrl);
        } catch (e) {
          alert('Please provide a valid image URL (must start with http:// or https://)');
          setSendingBroadcast(false);
          return;
        }
      }
      
      const template = displayTemplates.find(t => t.id === selectedTemplate);
      if (!template) {
        console.error('[BroadcastDialog] Template not found for id', selectedTemplate);
        throw new Error('Template not found');
      }
      
      // Process template structure
      const templateData = processTemplate(template, templateVariables, headerImageUrl);
      console.log('[BroadcastDialog] Base templateData for broadcast:', templateData);
      
      // Track results
      const results: BroadcastResult = {
        successful: 0,
        failed: 0,
        details: []
      };
      
      // Process each recipient
      for (const member of members) {
        try {
          const memberPhone = 'userId' in member ? (member.userDetails?.phone || member.userDetails?.phoneNumber) : (member as Member).phone;
          const memberId = 'userId' in member ? member.userId : (member as Member).id;
          const memberDisplayName = 'userId' in member ? member.userDetails?.displayName : (member as Member).displayName;

          // Skip members without phone numbers
          if (!memberPhone) {
            console.warn('[BroadcastDialog] Skipping member without phone number', {
              memberId,
              memberDisplayName,
            });
            results.failed++;
            results.details.push({
              memberId: memberId,
              name: memberDisplayName || 'Unknown',
              status: 'failed',
              phone: undefined,
              error: 'No phone number provided'
            });
            continue;
          }

          // Create a copy of the template data for this recipient
          const memberTemplateData = JSON.parse(JSON.stringify(templateData));
          
          // Replace variables with recipient-specific values
          if (memberTemplateData.components && memberTemplateData.components.length > 0) {
            const bodyComponent = memberTemplateData.components.find((c: any) => c.type === 'BODY' || c.type === 'body');
            
            if (bodyComponent) {
              bodyComponent.parameters = processVariablesForMember(templateVariables, member);
            }
          }
          
          // Clean and format phone number
          // Remove all spaces, dashes, and parentheses
          let cleanPhone = memberPhone.replace(/[\s\-\(\)]/g, '');
          // Remove leading + if present
          if (cleanPhone.startsWith('+')) {
            cleanPhone = cleanPhone.substring(1);
          }
          // Remove duplicate country codes (e.g., "852852..." becomes "852...")
          // This handles cases where phone is stored as "852 +852 1234 5678"
          const countryCodeMatch = cleanPhone.match(/^(\d{1,4})\1/);
          if (countryCodeMatch) {
            cleanPhone = cleanPhone.substring(countryCodeMatch[1].length);
          }
          
          // Create payload
          const recipientPayload = {
            to: cleanPhone,
            type: "template",
            template: memberTemplateData,
            messaging_product: "whatsapp"
          };
          console.log('[BroadcastDialog] Sending WhatsApp message for member', {
            memberId,
            memberDisplayName,
            rawPhone: memberPhone,
            to: recipientPayload.to,
            templateName: recipientPayload.template?.name,
            templateLanguage: recipientPayload.template?.language?.code,
          });
          
          // Send message
          const response = await fetch('/api/whatsapp/send-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipientPayload),
          });
          
          const data = await response.json();
          console.log('[BroadcastDialog] Response from /api/whatsapp/send-template', {
            memberId,
            status: response.status,
            ok: response.ok,
            data,
          });
          
          // Process response
          if (response.ok && data.success) {
            results.successful++;
            results.details.push({
              memberId: memberId,
              name: memberDisplayName || 'Unknown',
              status: 'sent',
              phone: memberPhone,
            });
          } else {
            results.failed++;
            results.details.push({
              memberId: memberId,
              name: memberDisplayName || 'Unknown',
              status: 'failed',
              phone: memberPhone,
              error: typeof data.error === 'object' ? JSON.stringify(data.error) : data.error || data.errorMessage || 'Unknown error'
            });
          }
        } catch (error) {
          const memberId = 'userId' in member ? member.userId : (member as Member).id;
          const memberDisplayName = 'userId' in member ? member.userDetails?.displayName : (member as Member).displayName;
          console.error('[BroadcastDialog] Error sending message to member', {
            memberId,
            memberDisplayName,
            error,
          });
          results.failed++;
          results.details.push({
            memberId: memberId,
            name: memberDisplayName || 'Unknown',
            status: 'failed',
            phone: memberPhone,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      console.log('[BroadcastDialog] Broadcast completed with results', results);
      setBroadcastResults(results);
      
      // Close modal on success after delay
      if (results.failed === 0) {
        setTimeout(() => onClose(), 5000);
      }
    } catch (error) {
      setBroadcastResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        successful: 0,
        failed: 0,
        details: []
      });
    } finally {
      setSendingBroadcast(false);
    }
  };
  
  // Handle next step with debounce to prevent double submissions
  const goToNextStep = () => {
    // Prevent rapid double submissions
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSubmitTimeRef.current < 500) {
      return;
    }
    
    // Check if variables are filled when moving from step 2 to 3
    if (currentStep === BroadcastStep.TEMPLATE && !areVariablesFilled()) {
      alert('Please fill in all template variables before proceeding.');
      return;
    }
    
    // Set submission state
    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    
    if (currentStep < BroadcastStep.CONFIRM) {
      const nextStep = currentStep + 1;
      
      // If moving to the final step, check pricing
      if (nextStep === BroadcastStep.CONFIRM) {
        checkPricing();
      }
      
      setCurrentStep(nextStep);
    } else {
      // Final step - send the broadcast
      sendBroadcast();
    }
    
    // Reset submission state after a delay
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);
  };
  
  // Handle previous step
  const goToPreviousStep = () => {
    // Prevent rapid double submissions
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSubmitTimeRef.current < 500) {
      return;
    }
    
    // Set submission state
    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    
    if (currentStep > BroadcastStep.RECIPIENTS) {
      setCurrentStep(currentStep - 1);
    }
    
    // Reset submission state after a delay
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);
  };
  
  const handleToggleMember = (member: Member | CommunityMember) => {
    const memberId = 'userId' in member ? member.userId : (member as Member).id;
    setSelectedMembers(prev =>
        prev.some(m => ('userId' in m ? m.userId : (m as Member).id) === memberId)
            ? prev.filter(m => ('userId' in m ? m.userId : (m as Member).id) !== memberId)
            : [...prev, member]
    );
  };
  
  // Get step info for UI
  const getStepInfo = () => {
    const messageType = mode === 'email' ? 'email' : 'message';
    switch (currentStep) {
      case BroadcastStep.RECIPIENTS:
        return {
          title: "Confirm Recipients",
          subtitle: `Send ${messageType} to ${selectedMembers.length} selected members`,
        };
      case BroadcastStep.TEMPLATE:
        return {
          title: mode === 'email' ? "Compose Email" : "Choose Template",
          subtitle: mode === 'email' ? "Compose your email message" : "Select a message template for your broadcast",
        };
      case BroadcastStep.PREVIEW:
        return {
          title: mode === 'email' ? "Email Preview" : "Message Preview",
          subtitle: mode === 'email' ? "Review your email before sending" : "Review how your message will appear",
        };
      case BroadcastStep.CONFIRM:
        return {
          title: "Confirm & Send",
          subtitle: `Send ${messageType} to ${members.length} recipients`,
        };
      default:
        return {
          title: mode === 'email' ? "Send Email" : "Broadcast Message",
          subtitle: mode === 'email' ? "Send email to community members" : "Send message to community members",
        };
    }
  };
  
  const { title, subtitle } = getStepInfo();
  
  if (!isOpen) return null;
  
  // Render the dialog with step content
  return (
    <CustomFormDialog
      open={isOpen}
      onOpenChange={(open) => {if (!open) onClose()}}
      title={title}
      description={subtitle}
      color={THEME_COLORS.broadcast.primary}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow overflow-y-auto mb-6">
          {currentStep === BroadcastStep.RECIPIENTS && (
            <RecipientsStep members={members} onMemberClick={handleToggleMember} selectedMembers={selectedMembers} />
          )}
          
          {currentStep === BroadcastStep.TEMPLATE && (
            <TemplateStep
              templates={displayTemplates}
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              templateVariables={templateVariables}
              onVariableChange={handleVariableChange}
              onVariableTypeChange={handleVariableTypeChange}
              onFreeTextChange={handleFreeTextChange}
              headerImageUrl={headerImageUrl}
              onHeaderImageChange={handleHeaderImageChange}
              hasImageHeader={hasImageHeader()}
              loadingTemplates={loadingTemplates}
            />
          )}
          
          {currentStep === BroadcastStep.PREVIEW && (
            <PreviewStep
              selectedTemplate={selectedTemplate}
              templates={displayTemplates}
              templateVariables={templateVariables}
              members={members}
            />
          )}
          
          {currentStep === BroadcastStep.CONFIRM && (
            <ConfirmStep
              members={members}
              selectedTemplate={selectedTemplate}
              templates={displayTemplates}
              templateVariables={templateVariables}
              pricingInfo={pricingInfo}
              loadingPricing={loadingPricing}
              broadcastResults={broadcastResults}
            />
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <CustomButton
            variant="outline"
            onClick={currentStep === BroadcastStep.RECIPIENTS ? onClose : goToPreviousStep}
            disabled={sendingBroadcast}
            className="w-full"
          >
            {currentStep === BroadcastStep.RECIPIENTS ? "Cancel" : "Back"}
          </CustomButton>
          
          <CustomButton
            variant="outline"
            onClick={goToNextStep}
            disabled={(currentStep === BroadcastStep.TEMPLATE && !areVariablesFilled()) || sendingBroadcast || selectedMembers.length === 0}
            isLoading={sendingBroadcast}
            className="w-full"
          >
            {currentStep === BroadcastStep.CONFIRM ? "Send Message" : "Next"}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
};

export default BroadcastDialog;
