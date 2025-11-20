import { CommunityMember } from "@/lib/types";

// broadcast-types.ts
export interface TemplateVariable {
  index: number;
  value: string;
  placeholder: string;
  variableType?: 'firstName' | 'lastName' | 'communityName' | 'freeText';
  freeText?: string;
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | string;
  format?: string;
  text?: string;
  parameters?: TemplateParameter[];
  buttons?: TemplateButton[];
  example?: {
    header_handle?: boolean;
    [key: string]: any;
  };
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'document' | 'video' | string;
  text?: string;
  image?: {
    link: string;
  };
  document?: {
    link: string;
  };
  video?: {
    link: string;
  };
}

export interface TemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | string;
  text: string;
  url?: string;
  phone_number?: string;
}

export interface Template {
  id: string;
  name: string;
  language: string | { code: string };
  category?: string;
  components?: TemplateComponent[];
  status?: string;
  wabaAccountId?: string;
  channelId?: string;
  variables?: TemplateVariable[];
}

export interface Member {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  status?: string;
  role?: string;
  joinedAt?: any;
  metadata?: any;
  userDetails?: {
      phoneNumber?: string;
  }
}

export interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: (Member | CommunityMember)[];
  onContinue?: (selectedMembers: (Member | CommunityMember)[], templateData?: any) => void;
  templates?: Template[];
  loadingTemplates?: boolean;
}

export interface BroadcastResult {
  successful: number;
  failed: number;
  details: Array<{
    memberId: string;
    name: string;
    status: string;
    phone?: string;
    error?: string;
  }>;
  error?: string;
}

export enum BroadcastStep {
  RECIPIENTS = 1,
  TEMPLATE = 2,
  PREVIEW = 3,
  CONFIRM = 4
}
