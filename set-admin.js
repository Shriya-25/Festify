// Script to manually set admin role for a specific email
// Run this in Browser Console (F12) when on Festify app

// IMPORTANT: You must be logged in as the user whose email you want to set as admin

import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

async function setAdminRole() {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('No user is logged in. Please log in first.');
    return;
  }
  
  if (user.email !== 'shriya25.main@gmail.com') {
    console.error('This script is only for shriya25.main@gmail.com');
    return;
  }
  
  try {
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName || 'Admin',
      email: user.email,
      role: 'admin',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      authProvider: user.providerData[0]?.providerId || 'password'
    }, { merge: true });
    
    console.log('✅ Admin role set successfully! Please refresh the page.');
    window.location.reload();
  } catch (error) {
    console.error('Error setting admin role:', error);
  }
}

// Call the function
setAdminRole();
