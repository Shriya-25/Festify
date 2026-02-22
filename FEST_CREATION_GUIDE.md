# Fest Creation & Registration System Documentation

## Overview
Complete guide to the Fest Creation and Dynamic Registration Form system implemented in Festify.

---

## 🔵 ORGANIZER SIDE – Fest Creation Flow

### Multi-Step Fest Creation Wizard

Organizers can create fests through a 4-step wizard process:

#### **Step 1: Basic Details**
Fields to fill:
- **Fest Name** * (e.g., "TechFest 2026")
- **College Name** * (e.g., "MIT College")
- **Date** * (Calendar picker)
- **Venue** * (e.g., "Main Auditorium")
- **Category** * (Dropdown: Cultural, Technical, Sports, Literary, Music, Dance, Other)
- **Description** * (Detailed fest information)

Validation: All fields are required to proceed to Step 2.

---

#### **Step 2: Banner Image**

Two options for adding banner:

**Option 1: Upload Image**
- Click to upload from device
- Supports: PNG, JPG, GIF, WebP
- Maximum size: 5MB
- Auto-uploads to ImageBB
- Live preview shown after upload

**Option 2: Custom Image URL**
- Paste any direct image URL
- Click "Validate" to check URL
- Live preview shown
- Useful for images already hosted elsewhere

Features:
- Fallback placeholder if image fails to load
- URL validation before proceeding
- Image preview updates in real-time

Validation: Must have a valid banner URL to proceed to Step 3.

---

#### **Step 3: Registration Form Builder**

**Prefill Option:**
- Checkbox: "Auto-fill user profile data"
- When enabled: Name, Email, Phone, College auto-filled from user profile
- When disabled: Organizer must create all fields manually

**Form Builder Interface:**

Add custom fields with:
- **Field Type Selection** (10 types available):
  - 📝 Text Input
  - 📧 Email
  - 📱 Phone Number
  - 🔢 Number
  - 📄 Long Text (Textarea)
  - ▼ Dropdown
  - ⚪ Radio Buttons
  - ☑ Checkbox
  - 📎 File Upload
  - 📅 Date

- **Field Label**: Custom label for the field
- **Placeholder**: Hint text (for text-based fields)
- **Options**: For dropdown/radio - add multiple options
- **Required Toggle**: Mark field as mandatory

**Field Management:**
- Reorder fields: ⬆ ⬇ buttons
- Delete fields: 🗑️ button
- Live preview of all added fields
- Shows field count summary

Example Custom Fields:
- T-Shirt Size (Dropdown: S, M, L, XL, XXL)
- Team Name (Text Input, Required)
- Dietary Preferences (Checkbox)
- Event Selection (Radio: Coding, Design, Business)
- Resume Upload (File)

---

#### **Step 4: Review & Publish**

Shows summary of:
- All fest details entered
- Banner preview
- Registration form configuration
  - Prefill status: Yes/No
  - Number of custom fields
  - Standard fields info if no custom fields

Actions:
- **Previous**: Go back to edit
- **🚀 Publish Fest**: Submit for admin approval

After Publishing:
- Fest saved to Firestore with status: 'pending'
- Success message: "🎉 Fest created successfully! Waiting for admin approval."
- Auto-redirect to dashboard after 2 seconds

---

## 🟢 STUDENT SIDE – Registration Flow

### Registration Process

1. **View Fest Details**
   - Students browse approved fests on Home page
   - Click fest card to view full details
   - See banner, description, date, venue, college

2. **Click "Register for this Fest"**
   - Checks:
     - User must be logged in
     - Email must be verified
     - User role must be "Student"
   - Opens registration modal

3. **Fill Registration Form**

   **Basic Information** (if prefill enabled):
   - Full Name * (pre-filled from profile)
   - Email * (pre-filled from profile)
   - Phone Number * (pre-filled from profile)
   - College Name * (pre-filled from profile)
   - All editable before submission

   **Additional Information** (custom fields):
   - Dynamically rendered based on fest configuration
   - Each field type rendered appropriately:
     - Text inputs with placeholders
     - Dropdowns with options
     - Radio buttons in groups
     - Checkboxes with labels
     - File upload buttons
     - Date pickers
   - Required fields marked with red asterisk (*)

4. **Form Validation**
   - Frontend validation for all field types
   - Email format checking
   - Phone number validation (minimum 10 digits)
   - File size validation (max 5MB)
   - Required field checking
   - Error messages displayed in red banner

5. **Submit Registration**
   - Click "Submit Registration"
   - Data saved to Firestore 'registrations' collection
   - Includes:
     - Fest ID and user ID
     - Fest name and college
     - Registration timestamp
     - All form field responses
     - Custom field data as JSON object
   - Success message: "🎉 Successfully registered for the fest!"
   - Modal closes automatically
   - Button changes to "✓ Already Registered" (disabled, green)

6. **Duplicate Prevention**
   - System checks if user already registered
   - Prevents multiple registrations
   - Shows "Already Registered" if duplicate detected

---

## 📊 Data Structure

### Fests Collection
```javascript
{
  festName: "TechFest 2026",
  collegeName: "MIT College",
  category: "Technical",
  description: "Description...",
  date: "2026-03-15",
  venue: "Main Auditorium",
  bannerUrl: "https://...",
  registrationForm: [
    {
      id: 1234567890,
      label: "T-Shirt Size",
      type: "dropdown",
      required: true,
      options: ["S", "M", "L", "XL"]
    },
    // ... more fields
  ],
  prefillUserData: true,
  createdBy: "userId",
  status: "pending", // or "approved"
  createdAt: "2025-01-15T10:00:00Z",
  registrationCount: 0
}
```

