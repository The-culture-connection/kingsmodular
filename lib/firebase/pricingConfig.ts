import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export interface GasPricingConfig {
  enabled: boolean
  officeAddress: string
  gasPricePerGallon: number
  mpg: number
  surge: {
    enabled: boolean
    milesThreshold: number
    multiplier: number
  }
  pricingMode: 'FULL_SURGE' | 'INCREMENT_ONLY'
  updatedAt?: any
}

const PRICING_CONFIG_COLLECTION = 'pricingConfig'
const GAS_CONFIG_DOC_ID = 'gas'

const DEFAULT_CONFIG: GasPricingConfig = {
  enabled: true,
  officeAddress: '6407 US - 50, Holton, IN 47023',
  gasPricePerGallon: 5,
  mpg: 20,
  surge: {
    enabled: true,
    milesThreshold: 200,
    multiplier: 2.0,
  },
  pricingMode: 'FULL_SURGE',
}

/**
 * Get gas pricing configuration
 */
export async function getGasPricingConfig(): Promise<GasPricingConfig> {
  try {
    const configRef = doc(db, PRICING_CONFIG_COLLECTION, GAS_CONFIG_DOC_ID)
    const configDoc = await getDoc(configRef)
    
    if (configDoc.exists()) {
      return configDoc.data() as GasPricingConfig
    }
    
    // Return default if not exists
    return DEFAULT_CONFIG
  } catch (error: any) {
    console.error('Error fetching gas pricing config:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Update gas pricing configuration
 */
export async function updateGasPricingConfig(config: Partial<GasPricingConfig>): Promise<void> {
  try {
    const configRef = doc(db, PRICING_CONFIG_COLLECTION, GAS_CONFIG_DOC_ID)
    const currentConfig = await getGasPricingConfig()
    
    await setDoc(configRef, {
      ...currentConfig,
      ...config,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error: any) {
    console.error('Error updating gas pricing config:', error)
    throw new Error(`Failed to update gas pricing config: ${error.message}`)
  }
}

