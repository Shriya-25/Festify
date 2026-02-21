import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  // Sign up function
  const signup = async (email, password, name, role, phone = '', college = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      const userData = {
        name,
        email,
        role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'email'
      };

      // Add phone and college for students
      if (role === 'student' && phone && college) {
        userData.phone = phone;
        userData.college = college;
      }

      await setDoc(doc(db, 'users', user.uid), userData);
      
      setUserRole(role);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Reload user to get latest emailVerified status
      await reload(user);
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      await sendEmailVerification(currentUser);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Reload current user to check email verification status
  const reloadUser = async () => {
    try {
      if (!currentUser) return;
      await reload(currentUser);
      setCurrentUser({ ...currentUser });
      
      // Update Firestore emailVerified status
      if (currentUser.emailVerified) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          emailVerified: true
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error reloading user:', error);
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Wait a moment for Firestore to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // New user - create document with role as null
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            role: null, // Will be set after role selection
            emailVerified: true, // Google users are pre-verified
            createdAt: new Date().toISOString(),
            authProvider: 'google'
          });
          setNeedsRoleSelection(true);
        } else {
          // Existing user - fetch role
          const userData = userDoc.data();
          if (!userData.role) {
            setNeedsRoleSelection(true);
          } else {
            setUserRole(userData.role);
            setNeedsRoleSelection(false);
          }
        }
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // If Firestore fails, assume new user and create document
        // This handles offline/network issues
        try {
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            role: null,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            authProvider: 'google'
          }, { merge: true }); // Use merge to not overwrite if exists
          setNeedsRoleSelection(true);
        } catch (setDocError) {
          console.error('Failed to create user document:', setDocError);
          // Even if Firestore fails, show role selection
          setNeedsRoleSelection(true);
        }
      }
      
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Set user role (for Google sign-in users)
  const setUserRoleInDB = async (role) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: currentUser.displayName,
        email: currentUser.email,
        role,
        createdAt: new Date().toISOString(),
        authProvider: 'google'
      }, { merge: true });
      
      setUserRole(role);
      setNeedsRoleSelection(false);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUserRole(null);
    setNeedsRoleSelection(false);
    return signOut(auth);
  };

  // Fetch user role from Firestore
  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.role) {
          setNeedsRoleSelection(true);
        } else {
          setUserRole(userData.role);
        }
        return userData.role;
      } else {
        setNeedsRoleSelection(true);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserRole(user.uid);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    needsRoleSelection,
    signup,
    login,
    signInWithGoogle,
    setUserRoleInDB,
    resendVerificationEmail,
    reloadUser,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
