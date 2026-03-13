export type ParamDef = {
  name: string;
  in: 'path' | 'query' | 'body';
  type: 'string' | 'number' | 'boolean' | 'json' | 'file';
  required: boolean;
  description: string;
  example?: string;
};

export type EndpointDef = {
  id: string;
  group: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  scopes: string[];
  params: ParamDef[];
};

export const API_BASE = '/api/v1';

export const ENDPOINT_GROUPS: EndpointDef[] = [
  // ── Auth ──────────────────────────────────────────────
  {
    id: 'auth-login',
    group: 'Auth',
    method: 'POST',
    path: '/auth/login',
    description: 'Exchange a Firebase ID token for a Kyozo API key. Sign in first using the panel above.',
    scopes: [],
    params: [
      { name: 'idToken', in: 'body', type: 'string', required: true, description: 'Firebase ID token (auto-filled after login)', example: '' },
      { name: 'label', in: 'body', type: 'string', required: false, description: 'Human-readable name for the key', example: 'My Integration Key' },
      { name: 'scopes', in: 'body', type: 'json', required: false, description: 'Array of scopes (omit for all scopes)', example: '["communities:read","posts:read"]' },
    ],
  },

  // ── API Keys ──────────────────────────────────────────
  {
    id: 'keys-list',
    group: 'API Keys',
    method: 'GET',
    path: '/keys',
    description: 'List all your API keys.',
    scopes: [],
    params: [],
  },
  {
    id: 'keys-create',
    group: 'API Keys',
    method: 'POST',
    path: '/keys',
    description: 'Create a new API key.',
    scopes: [],
    params: [
      { name: 'label', in: 'body', type: 'string', required: true, description: 'Label for the key', example: 'Production Key' },
      { name: 'scopes', in: 'body', type: 'json', required: false, description: 'Array of scopes', example: '["communities:read","posts:read"]' },
    ],
  },
  {
    id: 'keys-revoke',
    group: 'API Keys',
    method: 'DELETE',
    path: '/keys/:keyId',
    description: 'Revoke an API key.',
    scopes: [],
    params: [
      { name: 'keyId', in: 'path', type: 'string', required: true, description: 'Key document ID', example: 'abc123' },
    ],
  },

  // ── Communities ───────────────────────────────────────
  {
    id: 'communities-list',
    group: 'Communities',
    method: 'GET',
    path: '/communities',
    description: 'List all communities you own.',
    scopes: ['communities:read'],
    params: [
      { name: 'page', in: 'query', type: 'number', required: false, description: 'Page number', example: '1' },
      { name: 'limit', in: 'query', type: 'number', required: false, description: 'Results per page (max 100)', example: '20' },
    ],
  },
  {
    id: 'communities-create',
    group: 'Communities',
    method: 'POST',
    path: '/communities',
    description: 'Create a new community.',
    scopes: ['communities:write'],
    params: [
      { name: 'name', in: 'body', type: 'string', required: true, description: 'Community name', example: 'My Community' },
      { name: 'handle', in: 'body', type: 'string', required: true, description: 'URL handle (lowercase, hyphens only)', example: 'my-community' },
      { name: 'tagline', in: 'body', type: 'string', required: false, description: 'Short tagline', example: 'A place for creators' },
      { name: 'description', in: 'body', type: 'string', required: false, description: 'Full description', example: 'We build things together.' },
      { name: 'isPrivate', in: 'body', type: 'boolean', required: false, description: 'Private community?', example: 'false' },
    ],
  },
  {
    id: 'communities-get',
    group: 'Communities',
    method: 'GET',
    path: '/communities/:id',
    description: 'Get a specific community by ID.',
    scopes: ['communities:read'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community document ID', example: '' },
    ],
  },
  {
    id: 'communities-update',
    group: 'Communities',
    method: 'PUT',
    path: '/communities/:id',
    description: 'Update a community.',
    scopes: ['communities:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community document ID', example: '' },
      { name: 'name', in: 'body', type: 'string', required: false, description: 'New name', example: '' },
      { name: 'tagline', in: 'body', type: 'string', required: false, description: 'New tagline', example: '' },
      { name: 'description', in: 'body', type: 'string', required: false, description: 'New description', example: '' },
    ],
  },
  {
    id: 'communities-delete',
    group: 'Communities',
    method: 'DELETE',
    path: '/communities/:id',
    description: 'Delete a community.',
    scopes: ['communities:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community document ID', example: '' },
    ],
  },

  // ── Posts ─────────────────────────────────────────────
  {
    id: 'posts-list',
    group: 'Posts',
    method: 'GET',
    path: '/communities/:id/posts',
    description: 'List posts in a community.',
    scopes: ['posts:read'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
      { name: 'page', in: 'query', type: 'number', required: false, description: 'Page number', example: '1' },
      { name: 'limit', in: 'query', type: 'number', required: false, description: 'Results per page', example: '20' },
      { name: 'type', in: 'query', type: 'string', required: false, description: 'Filter by type: text|image|audio|video', example: '' },
    ],
  },
  {
    id: 'posts-create',
    group: 'Posts',
    method: 'POST',
    path: '/communities/:id/posts',
    description: 'Create a post in a community.',
    scopes: ['posts:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
      { name: 'title', in: 'body', type: 'string', required: true, description: 'Post title', example: 'Hello World' },
      { name: 'type', in: 'body', type: 'string', required: true, description: 'text | image | audio | video | poll', example: 'text' },
      { name: 'text', in: 'body', type: 'string', required: false, description: 'Post body text', example: 'This is the content.' },
      { name: 'mediaUrls', in: 'body', type: 'json', required: false, description: 'Array of media URLs', example: '[]' },
      { name: 'visibility', in: 'body', type: 'string', required: false, description: 'public | private | members-only', example: 'public' },
    ],
  },
  {
    id: 'posts-get',
    group: 'Posts',
    method: 'GET',
    path: '/posts/:id',
    description: 'Get a single post.',
    scopes: ['posts:read'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Post ID', example: '' },
    ],
  },
  {
    id: 'posts-update',
    group: 'Posts',
    method: 'PUT',
    path: '/posts/:id',
    description: 'Update a post.',
    scopes: ['posts:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Post ID', example: '' },
      { name: 'title', in: 'body', type: 'string', required: false, description: 'New title', example: '' },
      { name: 'text', in: 'body', type: 'string', required: false, description: 'New body text', example: '' },
      { name: 'visibility', in: 'body', type: 'string', required: false, description: 'public | private | members-only', example: '' },
    ],
  },
  {
    id: 'posts-delete',
    group: 'Posts',
    method: 'DELETE',
    path: '/posts/:id',
    description: 'Delete a post.',
    scopes: ['posts:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Post ID', example: '' },
    ],
  },

  // ── Members ───────────────────────────────────────────
  {
    id: 'members-list',
    group: 'Members',
    method: 'GET',
    path: '/communities/:id/members',
    description: 'List members of a community.',
    scopes: ['members:read'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
      { name: 'search', in: 'query', type: 'string', required: false, description: 'Search by name or email', example: '' },
      { name: 'page', in: 'query', type: 'number', required: false, description: 'Page number', example: '1' },
    ],
  },
  {
    id: 'members-add',
    group: 'Members',
    method: 'POST',
    path: '/communities/:id/members',
    description: 'Add a member to a community.',
    scopes: ['members:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
      { name: 'userId', in: 'body', type: 'string', required: true, description: 'Firebase UID of user', example: '' },
      { name: 'displayName', in: 'body', type: 'string', required: false, description: 'Display name', example: '' },
      { name: 'email', in: 'body', type: 'string', required: false, description: 'Email address', example: '' },
      { name: 'role', in: 'body', type: 'string', required: false, description: 'member | admin', example: 'member' },
    ],
  },
  {
    id: 'members-remove',
    group: 'Members',
    method: 'DELETE',
    path: '/communities/:id/members',
    description: 'Remove a member from a community.',
    scopes: ['members:write'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
      { name: 'userId', in: 'body', type: 'string', required: true, description: 'Firebase UID of user to remove', example: '' },
    ],
  },

  // ── Broadcast ─────────────────────────────────────────
  {
    id: 'broadcast-send',
    group: 'Broadcast',
    method: 'POST',
    path: '/communities/:id/broadcast',
    description: 'Send a broadcast email to all active community members.',
    scopes: ['broadcast:send'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
      { name: 'subject', in: 'body', type: 'string', required: true, description: 'Email subject line', example: 'Monthly Update' },
      { name: 'html', in: 'body', type: 'string', required: true, description: 'HTML email body', example: '<h1>Hello!</h1><p>Here is your update.</p>' },
      { name: 'from', in: 'body', type: 'string', required: false, description: 'Sender name & email', example: 'MyApp <hello@myapp.com>' },
    ],
  },

  // ── Analytics ─────────────────────────────────────────
  {
    id: 'analytics-get',
    group: 'Analytics',
    method: 'GET',
    path: '/communities/:id/analytics',
    description: 'Get analytics for a community.',
    scopes: ['analytics:read'],
    params: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Community ID', example: '' },
    ],
  },

  // ── AI ────────────────────────────────────────────────
  {
    id: 'ai-generate',
    group: 'AI',
    method: 'POST',
    path: '/ai/generate',
    description: 'Generate content using Gemini AI.',
    scopes: ['ai:generate'],
    params: [
      { name: 'prompt', in: 'body', type: 'string', required: true, description: 'What to generate', example: 'Write a welcome message for a photography community' },
      { name: 'type', in: 'body', type: 'string', required: false, description: '"short" for subject lines, "long" for full content', example: 'long' },
      { name: 'currentValue', in: 'body', type: 'string', required: false, description: 'Existing draft to improve', example: '' },
    ],
  },

  // ── Upload ────────────────────────────────────────────
  {
    id: 'upload-file',
    group: 'Upload',
    method: 'POST',
    path: '/upload',
    description: 'Upload a file to Firebase Storage. Send as multipart/form-data.',
    scopes: ['upload:write'],
    params: [
      { name: 'file', in: 'body', type: 'file', required: true, description: 'The file to upload (image/audio/video)', example: '' },
      { name: 'communityId', in: 'body', type: 'string', required: true, description: 'Community this file belongs to', example: '' },
    ],
  },
];

export const ALL_SCOPES_LIST = [
  'communities:read', 'communities:write',
  'posts:read', 'posts:write',
  'members:read', 'members:write',
  'broadcast:send', 'ai:generate',
  'upload:write', 'analytics:read',
];

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
};
