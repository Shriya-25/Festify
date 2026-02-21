# 🛠️ Complete Installation Guide for Festify

## Prerequisites

Before you begin, you need to install Node.js which includes npm (Node Package Manager).

### Step 1: Install Node.js

1. **Download Node.js:**
   - Visit: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version
   - Recommended: Version 18.x or higher

2. **Install Node.js:**
   - Run the downloaded installer
   - Follow the installation wizard
   - ✅ Make sure to check "Add to PATH" option
   - Complete the installation

3. **Verify Installation:**
   Open a new Command Prompt or PowerShell and run:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (e.g., v18.x.x and 9.x.x)

---

## Installation Steps

### Step 2: Navigate to Project

```bash
cd "C:\Users\SANDESH\OneDrive\Desktop\Festify"
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- React 18.2
- React Router DOM 6.x
- Firebase 10.x
- Tailwind CSS 3.x
- Vite 5.x
- All other dependencies

**Note:** This may take 2-3 minutes depending on your internet speed.

### Step 4: Configure Firebase

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Click "Create Project"
   - Name it "Festify" (or any name)
   - Follow the wizard

2. **Enable Authentication:**
   - In Firebase Console, click "Authentication"
   - Click "Get Started"
   - Enable "Email/Password" method

3. **Create Firestore Database:**
   - Click "Firestore Database" in sidebar
   - Click "Create Database"
   - Select "Start in test mode"
   - Choose your region
   - Click "Enable"

4. **Get Firebase Config:**
   - Click the gear icon (Project Settings)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Register your app
   - Copy the config object

5. **Update Config File:**
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Step 5: Run Development Server

```bash
npm run dev
```

The app will start at: http://localhost:5173

### Step 6: Build for Production (Optional)

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

---

## Common Installation Issues

### Issue 1: npm not recognized

**Problem:** Windows doesn't recognize 'npm' command

**Solution:**
1. Restart your computer after installing Node.js
2. Open a NEW terminal window
3. If still not working, check if Node.js is in your PATH:
   - Search "Environment Variables" in Windows
   - Check if `C:\Program Files\nodejs\` is in PATH

### Issue 2: Port already in use

**Problem:** Port 5173 is already occupied

**Solution:**
```bash
# Kill the process or use a different port
npm run dev -- --port 3000
```

### Issue 3: Firebase errors

**Problem:** Firebase initialization fails

**Solution:**
1. Double-check your config values in `config.js`
2. Make sure you copied the complete config
3. No extra quotes or commas
4. Verify Firebase project exists

### Issue 4: Module not found

**Problem:** Some modules are missing

**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: Firestore permission denied

**Problem:** Can't read/write to Firestore

**Solution:**
1. Make sure Firestore is created
2. Check you're in "test mode" (for development)
3. See FIREBASE_SETUP.md for production rules

---

## Verify Installation

After installation, verify everything works:

### 1. Development Server Starts
```bash
npm run dev
```
✅ Should show: "Local: http://localhost:5173"

### 2. No Console Errors
- Open http://localhost:5173
- Open browser DevTools (F12)
- Check Console tab
- ✅ Should have no red errors

### 3. Firebase Connected
- Try signing up
- ✅ Should create account without errors

### 4. Database Working
- After signup, check Firestore
- ✅ Should see user document created

---

## File Checklist

Make sure these files exist:

```
✅ package.json
✅ vite.config.js
✅ tailwind.config.js
✅ postcss.config.js
✅ index.html
✅ src/main.jsx
✅ src/App.jsx
✅ src/firebase/config.js (configured)
✅ src/context/AuthContext.jsx
✅ src/pages/* (all page files)
✅ src/components/* (all component files)
✅ src/index.css
```

---

## Testing Checklist

Once running, test these features:

### Authentication
- [ ] Sign up as Student
- [ ] Sign up as Organizer
- [ ] Login with created account
- [ ] Logout

### Student Features
- [ ] Browse fests (will be empty initially)
- [ ] Search fests
- [ ] Filter by category

### Organizer Features
- [ ] Create a fest
- [ ] View fest in dashboard with "pending" status

### Admin Features
- [ ] Set role to "admin" in Firestore
- [ ] Refresh page
- [ ] See pending fests
- [ ] Approve a fest
- [ ] Fest appears on home page

### Student Registration
- [ ] Login as student
- [ ] View approved fest
- [ ] Register for fest
- [ ] See registration in dashboard

---

## Next Steps After Installation

1. **Customize Branding:**
   - Update colors in `tailwind.config.js`
   - Change app name in `index.html`
   - Update README with your info

2. **Add Sample Data:**
   - Create a few fests as organizer
   - Approve them as admin
   - Test the full flow

3. **Security (Before Production):**
   - Update Firestore rules (see FIREBASE_SETUP.md)
   - Enable Firebase App Check
   - Remove test mode

4. **Deploy:**
   - Firebase Hosting: `firebase deploy`
   - Vercel: Connect GitHub repo
   - Netlify: Drag and drop `dist` folder

---

## Scripts Reference

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Utilities (when configured)
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

---

## Getting Help

### Documentation Files
- **Quick Start**: See QUICKSTART.md
- **Features**: See FEATURES.md
- **Firebase Setup**: See FIREBASE_SETUP.md
- **Full Docs**: See PROJECT_DOCUMENTATION.md

### Online Resources
- React: https://react.dev/
- Firebase: https://firebase.google.com/docs
- Tailwind: https://tailwindcss.com/docs
- Vite: https://vitejs.dev/

### Common Commands

```bash
# Check Node/npm version
node -v
npm -v

# Update npm
npm install -g npm@latest

# Clear npm cache
npm cache clean --force

# Check outdated packages
npm outdated

# Update all packages
npm update
```

---

## Success!

If you've completed all steps and can:
- ✅ Run the dev server
- ✅ Sign up/login
- ✅ Create a fest
- ✅ Approve as admin
- ✅ Register as student

**Congratulations! Your Festify installation is complete! 🎉**

---

**Need more help?** Check the other documentation files or review the Firebase Console for any configuration issues.
