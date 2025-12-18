'use client'

export default function MileageSurgePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Automatic Mileage Surge</h1>
        <p className="text-foreground/70">Configure automatic mileage price surge based on job booking proximity</p>
      </div>
      <div className="bg-base border border-accent/20 rounded-lg p-6">
        <p className="text-foreground/70">Automatic mileage surge configuration will be implemented here.</p>
        <p className="text-foreground/50 text-sm mt-2">Configure surge pricing when jobs are booked 2 days before and are a certain distance away.</p>
      </div>
    </div>
  )
}

