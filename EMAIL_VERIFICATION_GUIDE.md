# 📧 Email Verification Setup Guide for Festify

## ✅ What Has Been Added

Email verification is now **required** for all users who sign up with email/password. This ensures:
- Valid email addresses
- Better security
- Verified user accounts
- Reduced spam/fake accounts

## 🎯 How It Works

### **Sign-Up Flow (Email/Password)**

```
User signs up with email/password
    ↓
Account created in Firebase
    ↓
Verification email sent automatically ✉️
    ↓
User redirected to "Verify Email" page
    ↓
User checks email and clicks verification link
    ↓
User returns and clicks "I've Verified"
    ↓
Access granted! ✅
```

### **Sign-Up Flow (Google Sign-In)**

```
User signs in with Google
    ↓
Email automatically verified (by Google) ✅
    ↓
Select role (if new user)
    ↓
Access granted immediately!
```

## 🔥 Firebase Configuration (Optional)

Firebase automatically sends verification emails, but you can customize them:

### **Customize Email Template**

1. Go to **Firebase Console** → https://console.firebase.google.com/
2. Select your **Festify** project
3. Click **"Authentication"** in sidebar
4. Click **"Templates"** tab
5. Click **"Email address verification"**
6. Customize:
   - **From name**: Festify Team
   - **Reply-to email**: Your support email
   - **Subject**: Verify your email for Festify
   - **Body**: Customize the message
7. Click **"Save"**

### **Customize Action URL (Optional)**

For advanced users who want custom verification pages:
1. Go to Authentication → Settings
2. Under "Authorized domains"
3. Add your custom domain
4. Configure custom email action handler

## 🧪 Test Email Verification

### **Step 1: Start the App**

```powershell
npm run dev
```

Visit: http://localhost:5173

### **Step 2: Sign Up with Email**

1. Click **"Sign Up"**
2. Fill in the form:
   - Name: Test User
   - Email: **your-real-email@gmail.com** (use a real email!)
   - Password: test1234
   - Role: Student
3. Click **"Sign Up"**

### **Step 3: Verify Email Page**

You'll be automatically redirected to the **"Verify Your Email"** page:

```
┌─────────────────────────────────┐
│    📧 Verify Your Email        │
│                                 │
│  We've sent a verification     │
│  link to:                       │
│  your-email@gmail.com           │
│                                 │
│  📬 Check Your Email            │
│  • Open your email inbox        │
│  • Look for email from Firebase │
│  • Click verification link      │
│  • Return here                  │
│                                 │
│  [✓ I've Verified My Email]    │
│                                 │
│  Didn't receive email?          │
│  [📧 Resend Verification]      │
│                                 │
│  Logout and try different       │
│  account                        │
└─────────────────────────────────┘
```

### **Step 4: Check Your Email**

1. Open your email inbox (Gmail, Yahoo, etc.)
2. Look for email from **noreply@festify-[project-id].firebaseapp.com**
3. **Check spam/junk folder** if not in inbox
4. Email subject: **"Verify your email for Festify"**
5. Click the **verification link** in the email

### **Step 5: Confirm Verification**

1. After clicking the link, you'll see Firebase confirmation
2. Return to the app (still on Verify Email page)
3. Click **"✓ I've Verified My Email"** button
4. You'll be redirected to the home page! ✅

## ✨ Features

### **Verify Email Page** (`src/pages/VerifyEmail.jsx`)

Features:
- ✅ Shows user's email address
- ✅ Clear instructions
- ✅ "I've Verified" button to check status
- ✅ "Resend Email" button (with rate limiting)
- ✅ Logout option
- ✅ Helpful tips (check spam folder)
- ✅ Success/error messages
- ✅ Auto-redirect after verification

### **Protected Routes**

All protected routes now check email verification:
- `/dashboard` - Requires verified email
- `/create-fest` - Requires verified email + organizer role
- Other protected pages

### **Login Flow**

When logging in with email/password:
- If email **not verified** → Redirect to Verify Email page
- If email **verified** → Login normally ✅
- Google sign-in users → Always verified ✅

### **Smart Detection**

The app automatically:
- Detects if email is verified
- Redirects unverified users
- Allows Google users (pre-verified)
- Prevents access without verification

## 📋 What Happens Behind the Scenes

### **During Sign-Up**

1. User account created in Firebase Auth
2. `sendEmailVerification(user)` called automatically
3. Firebase sends email
4. User document created in Firestore with:
   ```javascript
   {
     emailVerified: false,
     authProvider: 'email'
   }
   ```

### **During Verification**

1. User clicks link in email
2. Firebase marks email as verified
3. User clicks "I've Verified" button
4. App calls `reload(user)` to get updated status
5. Firestore updated:
   ```javascript
   {
     emailVerified: true
   }
   ```
6. User gains full access

### **During Login**

1. User logs in with email/password
2. `login()` calls `reload(user)` to check status
3. If `emailVerified === false` → Redirect to /verify-email
4. If `emailVerified === true` → Allow access

## 🛡️ Security Benefits

1. **Prevents Fake Accounts** - Must have valid email
2. **Account Recovery** - Can reset password
3. **Notifications** - Can send important emails
4. **User Trust** - Verified users are real
5. **Spam Prevention** - Reduces bot accounts

