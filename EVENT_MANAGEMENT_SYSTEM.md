# Event Management System Documentation

## Overview
The Festify platform now supports a comprehensive event management system where organizers can create fests, add multiple events under each fest, and manage registrations at the event level. Students browse fests, view events grouped by domains, and register for individual events.

## Architecture Changes

### Data Model
```
Fests Collection (existing)
└── Events Collection (NEW)
    └── Event Registrations Collection (NEW)
```

**Collections:**
- `fests` - Contains fest information (banner, date, venue, description, etc.)
- `events` - Contains event information linked to fests via `festId`
- `eventRegistrations` - Contains student registrations for individual events

---

## Event Data Structure

### Events Collection Schema
```javascript
{
  id: auto-generated,
  festId: string,              // Reference to parent fest
  festName: string,
  createdBy: string,           // Organizer UID
  eventName: string,
  domain: string,              // Technical, Cultural, Sports, etc.
  description: string,
  date: string,                // Event date (YYYY-MM-DD)
  time: string,                // Event time (HH:MM)
  venue: string,
  registrationDeadline: string, // ISO datetime string
  maxParticipants: number,     // Optional participant limit
  participantCount: number,    // Current registration count
  prefillUserData: boolean,    // Whether to prefill user profile data
  registrationForm: array,     // Custom form fields
  createdAt: timestamp
}
```

### Event Registrations Collection Schema
```javascript
{
  id: auto-generated,
  eventId: string,
  festId: string,
  userId: string,
  eventName: string,
  festName: string,
  name: string,               // If prefillUserData enabled
  email: string,
  phone: string,
  college: string,
  branch: string,
  year: string,
  gender: string,
  customFields: object,       // Responses to custom form fields
  registeredAt: string        // ISO datetime
}
```

---

## User Flows

### Organizer Workflow

#### 1. Create Fest
- Navigate to Dashboard
- Click "Create New Fest"
- Complete 4-step fest creation wizard:
  - Fest Information
  - Banner Image Upload
  - Form Builder (optional)
  - Review & Publish

#### 2. Add Events to Fest
- Go to Dashboard
- Click "Manage" button on published fest
- Click "Add New Event" button
- Fill event details:
  - Event Name
  - Domain (dropdown: Technical, Cultural, Sports, etc.)
  - Date & Time
  - Venue
  - Registration Deadline (must be before event date)
  - Max Participants (optional)
  - Description
  - Custom Registration Form (using Form Builder)
  - Prefill User Data option
- Click "Create Event"

#### 3. View Event Registrations
- Click "Manage" on fest in Dashboard
- Select event from left sidebar
- View registration list with:
  - Student name, email, phone, college
  - Branch, year, gender
  - Registration date
  - Custom field responses
- Search by name or email
- Click on student to view full profile

#### 4. Download CSV
- Select event in Manage Fest page
- Click "📥 Download CSV" button
- CSV includes all profile and custom field data

#### 5. View Student Profile
- Click on any student name in registration list
- View comprehensive read-only profile:
  - Basic information (name, email, phone, college)
  - Academic details (branch, year)
  - Gender
  - Event registration history with custom responses
- Access is restricted to students registered in organizer's events

---

### Student Workflow

#### 1. Browse Fests
- Navigate to Home page
- View all published fests

#### 2. View Events
- Click on any fest
- See fest banner and information
- Filter events by domain:
  - All Events
  - Technical
  - Cultural
  - Sports
  - Gaming
  - Literary
  - Arts
  - Other
- View event cards showing:
  - Event name and domain
  - Date, time, venue
  - Current participant count
  - Registration deadline
  - Status badge (Open/Closed)

#### 3. Register for Event
- Click "View Details" on event card
- Review event information
- Click "Register for this Event"
- Fill registration form:
  - Basic info (auto-filled if enabled)
  - Custom event-specific fields
- Submit registration
- Receive confirmation message

#### 4. View Registration Status
- Dashboard shows registered events
- Profile page displays registration history

---

## Key Features

### Registration Deadline Enforcement
- **Frontend Validation:** `isRegistrationOpen()` checks current date against deadline
- **Backend Validation:** Server-side check before creating registration document
- **Status Badges:**
  - 🎯 Open for Registration (green)
  - 🔒 Registrations Closed (red)
  - ✓ Registered (blue)

### Participant Limits
- Optional `maxParticipants` field
- Registration closes when limit reached
- Current count displayed: `25 / 100`

### Domain-Based Filtering
- 8 predefined domains + custom
- Dynamic filter buttons based on fest's events
- Filter persists during browsing

### CSV Export
**Headers:**
- Name, Email, Phone, College, Branch, Year, Gender
- Registration Date
- All custom field labels

**Format:** UTF-8 CSV with BOM for Excel compatibility

### Search Functionality
- Real-time search in registration lists
- Searches across:
  - Student name
  - Email address
- Case-insensitive matching

### Access Control
- **Student Profile Viewing:**
  - Only organizers with registered students can view profiles
  - Verification: Checks if student registered in any of organizer's events
  - Read-only access with locked indicator
  
