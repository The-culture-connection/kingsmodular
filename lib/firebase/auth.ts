import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth'
import { auth } from './config'
import { createUserProfile } from './firestore'

export interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  companyName?: string
  companyType?: string
}

export async function signupUser(data: SignupData) {
  try {
    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )
    const user = userCredential.user

    // Update display name (use company name for customers if no last name)
    const displayName = data.lastName 
      ? `${data.firstName} ${data.lastName}`
      : data.firstName || data.companyName || data.email.split('@')[0]
    
    await updateProfile(user, {
      displayName: displayName,
    })

    // Send email verification
    await sendEmailVerification(user)

    // Create user profile in Firestore
    const profileData = {
      uid: user.uid,
      email: user.email!,
      firstName: data.firstName,
      lastName: data.lastName || '',
      displayName: displayName,
      role: data.role,
      companyName: data.companyName || '',
      companyType: data.companyType || '',
      approvalStatus: ['office_admin', 'project_manager', 'bookkeeper', 'field_staff', 'employee'].includes(data.role) ? 'pending' : 'approved',
      createdAt: new Date(),
      emailVerified: false,
    }

    await createUserProfile(user.uid, profileData)

    return { user, profile: profileData }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Looks like you already have an account, sign in to continue.')
    }
    throw new Error(error.message || 'Failed to create account')
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in')
  }
}

export async function logoutUser() {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out')
  }
}