## 🐛 Troubleshooting

### **Issue: Not receiving verification email**

**Solutions:**
1. **Check spam/junk folder** - Most common issue!
2. Click **"Resend Verification Email"** button
3. Wait a few minutes (sometimes delayed)
4. Check email address is correct
5. Try a different email provider

### **Issue: "Too many requests" error**

**Solution:**
- Firebase rate limits requests
- Wait 5-10 minutes
- Don't spam the resend button
- Each user gets limited resend attempts

### **Issue: Verification link expired**

**Solution:**
1. Click **"Resend Verification Email"**
2. Use the new link (old links expire after ~1 hour)

### **Issue: Already verified but still seeing verify page**

**Solutions:**
1. Click **"I've Verified My Email"** button
2. If still not working, logout and login again
3. Clear browser cache and cookies
4. Check Firebase Console → Authentication → Users
   - Find your user, verify email is marked as verified

### **Issue: Google users seeing verify page**

**Solution:**
- This shouldn't happen! Google users are auto-verified
- If it does, check `ProtectedRoute.jsx` logic
- Google providerId should be `'google.com'`, not `'password'`

## 📊 Testing Checklist

### **Email/Password Sign-Up**
- [ ] Sign up with email/password
- [ ] Redirected to verify email page
- [ ] Verification email received
- [ ] Email contains verification link
- [ ] Click link opens Firebase confirmation
- [ ] Click "I've Verified" button works
- [ ] Redirected to home page after verification
- [ ] Can access dashboard
- [ ] Can access protected routes

### **Resend Email**
- [ ] Click "Resend Verification Email"
- [ ] Second email received
- [ ] New link works
- [ ] Rate limiting works (try spamming button)

### **Login Before Verification**
- [ ] Sign up but don't verify
- [ ] Logout
- [ ] Try to login
- [ ] Redirected to verify email page
- [ ] Can't access protected routes

### **Login After Verification**
- [ ] Verify email
- [ ] Logout
- [ ] Login again
- [ ] Goes directly to home (no verify page)
- [ ] Can access all features

### **Google Sign-In**
- [ ] Sign in with Google
- [ ] No verification needed
- [ ] Immediately verified
- [ ] Full access granted
- [ ] No verify email page shown

### **Edge Cases**
- [ ] Spam folder contains email
- [ ] Email expires, use resend
- [ ] Multiple resend attempts
- [ ] Logout from verify page works
- [ ] Direct URL to /verify-email without login redirects

## 📧 Email Content Example

**Subject:** Verify your email for Festify

**Body:**
```
Hello,

Follow this link to verify your email address.

[Verify Email]

If you didn't ask to verify this address, you can ignore this email.

Thanks,
Your Festify Team
```

## 🎯 User Experience Flow

### **First-Time User (Email)**
1. Sign up → 2 seconds
2. See verify page → 5 seconds
3. Check email → 30 seconds
4. Click link → 5 seconds
5. Return to app → 5 seconds
6. Click verified button → 2 seconds
7. **Total:** ~1 minute

### **Returning User (Email)**
1. Login → 2 seconds
2. Access granted → Immediate
3. **Total:** 2 seconds

### **Google User**
1. Click Google sign-in → 2 seconds
2. Select account → 3 seconds
3. Choose role (if new) → 5 seconds
4. Access granted → Immediate
5. **Total:** ~10 seconds

## 🔧 Technical Implementation

### **Files Modified**

1. **`src/context/AuthContext.jsx`**
   - Added `sendEmailVerification` import
   - Added `reload` import
   - Updated `signup()` to send verification email
   - Updated `login()` to reload user status
   - Added `resendVerificationEmail()` function
   - Added `reloadUser()` function

2. **`src/pages/VerifyEmail.jsx`** (NEW)
   - Full verification page UI
   - Check verification button
   - Resend email button
   - Logout option
   - Instructions and tips

3. **`src/pages/Signup.jsx`**
   - Redirects to `/verify-email` after signup

4. **`src/pages/Login.jsx`**
   - Checks email verification status
   - Redirects to `/verify-email` if not verified

5. **`src/components/ProtectedRoute.jsx`**
   - Checks email verification
   - Redirects unverified email users
   - Allows Google users (pre-verified)

6. **`src/App.jsx`**
   - Added `/verify-email` route

### **Functions Added**

```javascript
// Send verification email
await sendEmailVerification(user);

// Reload user to check status
await reload(user);

// Check if verified
if (user.emailVerified) { /* ... */ }

// Resend verification
await resendVerificationEmail();

// Update verification status
await reloadUser();
```

## 🎉 Success!

You now have:
- ✅ **Required email verification** for email/password users
- ✅ **Automatic verification emails** from Firebase
- ✅ **Resend email functionality** with rate limiting
- ✅ **One-click verification check**
- ✅ **Protected routes** that require verification
- ✅ **Google users auto-verified** (no extra step)
- ✅ **Clear instructions** and user-friendly UI

## 🚀 Test It Now!

```powershell
npm run dev
```

1. Sign up with your **real email**
2. Check your inbox (and spam!)
3. Click the verification link
4. Return to app and verify
5. Enjoy full access! 🎉

---

**Pro Tip:** Use your actual email address for testing so you can receive the real verification email!
