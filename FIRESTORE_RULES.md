# Firestore Security Rules

## Recommended Rules for Kings Modular

Copy and paste these rules into your Firestore Rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin' &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approvalStatus == 'approved';
    }
    
    // Helper function to check if user is the owner
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Users collection
    match /users/{userId} {
      // Allow users to create their own profile during signup
      allow create: if isAuthenticated() 
        && request.auth.uid == userId
        && request.resource.data.uid == userId
        && request.resource.data.email == request.auth.token.email;
      
      // Users can read their own profile
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      
      // Users can update limited fields in their own profile
      allow update: if isAuthenticated() && isOwner(userId)
        && (!('role' in request.resource.data) || request.resource.data.role == resource.data.role)
        && (!('approvalStatus' in request.resource.data) || request.resource.data.approvalStatus == resource.data.approvalStatus)
        && (!('uid' in request.resource.data) || request.resource.data.uid == resource.data.uid)
        && (!('email' in request.resource.data) || request.resource.data.email == resource.data.email);
      
      // Admins can read, update, and delete any user profile
      allow read, update, delete: if isAdmin();
    }
    
    // Jobs collection - readable by all authenticated users, writable by admins only
    // Note: Collection name must match exactly (case-sensitive)
    match /Jobs/{jobId} {
      // Anyone authenticated can read jobs
      allow read: if isAuthenticated();
      
      // Only admins can create, update, or delete jobs
      allow write: if isAdmin();
    }
    
    // Estimates subcollection under user profiles: users/{userId}/estimates/{estimateId}
    match /users/{userId}/estimates/{estimateId} {
      // Customers can create their own estimates
      allow create: if isAuthenticated()
        && request.auth.uid == userId
        && request.resource.data.customerId == request.auth.uid
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.customerEmail == request.auth.token.email
        && request.resource.data.status == 'pending';
      
      // Customers can read their own estimates
      // Admins can read any user's estimates
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || 
        isAdmin()
      );
      
      // Customers can update their own estimates (limited fields, but status should be controlled by admins)
      // Admins can update any estimate (especially status)
      allow update: if isAuthenticated() && (
        (request.auth.uid == userId && 
         (!('status' in request.resource.data) || request.resource.data.status == resource.data.status)) ||
        isAdmin()
      );
      
      // Only admins can delete estimates
      allow delete: if isAdmin();
    }
    
    // Allow authenticated users to query users collection (for admin approvals)
    match /users/{document=**} {
      allow list: if isAuthenticated();
    }
    
    // Allow authenticated users to list jobs
    match /Jobs/{document=**} {
      allow list: if isAuthenticated();
    }
    
    // Allow customers to list their own estimates, admins to list all
    match /users/{userId}/estimates/{document=**} {
      allow list: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }
  }
}
```

## More Permissive Rules (For Development/Testing)

If you're still having issues, use these more permissive rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && (request.auth.uid == userId || 
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin'));
      allow update: if request.auth != null && request.auth.uid == userId
        && (!('role' in request.resource.data) || request.resource.data.role == resource.data.role)
        && (!('approvalStatus' in request.resource.data) || request.resource.data.approvalStatus == resource.data.approvalStatus);
      allow write: if request.auth != null 
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin';
    }
    
    // Jobs collection - readable by all authenticated users
    // Note: Collection name must match exactly (case-sensitive)
    match /Jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin';
    }
    
    // Estimates subcollection under user profiles: users/{userId}/estimates/{estimateId}
    match /users/{userId}/estimates/{estimateId} {
      // Customers can create their own estimates
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.customerId == request.auth.uid
        && request.resource.data.uid == request.auth.uid;
      
      // Customers can read their own estimates, admins can read any user's estimates
      allow read: if request.auth != null && (
        request.auth.uid == userId ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin')
      );
      
      // Admins can update any estimate, customers can update their own (but not status)
      allow update: if request.auth != null && (
        (request.auth.uid == userId && 
         (!('status' in request.resource.data) || request.resource.data.status == resource.data.status)) ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin')
      );
      
      allow delete: if request.auth != null 
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'office_admin';
    }
    
    // Allow listing for authenticated users
    match /{document=**} {
      allow list: if request.auth != null;
    }
  }
}
```

## Temporary Open Rules (ONLY FOR TESTING)

⚠️ **WARNING: Only use these rules for initial testing. They are NOT secure for production!**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `kingsmodularllc`
3. Navigate to **Firestore Database** → **Rules** tab
4. Paste the rules above
5. Click **Publish**

## Key Rules Explained

### Jobs Collection
- **Read**: All authenticated users can read jobs (needed for quote page)
- **Write**: Only admins can create/update/delete jobs

### Pending Estimates Collection
- **Create**: Customers can create estimates where `customerId` matches their UID
- **Read**: Customers can read their own estimates; admins can read all
- **Update**: Customers can update their own estimates (but not status); admins can update any estimate (especially status changes)
- **Delete**: Only admins can delete estimates

## Troubleshooting

If you're still getting permission errors:

1. **Check Authentication**: Make sure the user is authenticated (`request.auth != null`)
2. **Check User Document**: The user's profile must exist in Firestore for admin checks
3. **Check Field Names**: Make sure field names match exactly (case-sensitive)
4. **Use Firebase Console Logs**: Check the Rules Playground to test your rules
5. **Start with Permissive Rules**: Use the temporary open rules first to verify everything works, then tighten security

## Common Issues

- **"Missing or insufficient permissions"** - User doesn't have permission to read/write
- **"Document does not exist"** - Trying to check admin status before user profile exists
- **Field validation errors** - Trying to modify restricted fields (role, approvalStatus, status)