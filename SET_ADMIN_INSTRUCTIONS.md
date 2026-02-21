# Set Admin Role for shriya25.main@gmail.com

## Method 1: Using Firebase Console (Recommended - Easiest)

1. **Open Firebase Console**: https://console.firebase.google.com/project/festify-2dea3/firestore

2. **Navigate to Firestore Database**
   - Click "Firestore Database" in left sidebar
   - Click on "Data" tab

3. **Find or Create User Document**
   - Look for the `users` collection
   - Find the document with email `shriya25.main@gmail.com`
   - If it doesn't exist, first log in with that email on the Festify app, then come back

4. **Set Admin Role**
   - Click on the user document
   - Find the `role` field
   - Change its value to: `admin`
   - If the field doesn't exist, click "Add field":
     - Field: `role`
     - Type: `string`
     - Value: `admin`
   - Click "Update" or "Save"

5. **Refresh Festify App**
   - Go back to Festify in your browser
   - Press F5 or Ctrl+R to refresh
   - You should now see "🔐 Admin Panel" link in the navigation bar

---

## Method 2: Using Browser Console (Alternative)

1. **Log in to Festify** with `shriya25.main@gmail.com`

2. **Open Browser Console**
   - Press F12 or right-click → Inspect
   - Go to "Console" tab

3. **Run this command**:
   ```javascript
   // Get Firebase instances
   const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
   const auth = firebase.auth();
   const db = firebase.firestore();
   const user = auth.currentUser;
   
   // Set admin role
   await setDoc(doc(db, 'users', user.uid), {
     role: 'admin'
   }, { merge: true });
   
   console.log('✅ Admin role set! Refreshing page...');
   setTimeout(() => location.reload(), 1000);
   ```

---

## Method 3: Using Firebase CLI

Run this command in your Festify project directory:

```bash
# First, get the user ID (UID) from Firebase Console → Authentication
# Replace USER_UID_HERE with the actual UID

firebase firestore:write users/USER_UID_HERE --data '{"role":"admin"}' --merge
```

---

## Verify Admin Access

After setting the admin role:

1. Refresh Festify app
2. You should see "🔐 Admin Panel" link in navbar
3. Click it to access:
   - **Manage Fests**: Approve, reject, or delete any fest
   - **Manage Users**: View all users and change their roles

---

## Admin Panel Features

### Fests Management
- ✅ View all fests (pending, published, rejected)
- ✅ Approve pending fests
- ✅ Reject fests
- ✅ Unpublish published fests
- ✅ Delete any fest permanently

### Users Management
- ✅ View all registered users
- ✅ See user roles (student, organizer, admin)
- ✅ Change user roles via dropdown
- ✅ View authentication provider (Google, email/password)

---

**Note**: Only users with `role: 'admin'` in Firestore can access the Admin Panel.
