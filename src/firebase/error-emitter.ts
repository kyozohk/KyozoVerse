import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

// This is a simple event emitter that will be used to broadcast
// Firestore permission errors from where they are caught to a
// central listener.

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We need to declare the typed event emitter.
declare interface ErrorEventEmitter {
  on<U extends keyof ErrorEvents>(event: U, listener: ErrorEvents[U]): this;
  emit<U extends keyof ErrorEvents>(event: U, ...args: Parameters<ErrorEvents[U]>): boolean;
}

class ErrorEventEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEventEmitter();

    