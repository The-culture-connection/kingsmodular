'use client'

export default function CostBreakdownPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Cost Breakdown</h1>
        <p className="text-foreground/70">View detailed cost breakdown for job close-out</p>
      </div>
      <div className="bg-base border border-accent/20 rounded-lg p-6">
        <p className="text-foreground/70 mb-4">Cost breakdown will include:</p>
        <ul className="list-disc list-inside space-y-2 text-foreground/70">
          <li>Payroll costs</li>
          <li>Gas expenses</li>
          <li>Food expenses</li>
          <li>Other expenses (editable from database)</li>
        </ul>
      </div>
    </div>
  )
}

