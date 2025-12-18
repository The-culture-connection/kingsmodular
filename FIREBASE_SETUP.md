# Firebase Authentication & Firestore Setup

## Overview
Firebase Authentication and Firestore have been integrated into the Kings Modular application for user authentication and profile management.

## Files Created

### Configuration
- `lib/firebase/config.ts` - Firebase initialization and configuration
  - Initializes Firebase app with provided config
  - Exports `auth` (Firebase Auth instance)
  - Exports `db` (Firestore instance)
  - Exports `analytics` (Analytics instance, client-side only)

### Authentication Service
- `lib/firebase/auth.ts` - Firebase Authentication functions
  - `signupUser()` - Creates user account, sends email verification, creates Firestore profile
  - `loginUser()` - Signs in existing user
  - `logoutUser()` - Signs out current user

### Firestore Service
- `lib/firebase/firestore.ts` - Firestore database operations
  - `createUserProfile()` - Creates user profile document in Firestore
  - `getUserProfile()` - Retrieves user profile by UID
  - `updateUserProfile()` - Updates user profile
  - `getPendingApprovals()` - Gets all users with pending approval status
  - `approveUser()` - Approves a user (changes status to 'approved')
  - `denyUser()` - Denies a user (changes status to 'denied')

## User Profile Structure

User profiles are stored in Firestore under the `users` collection with the following structure:

```typescript
{
  uid: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: UserRole
  companyName?: string
  companyType?: string
  approvalStatus: 'pending' | 'approved' | 'denied'
  createdAt: Timestamp
  updatedAt: Timestamp
  emailVerified: boolean
}
```

## Updated Files

### Auth Context
- `lib/auth-context.tsx` - Updated to use Firebase Auth
  - Uses `onAuthStateChanged` to listen for auth state changes
  - Loads user profile from Firestore when user signs in
  - Provides `firebaseUser` in context for direct Firebase access

### Signup Page
- `app/auth/signup/page.tsx` - Integrated with Firebase
  - Calls `signupUser()` on form submission
  - Creates Firestore profile with user information
  - Handles errors and shows toast notifications
  - Redirects based on user role (pending approval vs approved)

### Login Page
- `app/auth/login/page.tsx` - Integrated with Firebase
  - Uses `login()` from auth context
  - Handles authentication errors
  - Shows toast notifications

### Admin Approvals Page
- `app/admin/users/approvals/page.tsx` - Integrated with Firestore
  - Loads pending approvals from Firestore
  - Approves/denies users with Firestore updates
  - Refreshes user list after actions

## Approval Flow

1. **Internal Roles** (office_admin, project_manager, bookkeeper, field_staff, employee):
   - Created with `approvalStatus: 'pending'`
   - Redirected to `/auth/pending-approval` page
   - Must be approved by an Office Admin before access

2. **Customer Role**:
   - Created with `approvalStatus: 'approved'`
   - Can immediately access customer portal

## Firestore Security Rules (Recommended)

You should set up Firestore security rules. Example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own profile (limited fields)
      allow update: if request.auth != null && request.auth.uid == userId
        && !('role' in request.resource.data)
        && !('approvalStatus' in request.resource.data);
      
      // Only admins can create/update/delete user profiles
      allow write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin';
    }
  }
}
```

## Next Steps

1. Set up Firestore security rules in Firebase Console
2. Configure Authentication settings in Firebase Console (email/password enabled)
3. Set up email templates for email verification
4. Consider adding password reset functionality
5. Add profile photo storage (Firebase Storage)
