/**
 * Distance calculation using Google Maps Distance Matrix API
 * 
 * Environment variables needed:
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (for client-side)
 * - GOOGLE_MAPS_API_KEY (for server-side)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export interface GeocodeResult {
  lat: number
  lng: number
  formattedAddress: string
}

export interface DistanceResult {
  distanceMiles: number
  durationMinutes?: number
}

const GEO_CACHE_COLLECTION = 'geoCache'

/**
 * Hash an address for cache key
 */
function hashAddress(address: string): string {
  // Simple hash function - in production, use a proper hash
  return Buffer.from(address.toLowerCase().trim()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 50)
}

/**
 * Get cached geocode result
 */
async function getCachedGeocode(address: string): Promise<GeocodeResult | null> {
  try {
    const addressHash = hashAddress(address)
    const cacheRef = doc(db, GEO_CACHE_COLLECTION, addressHash)
    const cacheDoc = await getDoc(cacheRef)
    
    if (cacheDoc.exists()) {
      const data = cacheDoc.data()
      // Check if cache is less than 30 days old
      const cacheAge = Date.now() - (data.updatedAt?.toDate?.()?.getTime() || 0)
      if (cacheAge < 30 * 24 * 60 * 60 * 1000) {
        return {
          lat: data.lat,
          lng: data.lng,
          formattedAddress: data.formattedAddress || address,
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error getting cached geocode:', error)
    return null
  }
}

/**
 * Cache geocode result
 */
async function cacheGeocode(address: string, result: GeocodeResult): Promise<void> {
  try {
    const addressHash = hashAddress(address)
    const cacheRef = doc(db, GEO_CACHE_COLLECTION, addressHash)
    await setDoc(cacheRef, {
      address: address,
      lat: result.lat,
      lng: result.lng,
      formattedAddress: result.formattedAddress,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error('Error caching geocode:', error)
    // Non-critical error, don't throw
  }
}

/**
 * Geocode an address using Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Check cache first
  const cached = await getCachedGeocode(address)
  if (cached) {
    return cached
  }

  try {
    // Use server-side API key if available, otherwise client-side
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
      return null
    }

    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const location = result.geometry.location
      
      const geocodeResult: GeocodeResult = {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
      }
      
      // Cache the result
      await cacheGeocode(address, geocodeResult)
      
      return geocodeResult
    } else {
      console.error('Geocoding API error:', data.status, data.error_message)
      return null
    }
  } catch (error: any) {
    console.error('Error geocoding address:', error)
    return null
  }
}

/**
 * Calculate driving distance between two addresses using Google Maps Distance Matrix API
 */
export async function calculateDrivingDistance(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  console.log('🔵 [DISTANCE API] calculateDrivingDistance called:', { origin, destination })
  
  try {
    // Use server-side API key if available, otherwise client-side
    // In server-side context (API routes), process.env.GOOGLE_MAPS_API_KEY is available
    // In client-side context, we need NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.error('❌ [DISTANCE API] Google Maps API key not found. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
      console.log('🔍 [DISTANCE API] Environment check:', {
        hasServerKey: !!process.env.GOOGLE_MAPS_API_KEY,
        hasClientKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      })
      return {
        distanceMiles: 0,
        durationMinutes: 0,
      }
    }
    
    console.log('✅ [DISTANCE API] API key found (length:', apiKey.length, ')')

    const encodedOrigin = encodeURIComponent(origin)
    const encodedDestination = encodeURIComponent(destination)
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&units=imperial&key=${apiKey}`
    
    console.log('🌐 [DISTANCE API] Calling Distance Matrix API...')
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('📥 [DISTANCE API] API Response status:', data.status)
    
    if (data.status === 'OK' && data.rows && data.rows.length > 0) {
      const row = data.rows[0]
      if (row.elements && row.elements.length > 0) {
        const element = row.elements[0]
        
        if (element.status === 'OK') {
          // Distance is returned in meters, convert to miles
          const distanceMeters = element.distance.value
          const distanceMiles = distanceMeters * 0.000621371
          
          // Duration is returned in seconds, convert to minutes
          const durationSeconds = element.duration.value
          const durationMinutes = durationSeconds / 60
          
          console.log('✅ [DISTANCE API] Success! Distance:', distanceMiles, 'miles (', distanceMeters, 'meters )')
          
          return {
            distanceMiles: Math.round(distanceMiles * 100) / 100, // Round to 2 decimal places
            durationMinutes: Math.round(durationMinutes * 10) / 10, // Round to 1 decimal place
          }
        } else {
          console.error('❌ [DISTANCE API] Distance Matrix API element error:', element.status)
          return null
        }
      } else {
        console.error('❌ [DISTANCE API] No elements in response')
        return null
      }
    } else {
      console.error('❌ [DISTANCE API] Distance Matrix API error:', data.status, data.error_message)
      return null
    }
  } catch (error: any) {
    console.error('❌ [DISTANCE API] Error calculating driving distance:', error)
    return null
  }
}

