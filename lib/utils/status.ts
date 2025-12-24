/**
 * Status mapping between Firebase database values and frontend display labels
 * Firebase DB -> Frontend Display
 */
export const STATUS_DISPLAY_MAP: Record<string, string> = {
  'pending': 'Pending Approval',
  'draft': 'Draft',
  'approved': 'In Progress',
  'completed': 'Closed',
  'paid': 'Paid',
}

/**
 * Get display label for a Firebase status value
 */
export function getStatusDisplayLabel(status: string): string {
  return STATUS_DISPLAY_MAP[status] || status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * Get Firebase status value from display label (reverse lookup)
 */
export function getStatusFromDisplay(displayLabel: string): string | null {
  const entry = Object.entries(STATUS_DISPLAY_MAP).find(([_, label]) => label === displayLabel)
  return entry ? entry[0] : null
}

