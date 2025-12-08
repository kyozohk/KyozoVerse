import type { User } from 'firebase/auth';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write'; // 'write' can be a fallback
  requestResourceData?: any;
};

// A custom error class to provide more context about Firestore permission errors.
// This is crucial for debugging security rules in a developer-friendly way.
export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  public auth: User | null = null;
  public request: {
    auth: User | null;
    method: SecurityRuleContext['operation'];
    path: string;
    resource?: { data: any };
  };

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This structure is designed to mimic the object you see in the Firebase Console
    // when a rule is denied, making it familiar and easy to debug.
    this.request = {
      auth: null,
      method: context.operation,
      path: `/databases/(default)/documents/${context.path}`,
    };

    if (context.requestResourceData) {
      this.request.resource = {
        data: context.requestResourceData,
      };
    }

    // Capture the stack trace
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  // Allow enriching the error with auth state after it's created.
  enrichWithAuth(user: User | null) {
    this.auth = user;
    if (this.request) {
      this.request.auth = user;
    }
  }

  // Override toJSON to control the output in the Next.js error overlay.
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      request: this.request,
      stack: this.stack,
    };
  }
}
