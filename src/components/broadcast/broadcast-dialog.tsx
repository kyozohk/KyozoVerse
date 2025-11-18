'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CustomFormDialog } from '@/components/ui/dialog';
import { CustomButton } from '@/components/ui';
import { BroadcastStep, BroadcastModalProps, Template, TemplateVariable, BroadcastResult } from './broadcast-types';
import { StepIndicator, RecipientsStep, TemplateStep, PreviewStep, ConfirmStep } from './broadcast-components';
import { processTemplate, processVariablesForMember, autoFillVariables, templateHasImageHeader } from './broadcast-utils';

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
  loadingTemplates = false
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState<BroadcastStep>(BroadcastStep.RECIPIENTS);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [pricingInfo, setPricingInfo] = useState<any>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResult | null>(null);
  
  // Refs for preventing double submissions
  const initialOpenRef = useRef(true);
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);
  
  // Reset on open/close
  useEffect(() => {
    if (isOpen && initialOpenRef.current) {
      setCurrentStep(BroadcastStep.RECIPIENTS);
      initialOpenRef.current = false;
    } else if (!isOpen) {
      initialOpenRef.current = true;
    }
  }, [isOpen]);

  // Fallback templates if no templates are provided from API
  const fallbackTemplates: Template[] = [
    { 
      id: 'template1', 
      name: 'Welcome Message',
      language: 'en_US',
      components: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, thanks for getting in touch with {{2}}. We will process your request and get back to you shortly'
        }
      ],
      variables: [
        { index: 1, value: '', placeholder: 'Customer Name' },
        { index: 2, value: '', placeholder: 'Company Name' }
      ]
    },
    { 
      id: 'template2', 
      name: 'Event Reminder',
      language: 'en_US',
      components: [
        {
          type: 'BODY',
          text: 'Hello {{1}}, this is a reminder for your upcoming event on {{2}} at {{3}}. We look forward to seeing you there!'
        }
      ],
      variables: [
        { index: 1, value: '', placeholder: 'Customer Name' },
        { index: 2, value: '', placeholder: 'Event Date' },
        { index: 3, value: '', placeholder: 'Event Time' }
      ]
    },
  ];
  
  // Use real templates from API or fallback to default templates
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
    : fallbackTemplates;
    
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
            const fullName = members[0].displayName || '';
            value = fullName.split(' ')[0];
          } else if (variableType === 'lastName' && members.length > 0) {
            const fullName = members[0].displayName || '';
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
    return template ? templateHasImageHeader(template) : false;
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
    setSendingBroadcast(true);
    setBroadcastResults(null);
    
    try {
      // Validate header image requirements
      if (hasImageHeader() && !headerImageUrl) {
        alert('Please provide an image URL for the template header');
        setSendingBroadcast(false);
        return;
      }
      
      const template = displayTemplates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Process template structure
      const templateData = processTemplate(template, templateVariables, headerImageUrl);
      
      // Track results
      const results: BroadcastResult = {
        successful: 0,
        failed: 0,
        details: []
      };
      
      // Process each recipient
      for (const member of members) {
        try {
          // Skip members without phone numbers
          if (!member.phone) {
            results.failed++;
            results.details.push({
              memberId: member.id,
              name: member.displayName,
              status: 'failed',
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
          
          // Create payload
          const recipientPayload = {
            to: member.phone?.startsWith('+') ? member.phone.substring(1) : member.phone,
            type: "template",
            template: memberTemplateData,
            messaging_product: "whatsapp"
          };
          
          // Send message
          const response = await fetch('/api/whatsapp/send-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipientPayload),
          });
          
          const data = await response.json();
          
          // Process response
          if (response.ok && data.success) {
            results.successful++;
            results.details.push({
              memberId: member.id,
              name: member.displayName,
              status: 'sent',
            });
          } else {
            results.failed++;
            results.details.push({
              memberId: member.id,
              name: member.displayName,
              status: 'failed',
              error: typeof data.error === 'object' ? JSON.stringify(data.error) : data.error || data.errorMessage || 'Unknown error'
            });
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            memberId: member.id,
            name: member.displayName,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
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
  
  // Get step info for UI
  const getStepInfo = () => {
    switch (currentStep) {
      case BroadcastStep.RECIPIENTS:
        return {
          title: "Confirm Recipients",
          subtitle: `Send message to ${members.length} selected members`,
        };
      case BroadcastStep.TEMPLATE:
        return {
          title: "Choose Template",
          subtitle: "Select a message template for your broadcast",
        };
      case BroadcastStep.PREVIEW:
        return {
          title: "Message Preview",
          subtitle: "Review how your message will appear",
        };
      case BroadcastStep.CONFIRM:
        return {
          title: "Confirm & Send",
          subtitle: `Send message to ${members.length} recipients`,
        };
      default:
        return {
          title: "Broadcast Message",
          subtitle: "Send message to community members",
        };
    }
  };
  
  const { title, subtitle } = getStepInfo();
  
  if (!isOpen) return null;
  
  // Render the dialog with step content
  return (
    <CustomFormDialog
      open={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle}
      backgroundImage="/bg/light_app_bg.png"
      color="#F59E0B" // Amber color for broadcast
    >
      <div className="flex flex-col h-full">
        <StepIndicator currentStep={currentStep} />
        
        <div className="flex-grow overflow-y-auto mb-6">
          {currentStep === BroadcastStep.RECIPIENTS && (
            <RecipientsStep members={members} />
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
        
        <div className="flex justify-between mt-auto">
          <CustomButton
            variant="outline"
            onClick={currentStep === BroadcastStep.RECIPIENTS ? onClose : goToPreviousStep}
            disabled={sendingBroadcast}
          >
            {currentStep === BroadcastStep.RECIPIENTS ? "Cancel" : "Back"}
          </CustomButton>
          
          <CustomButton
            variant="primary"
            onClick={goToNextStep}
            disabled={(currentStep === BroadcastStep.TEMPLATE && !areVariablesFilled()) || sendingBroadcast}
            isLoading={sendingBroadcast}
          >
            {currentStep === BroadcastStep.CONFIRM ? "Send Message" : "Next"}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
};

export default BroadcastDialog;
