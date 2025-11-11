import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

/**
 * Send a notification to all admin users
 */
export async function notifyAdmins(message: string, data: any) {
  try {
    // Get all admin users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    
    // Create notifications for each admin
    const notificationsRef = collection(db, 'notifications');
    const notifications: Promise<any>[] = [];
    
    // If no admin users found, create a general notification
    if (querySnapshot.empty) {
      notifications.push(
        addDoc(notificationsRef, {
          userId: 'system',  // Special userId for system notifications
          message,
          data,
          read: false,
          createdAt: serverTimestamp()
        })
      );
    } else {
      // Create notifications for each admin
      querySnapshot.forEach(doc => {
        const adminId = doc.id;
        notifications.push(
          addDoc(notificationsRef, {
            userId: adminId,
            message,
            data,
            read: false,
            createdAt: serverTimestamp()
          })
        );
      });
    }
    
    // Wait for all notifications to be created
    await Promise.all(notifications);
    return true;
  } catch (error) {
    console.error('Error sending admin notifications:', error);
    return false;
  }
}

/**
 * Create a notification for a specific access request
 */
export async function notifyAccessRequest(requestData: {
  firstName: string;
  lastName: string;
  email: string;
  requestId: string;
}) {
  const { firstName, lastName, email, requestId } = requestData;
  const message = `New access request from ${firstName} ${lastName} (${email})`;
  
  return notifyAdmins(message, {
    type: 'access_request',
    requestId,
    email
  });
}
