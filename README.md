# Festify - College Event Management Platform

A comprehensive event management platform for college fests where students can discover events, register with payments, and organizers can manage registrations, payment verifications, and track funds collected.

## 🌟 Key Features

### For Students
- 🔐 **Secure Authentication** - Email/Password + Google Sign-In
- ✉️ **Email Verification** for email/password sign-ups
- 🎪 **Browse & Discover Fests** - Search by name, college, or location
- 🎯 **Event Registration** - Register for free or paid events
- 💳 **Multiple Payment Options**:
  - Manual QR Payment (UPI, PhonePe, GPay, etc.)
  - Razorpay Payment Gateway (Instant verification)
- 📱 **Payment Proof Upload** - Submit screenshot and transaction ID for manual payments
- 📊 **Registration Status Tracking** - View payment verification status
- 👤 **Profile Management** - Update personal information
- 🖼️ **Event Banners** - Rich visual event discovery

### For Organizers
- 🎉 **Create & Manage Fests** - Multi-step fest creation with custom forms
- 🎯 **Event Management** - Create free or paid events
- 💰 **Payment Configuration**:
  - Upload QR codes for manual payments
  - Configure Razorpay for automated payments
- ✅ **Payment Verification Dashboard** - Verify/reject payment proofs
- 💵 **Fund Tracking** - Real-time tracking of total funds collected
- 📥 **CSV Export** - Download complete registration data with payment details
- 📝 **Custom Registration Forms** - Build custom forms with FormBuilder
- 🖼️ **Banner Upload** - Add event banners via ImgBB
- 📊 **Registration Analytics** - View participant counts and payment status

