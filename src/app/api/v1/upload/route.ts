import { NextRequest } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

const VALID_TYPES: Record<string, string> = {
  'image/jpeg': 'images', 'image/png': 'images', 'image/gif': 'images',
  'image/webp': 'images', 'image/svg+xml': 'images',
  'audio/mpeg': 'audio', 'audio/mp3': 'audio', 'audio/wav': 'audio',
  'audio/ogg': 'audio', 'audio/webm': 'audio', 'audio/m4a': 'audio',
  'video/mp4': 'videos', 'video/webm': 'videos', 'video/ogg': 'videos',
  'video/quicktime': 'videos',
};
const MAX_SIZE = 100 * 1024 * 1024;

async function POST(req: NextRequest, ctx: ApiContext) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return apiError('Multipart form data required.', 400);

  const file = formData.get('file') as File | null;
  const communityId = formData.get('communityId') as string | null;

  if (!file) return apiError('file field is required.', 400);
  if (!communityId) return apiError('communityId field is required.', 400);
  if (!VALID_TYPES[file.type]) return apiError(`File type ${file.type} is not supported.`, 400);
  if (file.size > MAX_SIZE) return apiError('File size exceeds 100MB limit.', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const category = VALID_TYPES[file.type];
  const filename = `community-media/${communityId}/${category}/${Date.now()}-${file.name}`;

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
  const bucket = adminStorage.bucket(bucketName);
  const fileRef = bucket.file(filename);

  await fileRef.save(buffer, {
    metadata: { contentType: file.type, metadata: { uploadedBy: ctx.ownerId, communityId } },
  });

  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${bucketName}/${filename}`;

  return apiSuccess({ url, filename, size: file.size, type: file.type, category }, 201);
}

export const POST_h = withApiAuth(POST, ['upload:write']);
export { POST_h as POST };
