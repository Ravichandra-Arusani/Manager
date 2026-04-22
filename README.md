# Project Memory Manager

A React/Vite application for storing project context, tracking milestones, and generating AI-ready summaries using a mind-map bubble UI.

## Features
- 🔵 Mind-map UI for projects
- 🔐 Private projects with Google Sign-In
- 🔗 Public shareable links at `/project/:id`
- 📋 1-click "Copy for AI" context summaries

## Setup Instructions

1. **Clone or Download the Repository**
2. **Setup Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
   - Enable Authentication (Google Sign-in) and Firestore.
   - Go to Project Settings -> General -> Your apps, and create a Web App to get your config keys.
3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in your `.env` file with the Firebase keys:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     ...
     ```
4. **Install and Run Locally**
   ```bash
   npm install
   npm run dev
   ```

## Deployment (Firebase Hosting)

1. Build the app: `npm run build`
2. Install firebase tools and login: `npm install -g firebase-tools && firebase login`
3. Deploy: `firebase deploy --only hosting`

## Firestore Security Rules
Make sure to secure your database correctly:
```json
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/projects/{project} {
      allow read: if request.auth.uid == uid || resource.data.isPublic == true;
      allow write: if request.auth.uid == uid;
    }
    match /publicProjects/{project} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
