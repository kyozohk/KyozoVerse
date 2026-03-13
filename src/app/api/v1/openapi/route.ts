import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'KyozoVerse API',
    version: '1.0.0',
    description:
      'The KyozoVerse REST API lets you manage communities, posts, members, broadcast emails, and generate AI content programmatically.\n\n' +
      '## Authentication\n' +
      'All endpoints (except `POST /auth/login`) require an API key sent as:\n' +
      '- `Authorization: Bearer <key>` header, **or**\n' +
      '- `x-api-key: <key>` header\n\n' +
      '## Getting an API Key\n' +
      '1. Obtain a Firebase ID token from the client SDK.\n' +
      '2. Call `POST /api/v1/auth/login` with `{ "idToken": "<token>" }`.\n' +
      '3. Store the returned `apiKey` securely — it is shown only once.',
    contact: { name: 'KyozoVerse', url: 'https://kyozo.com' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: process.env.NEXT_PUBLIC_SITE_URL || 'https://app.kyozo.com', description: 'Production' },
    { url: 'http://localhost:9003', description: 'Local Development' },
  ],
  tags: [
    { name: 'Auth', description: 'Exchange a Firebase ID token for an API key' },
    { name: 'API Keys', description: 'Manage your API keys' },
    { name: 'Communities', description: 'Create and manage communities' },
    { name: 'Posts', description: 'Create and manage posts within communities' },
    { name: 'Members', description: 'Manage community membership' },
    { name: 'Broadcast', description: 'Send broadcast emails to community members' },
    { name: 'Analytics', description: 'Community statistics and insights' },
    { name: 'AI', description: 'AI-powered content generation via Google Gemini' },
    { name: 'Upload', description: 'Upload media files to Firebase Storage' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', description: 'API key as Bearer token' },
      ApiKeyHeader: { type: 'apiKey', in: 'header', name: 'x-api-key', description: 'API key in header' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Invalid or revoked API key.' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },
      Community: {
        type: 'object',
        properties: {
          communityId: { type: 'string', example: 'abc123' },
          name: { type: 'string', example: 'Design Thinkers' },
          handle: { type: 'string', example: 'design-thinkers' },
          tagline: { type: 'string' },
          description: { type: 'string' },
          isPrivate: { type: 'boolean' },
          ownerId: { type: 'string' },
          memberCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['text', 'image', 'audio', 'video', 'poll'] },
          content: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              mediaUrls: { type: 'array', items: { type: 'string' } },
              thumbnailUrl: { type: 'string', nullable: true },
              fileType: { type: 'string', nullable: true },
            },
          },
          authorId: { type: 'string' },
          communityId: { type: 'string' },
          communityHandle: { type: 'string' },
          likes: { type: 'integer' },
          comments: { type: 'integer' },
          visibility: { type: 'string', enum: ['public', 'members'] },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Member: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          communityId: { type: 'string' },
          role: { type: 'string', enum: ['owner', 'admin', 'member'] },
          status: { type: 'string', enum: ['active', 'banned'] },
          joinedAt: { type: 'string', format: 'date-time', nullable: true },
          userDetails: {
            type: 'object',
            properties: {
              displayName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
            },
          },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          keyPrefix: { type: 'string', example: 'kz_a1b2c3' },
          scopes: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'communities:read', 'communities:write',
                'posts:read', 'posts:write',
                'members:read', 'members:write',
                'broadcast:send', 'ai:generate', 'upload:write', 'analytics:read',
              ],
            },
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }, { ApiKeyHeader: [] }],
  paths: {
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange Firebase ID token for an API key',
        description: 'No API key required. Pass a Firebase ID token to receive an API key.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: {
                  idToken: { type: 'string', description: 'Firebase Auth ID token' },
                  label: { type: 'string', description: 'Friendly label for the key', example: 'My App Key' },
                  scopes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Scopes to grant. Defaults to all scopes.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'API key created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        apiKey: { type: 'string', example: 'kz_a1b2c3...' },
                        keyId: { type: 'string' },
                        label: { type: 'string' },
                        scopes: { type: 'array', items: { type: 'string' } },
                        ownerId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid or expired ID token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/keys': {
      get: {
        tags: ['API Keys'],
        summary: 'List your API keys',
        responses: {
          '200': {
            description: 'List of API keys',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object', properties: { keys: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } } } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['API Keys'],
        summary: 'Create a new API key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['label'],
                properties: {
                  label: { type: 'string', example: 'Production Key' },
                  scopes: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'API key created (secret shown once)' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/keys/{keyId}': {
      delete: {
        tags: ['API Keys'],
        summary: 'Revoke an API key',
        parameters: [{ name: 'keyId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Key revoked' },
          '404': { description: 'Key not found' },
        },
      },
    },
    '/api/v1/communities': {
      get: {
        tags: ['Communities'],
        summary: 'List communities owned by the API key owner',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of communities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        communities: { type: 'array', items: { $ref: '#/components/schemas/Community' } },
                        pagination: { $ref: '#/components/schemas/Pagination' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Communities'],
        summary: 'Create a new community',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'handle'],
                properties: {
                  name: { type: 'string', example: 'Design Thinkers' },
                  handle: { type: 'string', example: 'design-thinkers' },
                  tagline: { type: 'string' },
                  description: { type: 'string' },
                  isPrivate: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Community created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Community' } } } } } },
          '409': { description: 'Handle already taken' },
        },
      },
    },
    '/api/v1/communities/{id}': {
      get: {
        tags: ['Communities'],
        summary: 'Get a community by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Community data', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Community' } } } } } },
          '404': { description: 'Community not found' },
        },
      },
      put: {
        tags: ['Communities'],
        summary: 'Update a community',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  tagline: { type: 'string' },
                  description: { type: 'string' },
                  isPrivate: { type: 'boolean' },
                  mantras: { type: 'array', items: { type: 'string' } },
                  lore: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated community' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Communities'],
        summary: 'Delete a community',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/communities/{id}/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List posts in a community',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['text', 'image', 'audio', 'video', 'poll'] } },
        ],
        responses: {
          '200': {
            description: 'Paginated posts',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } } },
          },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Create a post in a community',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'type'],
                properties: {
                  title: { type: 'string', example: 'Welcome to the community!' },
                  type: { type: 'string', enum: ['text', 'image', 'audio', 'video', 'poll'] },
                  text: { type: 'string' },
                  mediaUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
                  thumbnailUrl: { type: 'string', format: 'uri' },
                  fileType: { type: 'string' },
                  visibility: { type: 'string', enum: ['public', 'members'], default: 'public' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Post created' }, '400': { description: 'Validation error' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get a post by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Post data', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Post' } } } } } }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Posts'],
        summary: 'Update a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { title: { type: 'string' }, visibility: { type: 'string', enum: ['public', 'members'] }, text: { type: 'string' }, thumbnailUrl: { type: 'string' } } },
            },
          },
        },
        responses: { '200': { description: 'Updated' }, '403': { description: 'Forbidden' } },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/communities/{id}/members': {
      get: {
        tags: ['Members'],
        summary: 'List members of a community',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Filter by name or email' },
        ],
        responses: { '200': { description: 'Paginated members list', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { members: { type: 'array', items: { $ref: '#/components/schemas/Member' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } } } } },
      },
      post: {
        tags: ['Members'],
        summary: 'Add a member to a community',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string' },
                  displayName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Member added' }, '409': { description: 'Already a member' } },
      },
      delete: {
        tags: ['Members'],
        summary: 'Remove a member from a community',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Member removed' }, '404': { description: 'Member not found' } },
      },
    },
    '/api/v1/communities/{id}/broadcast': {
      post: {
        tags: ['Broadcast'],
        summary: 'Send a broadcast email to all active members',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subject', 'html'],
                properties: {
                  subject: { type: 'string', example: 'Big announcement!' },
                  html: { type: 'string', description: 'HTML email body' },
                  from: { type: 'string', description: 'Sender name <email>', example: 'My Community <hello@example.com>' },
                  replyTo: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Email sent', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { sent: { type: 'boolean' }, recipientCount: { type: 'integer' }, subject: { type: 'string' } } } } } } } },
          '400': { description: 'No members with email addresses' },
          '502': { description: 'Email send failed' },
        },
      },
    },
    '/api/v1/communities/{id}/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get community analytics',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        communityId: { type: 'string' },
                        communityName: { type: 'string' },
                        overview: {
                          type: 'object',
                          properties: {
                            totalPosts: { type: 'integer' },
                            totalMembers: { type: 'integer' },
                            totalLikes: { type: 'integer' },
                            totalComments: { type: 'integer' },
                          },
                        },
                        postsByType: { type: 'object', additionalProperties: { type: 'integer' } },
                        topPosts: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, type: { type: 'string' }, likes: { type: 'integer' }, comments: { type: 'integer' } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/ai/generate': {
      post: {
        tags: ['AI'],
        summary: 'Generate AI content using Google Gemini',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string', example: 'Write a welcome message for a design community' },
                  type: { type: 'string', enum: ['short', 'long'], default: 'long', description: '"short" for subject lines / labels, "long" for body content' },
                  currentValue: { type: 'string', description: 'Existing draft to improve (optional)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Generated text',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { text: { type: 'string' }, type: { type: 'string' }, prompt: { type: 'string' } } } } } } },
          },
          '503': { description: 'AI service not configured' },
        },
      },
    },
    '/api/v1/upload': {
      post: {
        tags: ['Upload'],
        summary: 'Upload a file to Firebase Storage',
        description: 'Send a `multipart/form-data` request with a `file` field. Returns a public download URL.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  folder: { type: 'string', description: 'Storage folder prefix', example: 'uploads/images' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Upload successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        url: { type: 'string', format: 'uri', description: 'Public download URL' },
                        path: { type: 'string', description: 'Storage path' },
                        contentType: { type: 'string' },
                        size: { type: 'integer', description: 'File size in bytes' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid file type or size limit exceeded' },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
