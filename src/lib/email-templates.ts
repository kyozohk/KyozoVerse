/**
 * Kyozo Branded Email Templates
 * 
 * This file contains all email templates used throughout the Kyozo platform.
 * Templates use inline styles for maximum email client compatibility.
 */

// Brand colors
const BRAND_COLORS = {
  primary: '#433F36',
  secondary: '#926B7F',
  accent: '#23AF98',
  background: '#F5F1E8',
  muted: '#6b7280',
  white: '#ffffff',
};

// Base email wrapper with Kyozo branding
function getEmailWrapper(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Kyozo</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><style>@media only screen{.preview-text{display:none!important}}</style>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f5;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${BRAND_COLORS.background};
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content-padding {
        padding: 24px 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  ${previewText ? `<div class="preview-text" style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${previewText}</div>` : ''}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="margin: 0 auto; background-color: ${BRAND_COLORS.background}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; text-align: center;">
              <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://kyozo.com'}/logo.svg" alt="Kyozo" width="120" style="display: inline-block;" />
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td class="content-padding" style="padding: 0 40px 40px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND_COLORS.primary}; text-align: center;">
              <p style="margin: 0 0 8px 0; color: ${BRAND_COLORS.white}; font-size: 14px; opacity: 0.9;">
                © ${new Date().getFullYear()} Kyozo. All rights reserved.
              </p>
              <p style="margin: 0; color: ${BRAND_COLORS.white}; font-size: 12px; opacity: 0.7;">
                Where creative minds converge
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Button component
function getButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const bgColor = variant === 'primary' ? BRAND_COLORS.accent : BRAND_COLORS.secondary;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color: ${bgColor}; border-radius: 8px; padding: 14px 28px;">
          <a href="${url}" style="color: ${BRAND_COLORS.white}; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Verification code display
function getVerificationCodeBlock(code: string): string {
  return `
    <div style="background-color: ${BRAND_COLORS.white}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 2px dashed ${BRAND_COLORS.secondary};">
      <p style="margin: 0 0 8px 0; color: ${BRAND_COLORS.muted}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
      <p style="margin: 0; font-size: 42px; font-weight: 700; color: ${BRAND_COLORS.primary}; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${code}
      </p>
      <p style="margin: 16px 0 0 0; color: ${BRAND_COLORS.muted}; font-size: 12px;">
        This code expires in 10 minutes
      </p>
    </div>
  `;
}

// Feature list item
function getFeatureItem(icon: string, title: string, description: string): string {
  return `
    <tr>
      <td style="padding: 12px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="48" valign="top" style="padding-right: 16px;">
              <div style="width: 40px; height: 40px; background-color: ${BRAND_COLORS.accent}; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">
                ${icon}
              </div>
            </td>
            <td valign="top">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: ${BRAND_COLORS.primary}; font-size: 16px;">${title}</p>
              <p style="margin: 0; color: ${BRAND_COLORS.muted}; font-size: 14px; line-height: 1.5;">${description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Welcome email for new community owners
 */
export function getWelcomeEmail(ownerName: string): string {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kyozo.com'}/communities`;
  
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.primary}; line-height: 1.3;">
      Welcome to Kyozo, ${ownerName}! 🎉
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      You've just joined a platform where creative minds converge. As a community owner, you now have the power to build, nurture, and grow your own creative community.
    </p>
    
    <div style="background-color: ${BRAND_COLORS.white}; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: ${BRAND_COLORS.primary};">
        Here's what you can do with Kyozo:
      </h2>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${getFeatureItem('🏠', 'Create Your Community', 'Build a home for your audience with a custom branded space.')}
        ${getFeatureItem('📢', 'Broadcast Content', 'Share posts, updates, and exclusive content with your members.')}
        ${getFeatureItem('👥', 'Manage Members', 'Invite, organize, and engage with your community members.')}
        ${getFeatureItem('📊', 'Track Analytics', 'Understand your community growth and engagement metrics.')}
        ${getFeatureItem('🎨', 'Customize Branding', 'Make your community uniquely yours with custom themes and assets.')}
        ${getFeatureItem('💬', 'Direct Messaging', 'Connect with your members through WhatsApp and email broadcasts.')}
      </table>
    </div>
    
    <p style="margin: 0 0 8px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6;">
      Ready to get started?
    </p>
    
    ${getButton('Go to Dashboard', dashboardUrl)}
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.6;">
      If you have any questions, just reply to this email. We're here to help you succeed!
    </p>
    
    <p style="margin: 16px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.primary};">
      — The Kyozo Team
    </p>
  `;
  
  return getEmailWrapper(content, `Welcome to Kyozo, ${ownerName}! Start building your creative community today.`);
}

/**
 * Email verification code for signup
 */
export function getVerificationEmail(recipientName: string, code: string): string {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.primary}; line-height: 1.3;">
      Verify your email
    </h1>
    <p style="margin: 0 0 8px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      Please use the verification code below to complete your Kyozo account setup.
    </p>
    
    ${getVerificationCodeBlock(code)}
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.6;">
      If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
    </p>
    
    <p style="margin: 16px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.primary};">
      — The Kyozo Team
    </p>
  `;
  
  return getEmailWrapper(content, `Your Kyozo verification code is ${code}`);
}

/**
 * Password reset email
 */
export function getPasswordResetEmail(recipientName: string, resetUrl: string): string {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.primary}; line-height: 1.3;">
      Reset your password
    </h1>
    <p style="margin: 0 0 8px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    ${getButton('Reset Password', resetUrl)}
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
    
    <p style="margin: 0 0 8px 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 16px 0; font-size: 12px; color: ${BRAND_COLORS.accent}; word-break: break-all;">
      ${resetUrl}
    </p>
    
    <p style="margin: 16px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.primary};">
      — The Kyozo Team
    </p>
  `;
  
  return getEmailWrapper(content, 'Reset your Kyozo password');
}

/**
 * Community invitation email
 */
export function getCommunityInviteEmail(
  recipientName: string,
  communityName: string,
  inviterName: string,
  inviteUrl: string,
  communityDescription?: string
): string {
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.primary}; line-height: 1.3;">
      You're invited to join ${communityName}
    </h1>
    <p style="margin: 0 0 8px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      ${inviterName} has invited you to join their community on Kyozo.
    </p>
    
    <div style="background-color: ${BRAND_COLORS.white}; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: ${BRAND_COLORS.primary};">
        ${communityName}
      </h2>
      ${communityDescription ? `<p style="margin: 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.5;">${communityDescription}</p>` : ''}
    </div>
    
    ${getButton('Accept Invitation', inviteUrl)}
    
    <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.6;">
      This invitation will expire in 7 days.
    </p>
    
    <p style="margin: 16px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.primary};">
      — The Kyozo Team
    </p>
  `;
  
  return getEmailWrapper(content, `${inviterName} invited you to join ${communityName} on Kyozo`);
}

