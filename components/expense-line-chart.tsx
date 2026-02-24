"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Transaction } from "@/lib/finance"
import { formatCurrency } from "@/lib/finance"

interface ExpenseLineChartProps {
  transactions: Transaction[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((item) => (
          <p key={item.dataKey} className="text-sm text-red-500">
            Gastos: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ExpenseLineChart({ transactions }: ExpenseLineChartProps) {
  // Group expenses by day
  const dailyExpenses: Record<string, number> = {}

  for (const t of transactions) {
    if (t.type !== "expense") continue
    const key = t.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    if (!dailyExpenses[key]) dailyExpenses[key] = 0
    dailyExpenses[key] += Math.abs(t.amount)
  }

  // Build cumulative chart data sorted by date
  const expenseTransactions = transactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const dateMap = new Map<string, number>()
  let cumulative = 0
  for (const t of expenseTransactions) {
    cumulative += Math.abs(t.amount)
    const key = t.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    dateMap.set(key, cumulative)
  }

  const chartData = Array.from(dateMap.entries()).map(([date, total]) => ({
    date,
    total,
  }))

  if (chartData.length === 0) return null

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Gastos Acumulados ao Longo do Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