### For Admins
- 🔐 **Admin Panel** - Comprehensive management dashboard
- ✅ **Fest Approval System** - Approve/reject/request changes for fests
- 🎯 **Event Approval System** - Approve/reject/request changes for events
- 👥 **User Management** - View and manage all users
- 📊 **Platform Analytics** - View pending items and platform statistics
- 💬 **Admin Comments** - Provide feedback to organizers

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite) + Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Routing**: React Router v6
- **Image Hosting**: ImgBB API
- **Payment Gateway**: Razorpay
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js (v16 or higher)
- Firebase Account
- ImgBB API Key (for image uploads)
- Razorpay Account (optional, for payment gateway)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd Festify
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# ImgBB API (for image uploads)
VITE_IMGBB_API_KEY=your_imgbb_api_key_here
```

### 3. Firebase Setup

See detailed guides in:
- 📄 [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Complete Firebase configuration
- 📄 [FIRESTORE_RULES_SETUP.md](FIRESTORE_RULES_SETUP.md) - Security rules setup
- 📄 [GOOGLE_SIGNIN_SETUP.md](GOOGLE_SIGNIN_SETUP.md) - Google authentication
- 📄 [EMAIL_VERIFICATION_GUIDE.md](EMAIL_VERIFICATION_GUIDE.md) - Email verification flow

#### Quick Firebase Setup:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication**:
   - Email/Password
   - Google Sign-In (optional)
3. Create **Firestore Database** (Start in production mode)
4. Deploy **Firestore Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Copy your Firebase config to `.env` file

### 4. ImgBB Setup

1. Get free API key from https://api.imgbb.com/
2. Add to `.env` as `VITE_IMGBB_API_KEY`
3. Used for uploading fest/event banners and payment QR codes

See: [IMGBB_SETUP.md](IMGBB_SETUP.md)

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

## 👨‍💼 Setting Up Admin Account

See: [SET_ADMIN_INSTRUCTIONS.md](SET_ADMIN_INSTRUCTIONS.md)

Two methods:
1. **Firebase Console**: Manually set `role: "admin"` in Firestore
2. **Admin Script**: Use `set-admin.js` script

```bash
node set-admin.js your-email@example.com
```

## 💳 Payment System Setup

### Razorpay Integration (Optional)

1. Create account at https://razorpay.com
2. Get **Key ID** and **Secret Key** from Dashboard
3. Configure during event creation in "Payment Setup" step
4. Students can pay instantly via Razorpay checkout

**Note**: Razorpay payments are auto-verified. Manual QR payments require organizer verification.

### Manual QR Payment Setup

1. Generate your UPI QR code (from any UPI app)
2. Upload during event creation
3. Students will scan, pay, and upload proof
4. Organizers verify payments from dashboard

## 📚 Documentation

- 📖 [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - Complete technical documentation
- 📖 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview
- 📖 [FEATURES.md](FEATURES.md) - Detailed feature list
- 📖 [FEST_CREATION_GUIDE.md](FEST_CREATION_GUIDE.md) - How to create fests
- 📖 [EVENT_MANAGEMENT_SYSTEM.md](EVENT_MANAGEMENT_SYSTEM.md) - Event management guide
- 📖 [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- 📖 [INSTALLATION.md](INSTALLATION.md) - Detailed installation instructions

## 🔒 Firestore Collections Structure

### users
```javascript
{
  uid: string,
  email: string,
  name: string,
  role: "student" | "organizer" | "admin",
  phone: string,
  college: string,
  createdAt: timestamp
}
```

### fests
```javascript
{
  festName: string,
  collegeName: string,
  category: string,
  description: string,
  date: string,
  venue: string,
  bannerUrl: string,
  createdBy: string (uid),
  status: "pending" | "approved" | "rejected" | "changes_requested",
  registrationForm: array,
  prefillUserData: boolean,
  adminComments: string
}
```

### events
```javascript
{
  festId: string,
  eventName: string,
  domain: string,
  description: string,
  date: string,
  time: string,
  venue: string,
  isPaid: boolean,
  entryFee: number,
  paymentConfig: {
    method: "manual" | "razorpay",
    qrImageURL: string, // for manual
    instructions: string, // for manual
    apiKey: string, // for razorpay
    businessName: string // for razorpay
  },
  maxParticipants: number,
  registrationDeadline: string,
  bannerUrl: string,
  createdBy: string (uid),
  status: "pending" | "approved" | "rejected",
  participantCount: number,
  registrationForm: array
}
```

### eventRegistrations
```javascript
{
  eventId: string,
  festId: string,
  userId: string,
  name: string,
  email: string,
  phone: string,
  college: string,
  paymentProof: {
    screenshotURL: string,
    transactionId: string,
    paymentStatus: "pending_verification" | "verified" | "rejected" | "success",
    razorpay_payment_id: string, // for Razorpay
    paymentMethod: "manual" | "razorpay"
  },
  paymentVerified: boolean,
  customFields: object,
  registeredAt: timestamp
}
```

## 🎨 Key Features Breakdown

### Payment Flow
1. **Free Events**: Direct registration without payment
2. **Paid Events**:
   - **Manual QR**: Student pays → uploads proof → organizer verifies → registration complete
   - **Razorpay**: Student pays → instant verification → registration complete

### Event Creation Flow
1. Basic Details (Name, Domain, Description, Date, Venue)
2. Entry Fees (Free/Paid selection)
3. Payment Setup (Upload QR or Configure Razorpay) - *if paid*
4. Banner Upload (Optional)
5. Registration Form Builder (Custom fields)
6. Review & Submit (Admin approval required)

### Organizer Dashboard
- View all events with banners
- See registration counts and payment status
- Track total funds collected per event
- Verify/reject payment proofs with proof viewing
- Download CSV with complete payment details
- Edit events (requires re-approval)

## 🐛 Troubleshooting

### Firebase Permission Denied
- Check Firestore security rules are deployed
- Verify user has correct role in Firestore
- Ensure email is verified (for email/password users)

### Payment Issues
- Verify ImgBB API key for QR/screenshot uploads
- Check Razorpay Key ID (not Secret Key) for frontend
- Ensure payment configuration is saved with event

### Image Upload Failures
- Check ImgBB API key is valid
- Verify image size < 5MB
- Ensure stable internet connection

## 📝 License

This project is MIT licensed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for college fest management**
