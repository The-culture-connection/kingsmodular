import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAnalytics, Analytics } from "firebase/analytics"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAZd4UXEh2KpVlwrVtPQFRjL8ADijpHXXk",
  authDomain: "kingsmodularllc.firebaseapp.com",
  projectId: "kingsmodularllc",
  storageBucket: "kingsmodularllc.firebasestorage.app",
  messagingSenderId: "1067826241778",
  appId: "1:1067826241778:web:e2e4c99d3fcce922c0706b",
  measurementId: "G-QEQN86CBLN"
}

// Initialize Firebase
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize services
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)

// Initialize Analytics only on client side
export const analytics: Analytics | null = 
  typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
