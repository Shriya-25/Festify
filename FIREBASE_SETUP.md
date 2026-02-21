# Firebase Setup Guide for Festify

Follow these steps to set up Firebase for your Festify application:

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project" or "Create a project"
3. Enter project name: **Festify** (or any name you prefer)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click on the **Web icon (</>)** to add a web app
2. Register your app with a nickname: **Festify Web**
3. Don't select "Firebase Hosting" for now
4. Click "Register app"
5. **Copy the Firebase configuration** - you'll need this!

## Step 3: Enable Authentication

1. In the left sidebar, click on **Authentication**
2. Click "Get started"
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Enable the **first toggle** (Email/Password)
6. Click "Save"

## Step 4: Create Firestore Database

1. In the left sidebar, click on **Firestore Database**
2. Click "Create database"
3. Select **"Start in test mode"** (for development)
4. Choose your preferred Cloud Firestore location (e.g., us-central)
5. Click "Enable"

## Step 5: Configure Your App

1. Open `src/firebase/config.js` in your project
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 6: Set Up Firestore Security Rules (Production)

For production, update your Firestore rules:

1. Go to **Firestore Database** > **Rules** tab
2. Replace with these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Fests collection
    match /fests/{festId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null &&
        (resource.data.createdBy == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Registrations collection
    match /registrations/{registrationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click "Publish"

## Step 7: Create Admin User (Optional)

To test admin features:

1. Sign up for a new account in your app
2. Go to **Firestore Database**
3. Open the **users** collection
4. Find your user document
5. Click on it and edit the **role** field
6. Change it from `student` or `organizer` to `admin`
7. Save

Now you can access admin features!

## Step 8: Add Indexes (If Needed)

If you see errors about missing indexes when querying:

1. Firestore will show you a link in the error message
2. Click the link to automatically create the required index
3. Wait for the index to build (usually takes a few minutes)

## Common Issues

### "Firebase: Error (auth/popup-blocked)"
- Make sure popups are not blocked in your browser

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure you're signed in

### "No matching index found"
- Click the link in the error message to create the index
- Or create them manually in Firestore > Indexes

## Next Steps

Your Firebase setup is complete! Run your app:

```bash
npm install
npm run dev
```

Visit http://localhost:5173 and start using Festify!
