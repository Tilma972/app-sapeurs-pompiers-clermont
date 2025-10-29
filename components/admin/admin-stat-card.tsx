import { ReactNode } from "react"
import { KpiCard } from "@/components/kpi-card"

export function AdminStatCard({ title, value, subtitle }: { title: string; value: ReactNode; subtitle?: string }) {
  return <KpiCard title={title} value={value} subtitle={subtitle} />
}
