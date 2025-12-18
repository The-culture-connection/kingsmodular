import { NextResponse } from 'next/server'
import { getFirebaseAdminApp, isFirebaseAdminConfigured, admin } from '@/lib/firebase/firebaseAdmin'

export async function POST(req: Request) {
  try {
    // Check if Firebase Admin is configured
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      email,
      password,
      name,
      dateOfBirth,
      hireDate,
      startDate,
      role,
      customFields,
    } = body

    // Validate required fields
    if (!email || !password || !name || !dateOfBirth || !hireDate || !startDate || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get Firebase Admin instances
    const adminApp = getFirebaseAdminApp()
    const auth = adminApp.auth()
    const db = adminApp.firestore()

    // Create user with Firebase Admin SDK (doesn't sign in)
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    })

    // Prepare profile data
    const firstName = name.split(' ')[0] || name
    const lastName = name.split(' ').slice(1).join(' ') || ''

    const profileData: any = {
      uid: userRecord.uid,
      email: userRecord.email!,
      firstName,
      lastName,
      displayName: name,
      role,
      dateOfBirth,
      hireDate,
      startDate,
      approvalStatus: 'approved', // All employees created by admin are automatically approved
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add custom fields to profile data
    if (customFields && typeof customFields === 'object') {
      Object.keys(customFields).forEach((key) => {
        if (customFields[key]) {
          profileData[`custom_${key}`] = customFields[key]
        }
      })
    }

    // Save to Firestore users collection
    await db.collection('users').doc(userRecord.uid).set(profileData)

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      message: 'Employee profile created successfully',
    })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create employee profile' },
      { status: 500 }
    )
  }
}

