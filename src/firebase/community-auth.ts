import { getAuth } from 'firebase/auth';
import { communityApp } from './config';

export const communityAuth = getAuth(communityApp);
