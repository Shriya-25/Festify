# 🔐 Google Sign-In Setup Guide for Festify

## ✅ What Has Been Added

1. **Google Authentication** - Users can now sign in with their Google account
2. **Role Selection** - After Google sign-in, users choose if they're a Student or Organizer
3. **Enhanced Auth Flow** - Seamless experience for both email and Google authentication

---

## 🔥 Enable Google Sign-In in Firebase

### **Step 1: Go to Firebase Console**

1. Open https://console.firebase.google.com/
2. Select your **Festify** project
3. Click **"Authentication"** in the left sidebar

### **Step 2: Enable Google Sign-In Provider**

1. Click on the **"Sign-in method"** tab at the top
2. You should see **Email/Password** already enabled ✅
3. Find **"Google"** in the list of providers
4. Click on **"Google"**
5. Toggle **"Enable"** to ON
6. **Project support email**: Select your email from dropdown
7. Click **"Save"**

✅ **Google Sign-In is now enabled!**

---

## 🧪 Test the Application

### **Step 1: Start the Development Server**

```powershell
npm run dev
```

Visit: http://localhost:5173

### **Step 2: Test Google Sign-In Flow**

#### **Scenario 1: New User with Google Sign-In**

1. Click **"Sign Up"** or **"Login"** button
2. Click **"Sign up with Google"** or **"Sign in with Google"**
3. A Google popup will appear
4. Select your Google account
5. **Role Selection Screen** will appear 🎯
6. Choose your role:
   - **🎓 Student** - Discover and register for fests
   - **🏫 Organizer** - Create and promote fests
7. Click **"Continue"**
8. You'll be redirected to the home page, logged in! ✅

#### **Scenario 2: Existing Google User**

1. If you've already selected a role before
2. Click **"Sign in with Google"**
3. Select your account
4. You'll be logged in directly (no role selection needed) ✅

#### **Scenario 3: Email/Password Sign-Up (Still Works!)**

1. Click **"Sign Up"**
2. Fill in the form:
   - Name, Email, Password, Role
3. Click **"Sign Up"**
4. Works as before! ✅

---

## 🎨 What the UI Looks Like

### **Login/Signup Pages**
- Email/Password form (as before)
- **Divider**: "Or continue with"
- **Google Button**: White button with Google logo
- Smooth hover effects

### **Role Selection Screen**
- Beautiful gradient background
- Welcome message: "Welcome to Festify! 🎉"
- Two role cards:
  - **🎓 Student** - With description
  - **🏫 Organizer** - With description
- Continue button

---

## 🔍 How It Works

### **Authentication Flow**

```
User clicks "Sign in with Google"
    ↓
Google Popup appears
    ↓
User selects Google account
    ↓
Check: Does user exist in Firestore?
    ↓
NO → Show Role Selection → Save role → Continue
    ↓
YES → Check if has role?
    ↓
NO → Show Role Selection → Save role → Continue
    ↓
YES → Login directly → Home page
```

### **Data Stored in Firestore**

When user signs in with Google:

```javascript
{
  userId: "google-user-id",
  name: "John Doe",           // From Google
  email: "john@gmail.com",    // From Google
  role: "student",            // From role selection
  authProvider: "google",     // Identifies Google users
  createdAt: "2026-02-21T..."
}
```

---

## 🎯 Features Implemented

### **Login Page** (`src/pages/Login.jsx`)
- ✅ Email/Password login
- ✅ Google Sign-In button
- ✅ Loading states
- ✅ Error handling
- ✅ Redirect to role selection if needed

### **Signup Page** (`src/pages/Signup.jsx`)
- ✅ Email/Password signup with role
- ✅ Google Sign-Up button
- ✅ Loading states
- ✅ Error handling
- ✅ Redirect to role selection if needed

### **Auth Context** (`src/context/AuthContext.jsx`)
- ✅ `signInWithGoogle()` function
- ✅ `setUserRoleInDB()` function
- ✅ `needsRoleSelection` state
- ✅ Auto-detect if user needs role
- ✅ Works with existing auth

### **Role Selection** (`src/components/RoleSelection.jsx`)
- ✅ Beautiful UI with cards
- ✅ Radio button selection
- ✅ Role descriptions
- ✅ Validation
- ✅ Error handling
- ✅ Submit to Firestore

### **App Router** (`src/App.jsx`)
- ✅ Auto-redirect to role selection
- ✅ Works seamlessly with routes
- ✅ Protected route integration

---

## 🛡️ Security Notes

### **Current Setup (Development)**
- Google Sign-In is secure by default
- Firebase handles authentication
- Tokens are managed automatically

### **For Production**
- Update Firestore security rules
- Add authorized domains in Firebase
- Enable Firebase App Check

---

## 🐛 Troubleshooting

### **Issue: Google Popup Blocked**
**Solution:** 
- Allow popups in your browser
- Check browser settings
- Try incognito mode

### **Issue: "Unauthorized domain"**
**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Add `localhost` to authorized domains (should be there by default)
3. For production, add your domain

### **Issue: Role Selection Not Appearing**
**Solution:**
- Check browser console for errors
- Verify `needsRoleSelection` state in AuthContext
- Clear browser cache and cookies

### **Issue: Can't Sign In with Google**
**Solution:**
1. Verify Google provider is enabled in Firebase Console
2. Check you selected a support email
3. Make sure app is running on http://localhost:5173

---

## 📊 Testing Checklist

- [ ] Google Sign-In enabled in Firebase Console
- [ ] Dev server running (`npm run dev`)
- [ ] Can see "Sign in with Google" button
- [ ] Google popup appears when clicked
- [ ] Can select Google account
- [ ] Role selection screen appears for new users
- [ ] Can select Student or Organizer role
- [ ] After role selection, redirects to home
- [ ] User appears in Firebase Authentication → Users
- [ ] User document in Firestore has correct role
- [ ] Subsequent logins don't ask for role again
- [ ] Email/Password sign-up still works

---

## 🎉 Success!

You now have:
- ✅ **Dual Authentication** - Email and Google
- ✅ **Smart Role Selection** - Only when needed
- ✅ **Seamless UX** - Smooth flow for all users
- ✅ **Flexible System** - Easy to add more providers

---

## 🚀 What's Next?

### **Optional Enhancements**
1. **Add Facebook Sign-In** - Similar to Google
2. **Add GitHub Sign-In** - For technical users
3. **Email Verification** - Verify email addresses
4. **Password Reset** - Forgot password flow
5. **Profile Pictures** - Use Google profile pic
6. **Remember Device** - Persistent sessions

### **Quick Test Commands**

```powershell
# Start the app
npm run dev

# Check if running
# Visit http://localhost:5173

# Check Firebase Console
# Go to Authentication → Users
# Should see Google users after testing
```

---

## 📸 Visual Guide

### **Before (Email Only)**
- Login form
- Signup form

### **After (Email + Google)**
- Login form
- "Or continue with" divider
- Google button with logo
- Role selection for Google users

---

## 💡 Tips

1. **Test with Different Accounts**
   - Try multiple Google accounts
   - Mix email and Google sign-ins
   - Verify role persistence

2. **Check Firestore Data**
   - Open Firebase Console → Firestore
   - See users collection
   - Verify `authProvider: "google"` field

3. **User Experience**
   - Google sign-in is faster (no password typing)
   - Role selection is intuitive
   - Works on mobile browsers too

---

**Google Sign-In is Ready! 🎉**

Test it now by running `npm run dev` and clicking "Sign in with Google"!
