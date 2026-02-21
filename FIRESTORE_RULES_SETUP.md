# How to Update Firestore Security Rules

## Quick Fix for the Permission Error

Your Firestore database needs proper security rules to allow user registration and role selection.

### Steps to Update Rules:

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com/
   - Select your project: **festify-2dea3**

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Replace the Rules**
   - You'll see an editor with current rules
   - **Delete all existing rules**
   - Copy the entire content from `firestore.rules` file in your project
   - Paste it into the Firebase Console editor

4. **Publish the Rules**
   - Click the **"Publish"** button
   - Wait for the confirmation message

### What These Rules Allow:

✅ **Users Collection:**
- Authenticated users can create and update their own user document
- Users can read their own data
- Admins can read all users

✅ **Fests Collection:**
- Everyone can read published fests
- Organizers can create fests
- Organizers can update their own fests
- Admins can do everything

✅ **Registrations Collection:**
- Students can register for fests
- Users can read/update/delete their own registrations
- Organizers can view registrations for their fests
- Admins have full access

### After Updating Rules:

1. Go back to your Festify app
2. Refresh the page
3. Try selecting your role again (Student or Organizer)
4. Click "Continue" - it should work now! ✨

### Testing Rules (Optional):

In the Firebase Console, you can test the rules:
1. Click on "Rules" tab
2. Click "Rules Playground"
3. Test read/write operations

---

**Note:** If you see "Simulator is unavailable" in Rules Playground, don't worry - just publish the rules and test in your app directly.