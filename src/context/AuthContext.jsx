import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
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

  // Sign up function
  const signup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with displayName
      await updateProfile(user, {
        displayName: name
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user document in Firestore with default student role
      const userData = {
        name,
        email,
        role: 'student',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'email'
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      console.log('User created with name:', name);
      console.log('Firebase Auth displayName:', user.displayName);
      
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
      await setDoc(doc(db, 'users', user.uid), { emailVerified: true }, { merge: true });

      // Fetch role and set in state so redirect can happen immediately
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.exists() ? (userDoc.data().role || 'student') : 'student';
      setUserRole(role);
      
      return { user, role };
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
        // New Google user - create document with verified status, default student role
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          role: 'student',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          authProvider: 'google'
        });
        setUserRole('student');
      } else {
        // Existing user - load their role
        const userData = userDoc.data();
        
        // Update Firestore if not marked as verified
        if (!userData.emailVerified) {
          await setDoc(doc(db, 'users', user.uid), {
            emailVerified: true
          }, { merge: true });
        }
        
        // If existing user has no role (old account), default to student
        if (!userData.role) {
          await setDoc(doc(db, 'users', user.uid), { role: 'student' }, { merge: true });
          setUserRole('student');
        } else {
          setUserRole(userData.role);
        }
      }

      // Read back the role we just set
      const finalRole = (await getDoc(doc(db, 'users', user.uid))).data()?.role || 'student';
      return { user, role: finalRole };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUserRole(null);
    return signOut(auth);
  };

  // Fetch user role from Firestore
  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'student';
        setUserRole(role);
        return role;
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
    signup,
    login,
    signInWithGoogle,
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