### Registrations Collection
```javascript
{
  festId: "festDocId",
  userId: "userDocId",
  festName: "TechFest 2026",
  collegeName: "MIT College",
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  college: "ABC University",
  customFields: {
    "T-Shirt Size": "L",
    "Team Name": "Code Warriors",
    "Dietary Preferences": true
  },
  registeredAt: "2025-01-20T14:30:00Z"
}
```

---

## 🛡️ Security & Validation

### Organizer Side
- Must be logged in with "Organizer" role
- All steps validated before proceeding
- Image size capped at 5MB
- URL validation for banner
- Protected route checks

### Student Side
- Must be logged in with "Student" role
- Email verification required
- Duplicate registration prevention
- Field-level validation:
  - Email format validation
  - Phone number format (10+ digits)
  - File size limits
  - Required field enforcement
- XSS protection via React's automatic escaping

### Database Security
- Firestore rules should enforce:
  - Only organizers can create fests
  - Only students can register
  - Users can only register once per fest
  - Users cannot modify others' registrations

---

## 🎨 UI/UX Features

### Progress Indicators
- 4-step wizard with visual progress bar
- Active step highlighted in primary color
- Step labels below indicators
- Navigation: Previous/Next buttons

### User Feedback
- Loading states: "Uploading...", "Publishing...", "Submitting..."
- Success messages: Green banners with emojis
- Error messages: Red banners with clear text
- Disabled states for completed actions

### Responsive Design
- Mobile-friendly modal
- Scrollable form for long registration forms
- Touch-friendly buttons
- Proper spacing for mobile screens

### Accessibility
- Required fields marked with asterisks
- Labels for all form inputs
- Button disabled states
- Keyboard navigation support
- Focus management in modals

---

## 🧪 Testing Checklist

### Organizer Flow
- [ ] Create fest with all required fields
- [ ] Upload image via ImageBB
- [ ] Add custom URL for banner
- [ ] Create multiple custom fields
- [ ] Reorder fields up/down
- [ ] Delete fields
- [ ] Mark fields as required
- [ ] Toggle prefill option
- [ ] Navigate back and forth between steps
- [ ] Publish fest successfully
- [ ] Verify fest in Firestore with status 'pending'

### Student Flow
- [ ] View fest details page
- [ ] Open registration modal
- [ ] Check prefilled data accuracy
- [ ] Fill custom fields (all types)
- [ ] Submit with missing required fields (should fail)
- [ ] Submit valid registration
- [ ] Verify "Already Registered" state
- [ ] Check duplicate prevention
- [ ] Verify data in Firestore registrations collection

### Edge Cases
- [ ] Very long fest descriptions
- [ ] Large number of custom fields (10+)
- [ ] Invalid image URLs
- [ ] File upload over 5MB
- [ ] Special characters in text fields
- [ ] Empty dropdowns/radio options
- [ ] Network errors during submission
- [ ] Browser refresh during form filling

---

## 🔧 Customization Options

### Adding New Field Types
To add a new field type, modify `FormBuilder.jsx`:
1. Add to `fieldTypes` array
2. Add rendering logic in registration modal (FestDetails.jsx)
3. Add validation logic if needed

### Styling
All components use Tailwind CSS classes defined in:
- `index.css` for global styles
- Inline classes for component-specific styling
- Custom colors via Tailwind config

### Validation Rules
Modify validation functions in `FestDetails.jsx`:
- `validateForm()` for custom validation logic
- Add field-specific validators
- Implement async validations if needed

---

## 📝 Future Enhancements

Possible improvements:
- [ ] Drag-and-drop field reordering in Form Builder
- [ ] Field templates (save & reuse common forms)
- [ ] Conditional fields (show field based on another field's value)
- [ ] Payment integration for paid fests
- [ ] QR code generation for registrations
- [ ] Email notifications on registration
- [ ] Registration analytics dashboard
- [ ] CSV export of registrations
- [ ] Edit registration capability
- [ ] Registration deadline setting
- [ ] Capacity limits for fests
- [ ] Waiting list functionality

---

## 🆘 Troubleshooting

### ImageBB Upload Fails
- Check API key is correct in CreateFest.jsx
- Verify image size < 5MB
- Check internet connection
- See [IMGBB_SETUP.md](./IMGBB_SETUP.md) for detailed guide

### Registration Not Saving
- Check Firestore rules allow writes
- Verify user is authenticated
- Check browser console for errors
- Ensure all required fields are filled

### Form Builder Not Working
- Check FormBuilder component is imported
- Verify state updates are working
- Check for console errors
- Ensure field IDs are unique

### Modal Not Opening
- Check z-index conflicts
- Verify state management
- Check for parent element overflow issues
- Ensure button onClick is bound correctly

---

## 📚 Related Files

- `src/pages/CreateFest.jsx` - Multi-step fest creation
- `src/components/FormBuilder.jsx` - Dynamic form builder
- `src/pages/FestDetails.jsx` - Fest display & registration
- `IMGBB_SETUP.md` - ImageBB API setup guide
- `FIRESTORE_RULES_SETUP.md` - Database security rules

---

## 🎉 Conclusion

This comprehensive fest creation and registration system provides:
- Flexible form building for organizers
- Seamless registration experience for students
- Data validation and security
- Scalable architecture
- User-friendly interface

The system is production-ready and can handle various fest types with different registration requirements.
