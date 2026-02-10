"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthlyData } from "@/lib/finance"
import { formatCurrency } from "@/lib/finance"

interface MonthlyChartProps {
  data: MonthlyData
}

const monthShortNames: Record<string, string> = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  "10": "Out",
  "11": "Nov",
  "12": "Dez",
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
          <p
            key={item.dataKey}
            className={`text-sm ${item.dataKey === "income" ? "text-emerald-600" : "text-red-500"}`}
          >
            {item.dataKey === "income" ? "Entradas" : "Saidas"}:{" "}
            {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => {
      const [year, month] = key.split("-")
      return {
        name: `${monthShortNames[month] || month}/${year.slice(2)}`,
        income: values.income,
        expense: Math.abs(values.expense),
      }
    })

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Entradas vs Saidas por Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(220, 13%, 91%)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(220, 10%, 46%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) =>
                  `R$${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="income"
                fill="#0d9668"
                radius={[4, 4, 0, 0]}
                name="Entradas"
              />
              <Bar
                dataKey="expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name="Saidas"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-emerald-600" />
            <span className="text-xs text-muted-foreground">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-xs text-muted-foreground">Saidas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
