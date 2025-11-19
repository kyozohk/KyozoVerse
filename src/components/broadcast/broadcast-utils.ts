// broadcast-utils.ts
import { Member, Template, TemplateVariable } from './broadcast-types';

/**
 * Processes a template for sending to the WhatsApp API
 */
export function processTemplate(template: Template, variables: TemplateVariable[], headerImageUrl?: string) {
  // Create a copy of the template to avoid modifying the original
  const processedTemplate: {
    name: string;
    language: { code: string };
    components: any[];
  } = {
    name: template.name,
    language: {
      code: typeof template.language === 'string' ? template.language : template.language?.code || 'en_US'
    },
    components: []
  };

  // Process template components if they exist
  if (template.components && Array.isArray(template.components)) {
    template.components.forEach((component: any) => {
      if (!component || !component.type) return;

      // Create a processed component
      const processedComponent: any = {
        type: mapComponentType(component.type)
      };

      // Add text for body and footer components
      if (component.text && (processedComponent.type === 'BODY' || processedComponent.type === 'FOOTER')) {
        processedComponent.text = component.text;
      }

      // Process parameters
      if (processedComponent.type === 'HEADER' && headerImageUrl) {
        // Add header image if provided
        processedComponent.parameters = [
          {
            type: 'image',
            image: {
              link: headerImageUrl
            }
          }
        ];
      } else if (component.parameters && Array.isArray(component.parameters)) {
        // Process existing parameters
        processedComponent.parameters = component.parameters.map((param: any) => {
          const processedParam: any = {
            type: param.type || 'text'
          };

          if (param.type === 'image' && param.image?.link) {
            processedParam.image = {
              link: param.image.link
            };
          } else if (param.type === 'document' && param.document?.link) {
            processedParam.document = {
              link: param.document.link
            };
          } else if (param.type === 'video' && param.video?.link) {
            processedParam.video = {
              link: param.video.link
            };
          } else {
            processedParam.text = param.text || '';
          }

          return processedParam;
        });
      }

      // Process buttons
      if (processedComponent.type === 'BUTTON' && component.buttons && Array.isArray(component.buttons)) {
        processedComponent.buttons = component.buttons
          .map((button: any) => {
            if (!button || !button.type) return null;

            if (button.type === 'URL' && button.text && button.url) {
              return {
                type: 'URL',
                text: button.text,
                url: button.url
              };
            } else if (button.type === 'PHONE_NUMBER' && button.text && button.phone_number) {
              return {
                type: 'PHONE_NUMBER',
                text: button.text,
                phone_number: button.phone_number
              };
            } else if (button.type === 'QUICK_REPLY' && button.text) {
              return {
                type: 'QUICK_REPLY',
                text: button.text
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      // Add the processed component to the template
      processedTemplate.components.push(processedComponent);
    });
  }

  return processedTemplate;
}

/**
 * Maps component types to the correct format expected by the API
 */
export function mapComponentType(type: string): string {
  // Convert to uppercase for comparison
  const upperType = type.toUpperCase();
  
  // Map of component types that need special handling
  const typeMap: Record<string, string> = {
    'BUTTONS': 'BUTTON',
    'buttons': 'BUTTON',
    'button': 'BUTTON',
    'HEADER': 'HEADER',
    'header': 'HEADER',
    'BODY': 'BODY',
    'body': 'BODY',
    'FOOTER': 'FOOTER',
    'footer': 'FOOTER'
  };
  
  // Return the mapped type or the original if no mapping exists
  return typeMap[upperType] || typeMap[type] || upperType;
}

/**
 * Checks if a template has a header with an image
 */
export function templateHasImageHeader(template: any): boolean {
  if (!template || !template.components || !Array.isArray(template.components)) {
    return false;
  }
  
  const headerComponent = template.components.find((comp: any) => 
    (comp.type === 'HEADER' || comp.type === 'header') &&
    comp.parameters && 
    Array.isArray(comp.parameters) &&
    comp.parameters.some((param: any) => param.type === 'image' && param.image?.link)
  );
  
  return !!headerComponent;
}

/**
 * Process variables for a specific member
 */
export function processVariablesForMember(variables: TemplateVariable[], member: Member) {
  return variables.map(variable => {
    let value = variable.value;

    // Apply member-specific values based on variable type
    if (variable.variableType === 'firstName' && member.displayName) {
      const fullName = member.displayName;
      value = fullName.split(' ')[0];
    } else if (variable.variableType === 'lastName' && member.displayName) {
      const fullName = member.displayName;
      value = fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : '';
    } else if (variable.variableType === 'freeText') {
      value = variable.freeText || '';
    }

    return {
      type: 'text',
      text: value
    };
  });
}

/**
 * Auto-fill variables with user data
 */
export function autoFillVariables(variables: TemplateVariable[], members: Member[]): TemplateVariable[] {
  if (!members || members.length === 0) return variables;

  // Use the first member as a reference for auto-fill
  const member = members[0];

  return variables.map(variable => {
    // Create a copy of the variable
    const filledVariable = { ...variable };

    // Set default variable type if not set
    filledVariable.variableType = filledVariable.variableType || 'freeText';

    // Auto-fill based on variable type
    if (filledVariable.variableType === 'firstName' && member.displayName) {
      const fullName = member.displayName;
      filledVariable.value = fullName.split(' ')[0];
    } else if (filledVariable.variableType === 'lastName' && member.displayName) {
      const fullName = member.displayName;
      filledVariable.value = fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : '';
    } else if (filledVariable.variableType === 'communityName') {
      filledVariable.value = 'Kyozo Community';
    }

    return filledVariable;
  });
}