- **Firestore Rules:**
  - Events: Public read, organizer write
  - EventRegistrations: Student create (own), Organizer read

---

## File Structure

### New Pages Created
```
src/pages/
├── EventDetails.jsx      (540 lines) - Event registration page
├── CreateEvent.jsx       (378 lines) - Event creation form
├── ManageFest.jsx        (331 lines) - Event management dashboard
└── StudentProfile.jsx    (269 lines) - Read-only profile viewer
```

### Modified Pages
```
src/pages/
├── Dashboard.jsx         - Added "Manage" button, profile reminder logic
├── FestDetails.jsx       - Restructured for event listing (removed fest registration)
└── CreateFest.jsx        - ImageBB env integration, undefined error fix
```

### Routes (App.jsx)
```javascript
// Public Routes
/fest/:id                     - Fest details with event list
/event/:eventId              - Individual event details & registration

// Organizer Routes (Protected)
/fest/:festId/manage         - Manage fest events & registrations
/fest/:festId/create-event   - Create new event under fest
/student-profile/:userId     - View student profile (with access check)
```

---

## Form Builder Integration

### Event Registration Forms
- Reuses FormBuilder component from fest creation
- Supports field types:
  - Text, Email, Phone, Number
  - Date, Textarea
  - Dropdown, Radio, Checkbox
  - File Upload
- Field properties:
  - Label
  - Type
  - Required/Optional
  - Placeholder
  - Options (for dropdown/radio)

### Prefill User Data
- Toggle in event creation: "Prefill user data in registration form"
- If enabled, fetches student profile:
  - Name, Email, Phone, College
  - Branch, Year, Gender
- Students can edit prefilled data during registration

---

## Registration Process

### Frontend Flow
1. Check authentication status
2. Verify email (if password-based login)
3. Check user role (must be student)
4. Validate registration deadline
5. Check participant limit (if set)
6. Fetch user profile for prefill
7. Display registration modal
8. Validate form inputs
9. Submit to Firestore

### Backend Validation
```javascript
// Deadline check
const now = new Date();
const deadline = new Date(event.registrationDeadline);
if (now >= deadline) {
  throw new Error('Registration deadline has passed');
}

// Duplicate check
const existingReg = await getDocs(
  query(
    collection(db, 'eventRegistrations'),
    where('eventId', '==', eventId),
    where('userId', '==', currentUser.uid)
  )
);
if (!existingReg.empty) {
  throw new Error('Already registered');
}
```

### Post-Registration
- Increment event `participantCount`
- Create registration document
- Update student dashboard
- Display success message

---

## CSV Download Implementation

### Data Collection
```javascript
// Fetch all registrations for selected event
const registrations = await getDocs(
  query(
    collection(db, 'eventRegistrations'),
    where('eventId', '==', selectedEvent.id)
  )
);
```

### CSV Generation
```javascript
// Build headers
const baseHeaders = ['Name', 'Email', 'Phone', 'College', 'Branch', 'Year', 'Gender', 'Registration Date'];
const customHeaders = Object.keys(registrations[0]?.customFields || {});
const headers = [...baseHeaders, ...customHeaders];

// Build rows
const rows = registrations.map(reg => [
  reg.name,
  reg.email,
  reg.phone,
  reg.college,
  reg.branch,
  reg.year,
  reg.gender,
  new Date(reg.registeredAt).toLocaleString(),
  ...customHeaders.map(h => reg.customFields[h] || '')
]);

// Create CSV blob
const csvContent = [headers, ...rows]
  .map(row => row.map(cell => `"${cell}"`).join(','))
  .join('\n');

const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
```

### Filename Format
```
${festName}_${eventName}_Registrations.csv
```

---

## Student Profile View

### Access Verification
```javascript
// Check if organizer has access to view this student
const organizerFests = await getDocs(
  query(collection(db, 'fests'), where('createdBy', '==', currentUser.uid))
);

const festIds = organizerFests.docs.map(doc => doc.id);

// Get all events for these fests
const events = await getDocs(
  query(collection(db, 'events'), where('festId', 'in', festIds))
);

const eventIds = events.docs.map(doc => doc.id);

// Check if student registered in any event
const studentRegistrations = await getDocs(
  query(
    collection(db, 'eventRegistrations'),
    where('userId', '==', studentId),
    where('eventId', 'in', eventIds)
  )
);

if (studentRegistrations.empty) {
  // Access denied - student not registered in organizer's events
  navigate('/dashboard');
}
```

### Displayed Information
- Profile Card:
  - Name with avatar circle
  - Email, Phone, College
  - Branch, Year, Gender
  
- Registration History:
  - Event name & fest name
  - Registration date
  - Custom field responses (expandable)

---

## Error Handling & Edge Cases

### Handled Scenarios
1. **Email Verification Required**
   - Redirects to verify-email page
   - Shows message: "Please verify your email before registering"

2. **Wrong User Role**
   - Students can't create events
   - Organizers can't register for events
   - Shows appropriate error messages

3. **Deadline Passed**
   - Registration button disabled
   - "Registrations Closed" badge shown
   - Backend validates before saving

