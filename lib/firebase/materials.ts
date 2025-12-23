// Materials Firestore functions
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { db } from './config'

export interface Material {
  id: string
  name: string
  cost: number
  createdAt?: Date | any
  updatedAt?: Date | any
}

/**
 * Get all materials from Firestore
 */
export async function getAllMaterials(): Promise<Material[]> {
  try {
    const materialsRef = collection(db, 'Materials')
    const q = query(materialsRef, orderBy('name'))
    const snapshot = await getDocs(q)
    
    const materials: Material[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      materials.push({
        id: doc.id,
        name: data.name || '',
        cost: data.cost || 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      })
    })
    
    return materials
  } catch (error: any) {
    console.error('Error fetching materials:', error)
    throw new Error(`Failed to fetch materials: ${error.message}`)
  }
}

/**
 * Add a new material
 */
export async function addMaterial(name: string, cost: number): Promise<string> {
  try {
    const materialsRef = collection(db, 'Materials')
    const docRef = await addDoc(materialsRef, {
      name,
      cost,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error: any) {
    console.error('Error adding material:', error)
    throw new Error(`Failed to add material: ${error.message}`)
  }
}

