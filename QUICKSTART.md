# 🚀 Festify - Quick Start Guide

## Get Started in 5 Minutes!

### Step 1: Install Dependencies (1 minute)
```bash
npm install
```

### Step 2: Setup Firebase (2 minutes)

1. Create Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication
3. Create Firestore database (test mode)
4. Copy your config to `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Need detailed Firebase instructions?** → See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### Step 3: Run the App (1 minute)
```bash
npm run dev
```

Visit: http://localhost:5173

### Step 4: Test It Out! (1 minute)

#### Create Student Account
1. Click "Sign Up"
2. Fill form, select "Student" role
3. Sign up

#### Create Organizer Account
1. Logout
2. Sign up again with different email
3. Select "Organizer" role
4. Create a fest from dashboard

#### Create Admin Account
1. Sign up with any role
2. Go to Firebase Console → Firestore
3. Find your user in `users` collection
4. Edit: Change `role` to `"admin"`
5. Refresh app
6. Approve fests from admin dashboard!

---

## 🎯 What You Can Do

### As a Student
- ✅ Browse all fests
- ✅ Search by name/college/location
- ✅ Filter by category
- ✅ View fest details
- ✅ Register for fests
- ✅ Track registrations in dashboard

### As an Organizer
- ✅ Create fest listings
- ✅ View approval status
- ✅ Manage your fests
- ✅ Delete fests

### As an Admin
- ✅ Review pending fests
- ✅ Approve quality content
- ✅ Reject spam/inappropriate fests

---

## 📦 What's Included

- ✅ Full authentication system
- ✅ Role-based access control
- ✅ Beautiful responsive UI
- ✅ Search & filter functionality
- ✅ Real-time data with Firestore
- ✅ Protected routes
- ✅ Dashboard for all roles

---

## 🎨 Customization

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#6366f1',  // Change this!
  secondary: '#8b5cf6', // And this!
}
```

### Add Categories
Edit category arrays in:
- `src/pages/Home.jsx`
- `src/pages/CreateFest.jsx`

---

## 📚 Documentation

- **Complete Guide**: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- **Firebase Setup**: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- **README**: [README.md](README.md)

---

## 🐛 Having Issues?

### Firebase Errors
- Double-check your config in `src/firebase/config.js`
- Ensure authentication is enabled
- Verify Firestore is created

### Can't See Fests
- Make sure fests are approved (check admin dashboard)
- Verify Firestore rules allow reading

### Registration Not Working
- Ensure you're logged in as a student
- Check browser console for errors

---

## 🎉 You're Ready!

Start building your fest discovery platform!

**Next Steps:**
- Customize the design
- Add more features
- Deploy to Firebase Hosting
- Share with your college!

---

**Need help?** Check [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for detailed information.
