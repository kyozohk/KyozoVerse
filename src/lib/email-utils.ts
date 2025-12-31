
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

  return `
    <div style="${getCardStyles()}">
      <div style="${getInnerDivStyles()}">
        <div style="margin-bottom: 16px;">
          <span style="background-color: #D946A6; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 12px; text-transform: uppercase;">${post.type}</span>
          <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">${readTime} ${postDate ? `• ${postDate}` : ''}</span>
        </div>
        <h2 style="font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">${post.title}</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">${post.content.text || ''}</p>
        <a href="${postUrl}" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Read Full Article →</a>
      </div>
    </div>
  `;
}

function renderListenCard(post: Post, communityHandle: string): string {
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003'}/${communityHandle}/${post.id}`;
  return `
    <div style="${getCardStyles()}">
      <div style="${getInnerDivStyles()}">
        <div style="margin-bottom: 16px;">
          <span style="background-color: #3B82F6; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 12px; text-transform: uppercase;">Listen</span>
        </div>
        <h2 style="font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">${post.title}</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">${post.content.text || ''}</p>
        <a href="${postUrl}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">Listen Now</a>
      </div>
    </div>
  `;
}

function renderWatchCard(post: Post, communityHandle: string): string {
    const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003'}/${communityHandle}/${post.id}`;
    const imageUrl = post.content.mediaUrls?.[0] || 'https://via.placeholder.com/600x400';

    return `
      <div style="${getCardStyles()}">
        <a href="${postUrl}" style="text-decoration: none; color: inherit;">
          <div style="position: relative; padding-top: 56.25%; background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px;">
                <span style="background-color: #FBBF24; color: #1f2937; padding: 4px 8px; border-radius: 9999px; font-size: 12px; text-transform: uppercase; font-weight: 500;">Watch</span>
                <h2 style="font-size: 20px; font-weight: 600; color: white; margin-top: 8px;">${post.title}</h2>
            </div>
          </div>
        </a>
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

  // Wrap card in a full HTML body
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
            padding: 20px;
            background-color: #f3f4f6;
          }
        </style>
      </head>
      <body>
        <p style="margin-bottom: 16px; color: #4b5563;">A new post has been published in the ${communityHandle} community:</p>
        ${cardHtml}
      </body>
    </html>
  `;
}