/**
 * Member welcome email (when someone joins a community)
 */
export function getMemberWelcomeEmail(
  memberName: string,
  communityName: string,
  communityHandle: string,
  ownerName?: string
): string {
  const communityUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kyozo.com'}/${communityHandle}`;
  
  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.primary}; line-height: 1.3;">
      Welcome to ${communityName}! 🎉
    </h1>
    <p style="margin: 0 0 8px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      Hi ${memberName},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: ${BRAND_COLORS.primary}; line-height: 1.6; opacity: 0.85;">
      You're now a member of ${communityName}${ownerName ? `, created by ${ownerName}` : ''}. Get ready to connect with fellow community members and access exclusive content.
    </p>
    
    ${getButton('Visit Community', communityUrl)}
    
    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.muted}; line-height: 1.6;">
      Stay tuned for updates and new content from the community!
    </p>
    
    <p style="margin: 16px 0 0 0; font-size: 14px; color: ${BRAND_COLORS.primary};">
      — The Kyozo Team
    </p>
  `;
  
  return getEmailWrapper(content, `Welcome to ${communityName} on Kyozo!`);
}

export { getEmailWrapper, getButton, getVerificationCodeBlock, BRAND_COLORS };

// Default templates export for server actions
export const defaultTemplates = {
  verificationCode: {
    subject: 'Verify your Kyozo account',
    html: (recipientName: string, code: string) => getVerificationEmail(recipientName, code)
  },
  welcome: {
    subject: 'Welcome to Kyozo!',
    html: (userName: string, referralCode?: string, referralLink?: string, appUrl?: string) => 
      getWelcomeEmail(userName)
  },
  passwordReset: {
    subject: 'Reset your Kyozo password',
    html: (userName: string, link: string) => getPasswordResetEmail(userName, link)
  },
  accountDeletion: {
    subject: 'Account deletion confirmation',
    html: (userName: string, code: string) => getVerificationEmail(userName, code)
  },
  referralSuccess: {
    subject: 'You\'ve earned points!',
    html: (params: any) => getEmailWrapper('You earned points!', 'Referral success')
  },
  productUpdate: {
    subject: 'Update from Kyozo',
    html: (userName: string, customBody?: string) => getEmailWrapper(customBody || 'Update', 'Product update')
  },
  shippingNotification: {
    subject: 'Your reward has shipped!',
    html: (userName: string, rewardTitle: string, trackingCode: string) => 
      getEmailWrapper(`Your reward ${rewardTitle} has shipped with tracking ${trackingCode}`, 'Shipping notification')
  },
  vipDepositReceipt: {
    subject: 'VIP Deposit Receipt - Welcome to PawMe!',
    html: (userName: string, amount: string, appUrl?: string) => 
      getEmailWrapper(`VIP deposit receipt for ${amount}`, 'VIP Deposit Receipt')
  },
  passwordResetCode: {
    subject: 'Reset Your Password',
    html: (code: string) => getVerificationEmail('User', code)
  },
  header: {
    html: () => ''
  },
  footer: {
    html: () => ''
  }
};
