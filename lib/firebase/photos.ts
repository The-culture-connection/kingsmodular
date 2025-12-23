// Photos Storage functions
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage'
import { storage } from './config'

/**
 * Upload a photo to Firebase Storage
 * @param jobId - The job ID
 * @param file - The file to upload
 * @returns The download URL
 */
export async function uploadJobPhoto(jobId: string, file: File): Promise<string> {
  try {
    const photoRef = ref(storage, `jobs/${jobId}/photos/${Date.now()}_${file.name}`)
    const snapshot = await uploadBytes(photoRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    throw new Error(`Failed to upload photo: ${error.message}`)
  }
}

/**
 * Get all photos for a job
 * @param jobId - The job ID
 * @returns Array of photo URLs
 */
export async function getJobPhotos(jobId: string): Promise<string[]> {
  try {
    const photosRef = ref(storage, `jobs/${jobId}/photos`)
    const result = await listAll(photosRef)
    
    const photoUrls: string[] = []
    for (const itemRef of result.items) {
      const url = await getDownloadURL(itemRef)
      photoUrls.push(url)
    }
    
    return photoUrls
  } catch (error: any) {
    console.error('Error fetching photos:', error)
    // If folder doesn't exist, return empty array
    if (error.code === 'storage/object-not-found') {
      return []
    }
    throw new Error(`Failed to fetch photos: ${error.message}`)
  }
}

/**
 * Delete a photo from Firebase Storage
 * @param photoUrl - The full storage path or download URL
 */
export async function deleteJobPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract the path from the URL or use as-is
    const photoRef = ref(storage, photoUrl)
    await deleteObject(photoRef)
  } catch (error: any) {
    console.error('Error deleting photo:', error)
    throw new Error(`Failed to delete photo: ${error.message}`)
  }
}

