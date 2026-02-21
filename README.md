# Festify - Discover College Fests Near You

A student-first fest discovery platform where college students can discover fests, view event details, register instantly, and get notified about upcoming events.

## Features

- 🔐 Authentication (Email/Password)
- 🎉 Browse and search fests
- 📝 Register for events
- 🏫 Organizer dashboard to create fests
- 👨‍💼 Admin approval system
- 📱 Responsive mobile-first design

## Tech Stack

- React.js (Vite)
- Firebase (Auth + Firestore)
- Tailwind CSS
- React Router

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Email/Password authentication
   - Create Firestore database
   - Copy your Firebase config to `src/firebase/config.js`

3. Run the development server:
```bash
npm run dev
```

## Firebase Setup Instructions

1. Go to Firebase Console
2. Create a new project
3. Enable Authentication > Email/Password
4. Create Firestore Database (Start in test mode)
5. Copy your config and paste it in `src/firebase/config.js`

## Default Admin Account

To test admin features, create a user and manually set their role to "admin" in Firestore:
- Go to Firestore Console > users collection
- Find your user document
- Set `role: "admin"`
