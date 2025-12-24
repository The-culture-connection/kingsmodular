import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { auth } from './config'
import { createUserProfile, UserProfile } from './firestore'

export interface SignupData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role: string
  companyName?: string
  companyType?: string
}

export async function signupUser(data: SignupData) {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    )
    const user = userCredential.user

    // Send email verification
    await sendEmailVerification(user)

    // Create user profile in Firestore
    const profileData: UserProfile = {
      uid: user.uid,
      email: user.email || data.email,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      displayName: data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}` 
        : data.companyName || data.email.split('@')[0],
      role: data.role,
      companyName: data.companyName || '',
      companyType: data.companyType || '',
      approvalStatus: data.role === 'customer' ? 'approved' : 'pending', // Customers are auto-approved
      createdAt: new Date(),
      emailVerified: false,
    }

    await createUserProfile(user.uid, profileData)

    return user
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Looks like you already have an account, sign in to continue.')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 8 characters.')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.')
    }
    throw new Error(error.message || 'Failed to create account')
  }
}