4. **Event Full**
   - Checks `participantCount >= maxParticipants`
   - Disables registration when limit reached

5. **Duplicate Registration**
   - Frontend checks existing registration on page load
   - Shows "Already Registered" status
   - Backend query prevents duplicates

6. **Missing Profile Data**
   - Students prompted to complete profile in Dashboard
   - Conditional reminder: Only shows if phone or college missing
   - Prefill uses available data, allows editing

7. **Network Errors**
   - Try-catch blocks around all Firestore operations
   - User-friendly error messages
   - Loading states prevent duplicate submissions

---

## Deployment Checklist

### Firebase Configuration
- [ ] Deploy updated Firestore rules (`firestore.rules`)
- [ ] Create indexes for queries:
  ```javascript
  // eventRegistrations composite indexes
  - eventId + userId
  - eventId (descending registeredAt)
  - festId + userId
  
  // events indexes
  - festId + domain
  - createdBy + createdAt
  ```

### Environment Variables
- [x] VITE_IMGBB_API_KEY in `.env`
- [ ] Firebase config in production environment
- [ ] Verify all API keys are not committed to git

### Testing Checklist
- [ ] Create fest as organizer
- [ ] Add multiple events with different domains
- [ ] Set registration deadlines (past and future)
- [ ] Register as student for multiple events
- [ ] View registrations as organizer
- [ ] Download CSV and verify data
- [ ] Test search functionality
- [ ] View student profile from registration list
- [ ] Test deadline enforcement (frontend & backend)
- [ ] Test participant limit enforcement
- [ ] Verify access control (unauthorized profile access)

---

## Future Enhancements

### Potential Features
1. **Email Notifications**
   - Registration confirmations
   - Reminder emails before event
   - Deadline approaching alerts

2. **QR Code Check-in**
   - Generate unique QR codes per registration
   - Mobile scanner for event entry
   - Attendance tracking

3. **Payment Integration**
   - Paid events support
   - Razorpay/Stripe integration
   - Transaction history

4. **Team Registrations**
   - Team-based events
   - Team creation and management
   - Team leader invitations

5. **Event Certificates**
   - Auto-generate participation certificates
   - Custom certificate templates
   - Bulk certificate download

6. **Analytics Dashboard**
   - Registration trends over time
   - Domain-wise participation metrics
   - Fest comparison analytics

7. **Social Features**
   - Event comments and Q&A
   - Share events on social media
   - Student event recommendations

8. **Mobile App**
   - React Native companion app
   - Push notifications
   - Offline event details

---

## Troubleshooting

### Common Issues

**Issue:** "Registration deadline has passed" but it hasn't
- **Cause:** Timezone mismatch between client and stored deadline
- **Solution:** Ensure datetime-local input saves in UTC, compare as UTC

**Issue:** CSV download shows garbled text in Excel
- **Cause:** Missing UTF-8 BOM character
- **Solution:** Add `\ufeff` prefix to CSV content (already implemented)

**Issue:** Student profile shows "Access Denied"
- **Cause:** Student not registered in any of organizer's events
- **Solution:** Verify registration exists in eventRegistrations collection

**Issue:** Form Builder fields showing "undefined"
- **Cause:** Spreading objects with undefined properties to Firestore
- **Solution:** Explicit field mapping in CreateFest.jsx (already fixed)

**Issue:** Event not appearing in fest details
- **Cause:** Event status or festId mismatch
- **Solution:** Verify event document has correct festId field

---

## API Reference

### Key Functions

#### FestDetails.jsx
```javascript
fetchFestAndEvents()          // Fetches fest and its events
isRegistrationOpen(event)     // Checks if registration deadline passed
```

#### EventDetails.jsx
```javascript
fetchEventDetails()           // Fetches event by eventId
checkRegistrationStatus()     // Checks if current user is registered
openRegistrationModal()       // Validates and opens registration form
handleSubmitRegistration()    // Creates registration document
```

#### ManageFest.jsx
```javascript
fetchFestAndEvents()          // Fetches fest and all events
fetchEventRegistrations(eventId) // Fetches registrations for selected event
handleDownloadCSV()           // Generates and downloads CSV
```

#### StudentProfile.jsx
```javascript
fetchStudentProfile()         // Fetches student data with access verification
checkAccessPermission()       // Verifies organizer can view this student
```

---

## Support & Maintenance

### Code Maintenance
- All new components follow existing project structure
- Consistent error handling patterns
- Reusable FormBuilder component
- Modular CSS using Tailwind classes

### Database Maintenance
- Set up Firestore backup schedule
- Monitor query performance
- Archive old registrations periodically
- Clean up orphaned documents (events without fests)

### Security
- Firestore rules enforce role-based access
- Backend validation for all critical operations
- No sensitive data in client-side code
- Environment variables for API keys

---

## Contact & Support

For issues or feature requests related to the event management system:
1. Check this documentation first
2. Review Firestore rules and indexes
3. Verify environment variables are set
4. Check browser console for errors
5. Test with Firebase Emulator locally

---

**Last Updated:** 2024
**Version:** 1.0.0
**Built with:** React, Firebase, Tailwind CSS
