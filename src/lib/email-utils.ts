
import { type Post } from '@/lib/types';

function getCardStyles() {
    return `
      background-color: rgb(245, 241, 232);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 0 auto;
    `;
}

function getInnerDivStyles() {
    return `
      padding: 24px;
    `;
}

function renderReadCard(post: Post, communityHandle: string): string {
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003'}/${communityHandle}/${post.id}`;
  const readTime = `${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`;
  const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  const imageUrl = post.content.mediaUrls?.[0];

  return `
    <div style="${getCardStyles()}">
      <div style="${getInnerDivStyles()}">
        <!-- Category badge at top -->
        <div style="margin-bottom: 16px;">
          <span style="background-color: #926B7F; color: white; padding: 6px 12px; border-radius: 9999px; font-size: 11px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px;">READ</span>
          <span style="color: #6b7280; font-size: 11px; margin-left: 8px; text-transform: uppercase;">${readTime} ${postDate ? `• ${postDate}` : ''}</span>
        </div>
        
        <!-- Image if present -->
        ${imageUrl ? `
        <div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden;">
          <img src="${imageUrl}" alt="${post.title}" style="width: 100%; height: auto; display: block;" />
        </div>
        ` : ''}
        
        <!-- Title and content -->
        <h2 style="font-size: 28px; font-weight: 900; color: #433F36; margin-bottom: 12px; line-height: 1.2; letter-spacing: -0.02em;">${post.title}</h2>
        <p style="color: #433F36; line-height: 1.6; margin-bottom: 24px; opacity: 0.8;">${post.content.text || ''}</p>
        <a href="${postUrl}" style="color: #504c4c; text-decoration: none; font-weight: 500; text-transform: uppercase; font-size: 12px; letter-spacing: 0.35px;">Read Full Article →</a>
      </div>
    </div>
  `;
}

function renderListenCard(post: Post, communityHandle: string): string {
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003'}/${communityHandle}/${post.id}`;
  const readTime = `${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`;
  const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  
  return `
    <div style="${getCardStyles()}">
      <div style="${getInnerDivStyles()}">
        <!-- Category badge at top -->
        <div style="margin-bottom: 16px;">
          <span style="background-color: #6E94B1; color: white; padding: 6px 12px; border-radius: 9999px; font-size: 11px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px;">LISTEN</span>
          <span style="color: #6b7280; font-size: 11px; margin-left: 8px; text-transform: uppercase;">${readTime} ${postDate ? `• ${postDate}` : ''}</span>
        </div>
        
        <!-- Title and content -->
        <h2 style="font-size: 28px; font-weight: 900; color: #433F36; margin-bottom: 12px; line-height: 1.2; letter-spacing: -0.02em;">${post.title}</h2>
        <p style="color: #433F36; line-height: 1.6; margin-bottom: 24px; opacity: 0.8;">${post.content.text || ''}</p>
        <a href="${postUrl}" style="color: #504c4c; text-decoration: none; font-weight: 500; text-transform: uppercase; font-size: 12px; letter-spacing: 0.35px;">Listen Now →</a>
      </div>
    </div>
  `;
}

function renderWatchCard(post: Post, communityHandle: string): string {
    const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003'}/${communityHandle}/${post.id}`;
    const imageUrl = post.content.thumbnailUrl || post.content.mediaUrls?.[0] || 'https://via.placeholder.com/600x400';
    const readTime = `${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`;
    const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

    return `
      <div style="${getCardStyles()}">
        <div style="${getInnerDivStyles()}">
          <!-- Category badge at top -->
          <div style="margin-bottom: 16px;">
            <span style="background-color: #FBBF24; color: #1f2937; padding: 6px 12px; border-radius: 9999px; font-size: 11px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px;">WATCH</span>
            <span style="color: #6b7280; font-size: 11px; margin-left: 8px; text-transform: uppercase;">${readTime} ${postDate ? `• ${postDate}` : ''}</span>
          </div>
          
          <!-- Video thumbnail -->
          <div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden; position: relative;">
            <img src="${imageUrl}" alt="${post.title}" style="width: 100%; height: auto; display: block;" />
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background-color: rgba(0,0,0,0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <div style="width: 0; height: 0; border-left: 20px solid white; border-top: 12px solid transparent; border-bottom: 12px solid transparent; margin-left: 4px;"></div>
            </div>
          </div>
          
          <!-- Title and content -->
          <h2 style="font-size: 28px; font-weight: 900; color: #433F36; margin-bottom: 12px; line-height: 1.2; letter-spacing: -0.02em;">${post.title}</h2>
          <p style="color: #433F36; line-height: 1.6; margin-bottom: 24px; opacity: 0.8;">${post.content.text || ''}</p>
          <a href="${postUrl}" style="color: #504c4c; text-decoration: none; font-weight: 500; text-transform: uppercase; font-size: 12px; letter-spacing: 0.35px;">Watch Now →</a>
        </div>
      </div>
    `;
}

export function renderPostToHtml(post: Post & { id: string }, communityHandle: string): string {
  let cardHtml = '';

  switch (post.type) {
    case 'text':
    case 'image':
      cardHtml = renderReadCard(post, communityHandle);
      break;
    case 'audio':
      cardHtml = renderListenCard(post, communityHandle);
      break;
    case 'video':
      cardHtml = renderWatchCard(post, communityHandle);
      break;
    default:
      cardHtml = `<p>Check out the new post: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/${communityHandle}/${post.id}">${post.title}</a></p>`;
  }

  // Wrap card in a full HTML body with background image
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 40px 20px;
            background-image: url('${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003'}/bg/public-feed-bg.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
          }
          body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(217, 217, 217, 0.7);
            z-index: 0;
          }
          .content {
            position: relative;
            z-index: 1;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <p style="margin-bottom: 16px; color: #4b5563; font-weight: 500;">A new post has been published in the ${communityHandle} community:</p>
          ${cardHtml}
        </div>
      </body>
    </html>
  `;
}
