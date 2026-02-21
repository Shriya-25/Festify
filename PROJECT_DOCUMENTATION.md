# Festify - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [User Roles](#user-roles)
7. [Application Flow](#application-flow)
8. [Database Schema](#database-schema)
9. [Component Details](#component-details)
10. [API/Firebase Operations](#apifirebase-operations)

---

## 🎯 Project Overview

**Festify** is a student-first fest discovery platform that connects college students with exciting college events across India. Students can discover fests, view event details, register instantly, while organizers can promote their events, and admins oversee content quality.

### Problem Statement
- Students struggle to find nearby college fests
- No centralized platform for fest discovery
- Difficult to track registration deadlines
- Organizers need an easy way to promote events

### Solution
A comprehensive web application that:
- Lists all approved college fests in one place
- Provides detailed event information
- Enables one-click registration
- Offers role-based dashboards for different users

---

## ✨ Features

### 🎓 For Students
- **Browse Fests**: View all approved college fests
- **Search & Filter**: Find fests by name, college, location, or category
- **Fest Details**: Get comprehensive information about each fest
- **Quick Registration**: Register for fests with one click
- **My Registrations**: Track all registered fests in dashboard

### 🏫 For Organizers
- **Create Fests**: Submit fest listings with complete details
- **Manage Fests**: View all created fests and their approval status
- **Dashboard**: Monitor pending and approved fests

### 👨‍💼 For Admins
- **Review Submissions**: View all pending fest submissions
- **Approve/Reject**: Control which fests go live on the platform
- **Quality Control**: Ensure only quality events are published

---

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite** - Build tool for fast development
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling

### Backend & Services
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - NoSQL database
- **Firebase Hosting** - Deployment (optional)

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 📁 Project Structure

```
festify/
├── public/                   # Static assets
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx      # Navigation bar
│   │   ├── ProtectedRoute.jsx  # Route protection
│   │   └── FestCard.jsx    # Fest display card
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing & fest listing
│   │   ├── Login.jsx       # User login
│   │   ├── Signup.jsx      # User registration
│   │   ├── FestDetails.jsx # Individual fest details
│   │   ├── CreateFest.jsx  # Fest creation form
│   │   └── Dashboard.jsx   # Role-based dashboard
│   ├── context/            # React Context
│   │   └── AuthContext.jsx # Authentication state
│   ├── firebase/           # Firebase configuration
│   │   └── config.js       # Firebase setup
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── FIREBASE_SETUP.md     # Firebase setup guide
├── README.md             # Project readme
├── index.html            # HTML template
├── package.json          # Dependencies
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind configuration
└── vite.config.js        # Vite configuration
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation Steps

1. **Clone or navigate to the project:**
   ```bash
   cd "C:\Users\SANDESH\OneDrive\Desktop\Festify"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Follow the detailed guide in `FIREBASE_SETUP.md`
   - Update `src/firebase/config.js` with your Firebase credentials

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview  # Preview production build
```

---

## 👥 User Roles

### Student
- **Primary Goal**: Discover and register for fests
- **Access**: Home, Fest Details, Dashboard (My Registrations)
- **Capabilities**: Browse, search, filter, register for fests

### Organizer
- **Primary Goal**: Create and promote college fests
- **Access**: All student features + Create Fest page
- **Capabilities**: Create fests, view submission status, manage own fests

### Admin
- **Primary Goal**: Maintain platform quality
- **Access**: Special admin dashboard
- **Capabilities**: Approve/reject fest submissions
- **Setup**: Manually set role to "admin" in Firestore

---

## 🔄 Application Flow

### User Registration Flow
1. User visits signup page
2. Enters details (name, email, password, role)
3. Firebase creates authentication account
4. User document created in Firestore with role
5. Automatic login and redirect to home

### Fest Creation Flow (Organizer)
1. Organizer clicks "Create Fest"
2. Fills form with fest details
3. Data saved to Firestore with status: "pending"
4. Document includes createdBy: userId
5. Waits for admin approval

### Admin Approval Flow
1. Admin views pending fests in dashboard
2. Reviews fest details
3. Clicks "Approve" → status changes to "approved"
4. Clicks "Reject" → fest document deleted
5. Approved fests appear on home page

### Student Registration Flow
1. Student browses approved fests
2. Clicks on fest card to view details
3. Clicks "Register for this Fest"
4. Registration document created in Firestore
5. Success message displayed

---

## 🗄 Database Schema

### Collections Structure

#### users
```javascript
{
  userId: "auto-generated-uid",
  name: "John Doe",
  email: "john@example.com",
  role: "student" | "organizer" | "admin",
  createdAt: "2026-02-21T10:00:00.000Z"
}
```

#### fests
```javascript
{
  festId: "auto-generated-id",
  festName: "TechFest 2026",
  collegeName: "MIT College",
  category: "Technical",
  description: "Annual technical fest...",
  date: "2026-03-15",
  location: "Mumbai, Maharashtra",
  bannerUrl: "https://...",
  createdBy: "organizer-user-id",
  status: "pending" | "approved",
  createdAt: "2026-02-21T10:00:00.000Z",
  approvedAt: "2026-02-21T11:00:00.000Z" // Optional
}
```

#### registrations
```javascript
{
  registrationId: "auto-generated-id",
  festId: "fest-document-id",
  userId: "student-user-id",
  festName: "TechFest 2026",
  collegeName: "MIT College",
  registeredAt: "2026-02-21T12:00:00.000Z"
}
```

---

## 🧩 Component Details

### Core Components

#### AuthContext
- **Purpose**: Manage authentication state globally
- **Provides**: 
  - `currentUser` - Currently logged-in user
  - `userRole` - User's role (student/organizer/admin)
  - `signup()` - Registration function
  - `login()` - Login function
  - `logout()` - Logout function
- **Features**: Automatic role fetching, persistent auth state

#### Navbar
- **Purpose**: Site navigation
- **Features**: 
  - Dynamic links based on auth state
  - Role display
  - Logout functionality
  - Responsive design

#### ProtectedRoute
- **Purpose**: Restrict access to authenticated users
- **Props**: 
  - `children` - Component to protect
  - `requiredRole` - Optional role requirement
- **Behavior**: Redirects to login if not authenticated

#### FestCard
- **Purpose**: Display fest information in card format
- **Props**: `fest` object
- **Features**: Image, title, college, location, date, category

### Page Components

#### Home
- **Route**: `/`
- **Features**: 
  - Hero section with CTA
  - Search bar
  - Category filter
  - Fest grid display
  - Category browsing section
- **State**: fests list, search term, selected category

#### Login/Signup
- **Routes**: `/login`, `/signup`
- **Features**: Form validation, error handling, role selection (signup)
- **Redirects**: To home page after successful auth

#### FestDetails
- **Route**: `/fest/:id`
- **Features**: 
  - Full fest information display
  - Registration button
  - Registration status check
  - Banner image
- **Dynamic**: Fetches fest based on URL parameter

#### CreateFest
- **Route**: `/create-fest`
- **Protection**: Organizer only
- **Features**: 
  - Multi-field form
  - Date picker
  - Category dropdown
  - Form validation
  - Success feedback

#### Dashboard
- **Route**: `/dashboard`
- **Protection**: Authenticated users only
- **Features**: 
  - Role-based content
  - **Student**: Shows registrations
  - **Organizer**: Shows created fests with status
  - **Admin** Shows pending approvals with action buttons

---

## 🔥 API/Firebase Operations

### Authentication Operations
```javascript
// Sign up
createUserWithEmailAndPassword(auth, email, password)

// Login
signInWithEmailAndPassword(auth, email, password)

// Logout
signOut(auth)

// Auth state observer
onAuthStateChanged(auth, callback)
```

### Firestore Operations

#### Read Operations
```javascript
// Get single document
getDoc(doc(db, 'fests', festId))

// Query with filters
query(collection(db, 'fests'), 
  where('status', '==', 'approved'),
  orderBy('date', 'desc'))

// Execute query
getDocs(query)
```

#### Write Operations
```javascript
// Add document
addDoc(collection(db, 'fests'), data)

// Update document
updateDoc(doc(db, 'fests', festId), { status: 'approved' })

// Delete document
deleteDoc(doc(db, 'fests', festId))

// Set document with ID
setDoc(doc(db, 'users', userId), data)
```

---

## 🎨 Styling System

### Tailwind Custom Classes
```css
/* Buttons */
.btn-primary - Indigo button with hover effect
.btn-secondary - Gray button with hover effect

/* Form Elements */
.input-field - Styled input with focus ring
.label - Form label styling

/* Layout */
.card - White card with shadow and hover effect
```

### Color Scheme
- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Background**: Gray-50
- **Text**: Gray-900

---

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns)

---

## 🔒 Security Considerations

### Current Setup (Development)
- Firestore in test mode (open access)
- Suitable for development only

### Production Recommendations
1. Update Firestore security rules (see FIREBASE_SETUP.md)
2. Enable Firebase App Check
3. Add rate limiting
4. Implement server-side validation
5. Use environment variables for sensitive data
6. Enable CORS properly
7. Add input sanitization

---

## 🐛 Troubleshooting

### Common Issues

**Firebase not initialized**
- Check if config.js has correct credentials
- Ensure Firebase project exists

**Fests not showing**
- Check Firestore rules
- Verify fests have status: "approved"
- Check browser console for errors

**Can't register for fest**
- Ensure user is logged in
- Verify user role is "student"
- Check Firestore permissions

**Admin features not working**
- Manually set role to "admin" in Firestore
- Refresh page after changing role

---

## 🚀 Future Enhancements

### Potential Features
- Email notifications
- Payment integration for fest tickets
- Event calendar view
- Social media sharing
- User profiles with avatars
- Fest reviews and ratings
- Location-based recommendations
- Mobile app (React Native)
- Real-time notifications
- Advanced analytics for organizers
- Multi-image gallery for fests
- Event categories with icons
- Bookmark/favorite fests
- Export registrations (for organizers)

---

## 📄 License

This project is open source and available for educational purposes.

---

## 👨‍💻 Development Team

Built with ❤️ for college students everywhere

---

## 📞 Support

For issues or questions:
1. Check FIREBASE_SETUP.md for setup issues
2. Review this documentation
3. Check browser console for errors
4. Verify Firebase project configuration

---

**Happy Coding! 🎉**
