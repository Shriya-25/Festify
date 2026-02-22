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
  const signup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore without role (will be set after verification)
      const userData = {
        name,
        email,
        role: null, // Will be set after email verification in role selection
        emailVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'email'
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Keep user logged in so they can verify email
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
      
      // Check if email is verified for email/password authentication
      if (!user.emailVerified) {
        // Sign out immediately if email not verified
        await signOut(auth);
        throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
      }
      
      // Update Firestore emailVerified status if verified
      if (user.emailVerified) {
        await setDoc(doc(db, 'users', user.uid), {
          emailVerified: true
        }, { merge: true });
      }
      
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
      if (!currentUser) return null;
      await reload(currentUser);
      
      // Get the updated user object from auth
      const updatedUser = auth.currentUser;
      setCurrentUser(updatedUser);
      
      // Update Firestore emailVerified status
      if (updatedUser && updatedUser.emailVerified) {
        await setDoc(doc(db, 'users', updatedUser.uid), {
          emailVerified: true
        }, { merge: true });
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error reloading user:', error);
      return null;
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New Google user - create document with verified status
        // Google users are automatically verified
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
        // Existing user - check role
        const userData = userDoc.data();
        
        // Update Firestore if not marked as verified
        if (!userData.emailVerified) {
          await setDoc(doc(db, 'users', user.uid), {
            emailVerified: true
          }, { merge: true });
        }
        
        // Check role
        if (!userData.role) {
          setNeedsRoleSelection(true);
        } else {
          setUserRole(userData.role);
          setNeedsRoleSelection(false);
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
