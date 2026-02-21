# Student Registration Details - Fix Guide

## Issue
Organizers were not seeing student details (name, email, phone, college) in their registration table because this information wasn't being stored when students registered for fests.

## ✅ What Has Been Fixed

### 1. Registration Now Includes Student Details
When a student registers for a fest, the system now saves:
- ✅ Student Name
- ✅ Student Email
- ✅ Student Phone Number
- ✅ Student College
- ✅ Registration Timestamp

### 2. New Profile Page Created
Students can now update their profile information at `/profile`:
- View and edit name
- Add/update phone number
- Add/update college name
- Email is displayed but cannot be changed (locked to account)

### 3. Navigation Updated
- "Profile" link added to navbar for all logged-in users
- Student dashboard shows a reminder to complete profile before registering

## 🔧 For Students: How to Update Your Profile

1. **Login** to Festify
2. Click **"Profile"** in the navigation bar
3. Fill in your **Phone Number** and **College Name**
4. Click **"Save Changes"**
5. Now when you register for fests, organizers will see your details!

## 🔄 For Existing Registrations (Without Details)

If you already registered before this fix, you have 2 options:

### Option A: Re-register (Recommended)
1. Go to the fest details page
2. If there's an unregister option, click it
3. Update your profile (phone + college)
4. Register again - organizers will now see your details

### Option B: Manual Update in Firebase Console
For admins/organizers to fix existing registrations:

1. Open Firebase Console: https://console.firebase.google.com/project/festify-2dea3/firestore
2. Go to **Firestore Database** → **registrations** collection
3. Find the registration document (by date/festId)
4. Click the document
5. Add these fields manually:
   - `studentName`: [Student's Full Name]
   - `studentEmail`: [Student's Email]
   - `studentPhone`: [Student's Phone]
   - `studentCollege`: [Student's College]
6. Click **Update**

## 📝 Technical Details

### Registration Document Structure (New)
```javascript
{
  festId: "fest_id_here",
  userId: "user_id_here",
  festName: "Fest Name",
  collegeName: "College hosting the fest",
  studentName: "Student Full Name",      // NEW
  studentEmail: "student@email.com",     // NEW
  studentPhone: "1234567890",            // NEW
  studentCollege: "Student's College",   // NEW
  registeredAt: "2026-02-21T11:42:00Z"
}
```

### Code Changes
- **FestDetails.jsx**: Updated `handleRegister()` to fetch and include user profile data
- **Profile.jsx**: New page for students to manage their profile
- **Dashboard.jsx**: Added profile completion reminder for students
- **App.jsx**: Added `/profile` route
- **Navbar.jsx**: Added "Profile" link

## ⚠️ Important Notes

1. **New registrations only**: This fix applies to NEW registrations made after the update
2. **Old registrations**: Will still show empty fields unless manually updated
3. **Profile completion**: Students MUST complete their profile before registering to ensure organizers can contact them
4. **Required fields**: Phone and College are required in the profile form

## 🎯 Testing the Fix

As a **Student**:
1. Complete your profile with phone and college
2. Register for a fest
3. Check your dashboard to see registration

As an **Organizer**:
1. Log into organizer account
2. Go to Dashboard
3. Scroll to "Student Registrations"
4. Verify new registrations show all student details

---

**Note**: The existing registration shown with timestamp "21 Feb 2026, 11:42 pm" will need to be re-done or manually updated in Firebase Console to show student details.
