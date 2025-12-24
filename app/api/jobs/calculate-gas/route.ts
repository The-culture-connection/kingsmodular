import { NextRequest, NextResponse } from 'next/server'
import { calculateAndUpdateGasForJobAdmin, findAffectedJobsForRecalculation } from '@/lib/firebase/gasPricing'
import { getFirebaseAdminApp } from '@/lib/firebase/firebaseAdmin'

/**
 * API route to calculate gas pricing for a job
 * This runs server-side so we can use GOOGLE_MAPS_API_KEY securely
 * Uses Admin SDK to bypass Firestore security rules
 * 
 * Also recalculates affected jobs (jobs that start 1-2 days after this job's end date)
 */
export async function POST(request: NextRequest) {
  const logPrefix = '🔵 [API_CALC_GAS]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Gas calculation API request received`)
  console.log(`${logPrefix} ========================================`)
  
  try {
    const body = await request.json()
    const { jobId, recalculateAffected = true } = body

    if (!jobId) {
      console.error(`${logPrefix} ❌ Job ID is required`)
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    console.log(`${logPrefix} Job ID: ${jobId}`)
    console.log(`${logPrefix} Recalculate affected jobs: ${recalculateAffected}`)

    // Step 1: Calculate gas for the requested job
    console.log(`${logPrefix} Step 1: Calculating gas for job ${jobId}...`)
    await calculateAndUpdateGasForJobAdmin(jobId)
    console.log(`${logPrefix} ✅ Step 1 complete`)

    // Step 2: Find and recalculate affected jobs (if requested)
    if (recalculateAffected) {
      console.log(`${logPrefix} Step 2: Finding affected jobs...`)
      
      try {
        const adminApp = getFirebaseAdminApp()
        const db = adminApp.firestore()
        
        // Get the job we just calculated to find its dates
        const jobDoc = await db.collection('jobs').doc(jobId).get()
        if (jobDoc.exists) {
          const jobData = jobDoc.data()!
          const dateRange = jobData.dateRange || {}
          
          if (dateRange.start && dateRange.end) {
            const startDate = typeof dateRange.start === 'string'
              ? new Date(dateRange.start)
              : (dateRange.start.toDate ? dateRange.start.toDate() : new Date(dateRange.start))
            
            const endDate = typeof dateRange.end === 'string'
              ? new Date(dateRange.end)
              : (dateRange.end.toDate ? dateRange.end.toDate() : new Date(dateRange.end))
            
            console.log(`${logPrefix} Job dates:`, {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            })
            
            // Find affected jobs
            const affectedJobIds = await findAffectedJobsForRecalculation(
              jobId,
              startDate,
              endDate,
              db
            )
            
            if (affectedJobIds.length > 0) {
              console.log(`${logPrefix} Step 3: Recalculating ${affectedJobIds.length} affected job(s)...`)
              
              // Recalculate each affected job
              for (const affectedJobId of affectedJobIds) {
                try {
                  console.log(`${logPrefix} Recalculating affected job: ${affectedJobId}`)
                  await calculateAndUpdateGasForJobAdmin(affectedJobId)
                  console.log(`${logPrefix} ✅ Recalculated: ${affectedJobId}`)
                } catch (recalcError: any) {
                  console.error(`${logPrefix} ⚠️ Failed to recalculate ${affectedJobId}:`, recalcError.message)
                  // Continue with other jobs even if one fails
                }
              }
              
              console.log(`${logPrefix} ✅ Step 3 complete - Recalculated ${affectedJobIds.length} job(s)`)
            } else {
              console.log(`${logPrefix} No affected jobs found`)
            }
          } else {
            console.log(`${logPrefix} ⚠️ Job missing dateRange, skipping affected jobs check`)
          }
        }
      } catch (affectedError: any) {
        console.error(`${logPrefix} ⚠️ Error finding/recalculating affected jobs (non-critical):`, affectedError.message)
        // Don't fail the request if affected jobs recalculation fails
      }
    }

    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} ✅ Gas calculation completed successfully`)
    console.log(`${logPrefix} ========================================`)

    return NextResponse.json({
      success: true,
      message: 'Gas calculation completed successfully',
      jobId,
    })
  } catch (error: any) {
    console.error(`${logPrefix} ========================================`)
    console.error(`${logPrefix} ❌ Error calculating gas:`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
    })
    console.error(`${logPrefix} ========================================`)
    
    return NextResponse.json(
      { error: error.message || 'Failed to calculate gas pricing' },
      { status: 500 }
    )
  }
}

