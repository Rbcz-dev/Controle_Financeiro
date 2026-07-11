"use client"

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { MonthlyData } from "@/lib/finance"
import { formatCurrency } from "@/lib/finance"

interface MonthlyChartProps {
  data: MonthlyData
}

const MONTH_SHORT: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
}

type ViewMode = "all" | "expenses" | "investments"

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const labels: Record<string, string> = {
    income: "Entradas reais",
    expense: "Gastos reais",
    investment: "Investido",
    reversal: "Estornos/cancelamentos",
  }
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg min-w-[180px]">
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex justify-between gap-4 text-xs mb-1">
          <span style={{ color: item.color }}>{labels[item.dataKey] ?? item.dataKey}</span>
          <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const [mode, setMode] = useState<ViewMode>("all")

  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => {
      const [year, month] = key.split("-")
      return {
        name: `${MONTH_SHORT[month] ?? month}/${year.slice(2)}`,
        income: values.income,
        expense: Math.abs(values.expense),
        investment: Math.abs(values.investment ?? 0),
        reversal: values.reversal ?? 0,
      }
    })

  const hasInvestments = chartData.some((d) => d.investment > 0)
  const hasReversals = chartData.some((d) => d.reversal > 0)

  const bars = {
    all: (
      <>
        <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="expense" name="Gastos reais" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
        {hasInvestments && (
          <Bar dataKey="investment" name="Investido" fill="#c8960c" radius={[3, 3, 0, 0]} maxBarSize={32} />
        )}
        {hasReversals && (
          <Bar dataKey="reversal" name="Estornos" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={32} />
        )}
      </>
    ),
    expenses: (
      <>
        <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={40} />
        <Bar dataKey="expense" name="Gastos reais" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={40} />
      </>
    ),
    investments: (
      <>
        <Bar dataKey="investment" name="Investido" fill="#c8960c" radius={[3, 3, 0, 0]} maxBarSize={40} />
        {hasReversals && (
          <Bar dataKey="reversal" name="Estornos" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={40} />
        )}
      </>
    ),
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Movimentação por Mês
          </CardTitle>
          <div className="flex gap-1">
            {(["all", "expenses", "investments"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                variant={mode === v ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode(v)}
                className="h-7 px-2.5 text-[11px]"
              >
                {v === "all" ? "Tudo" : v === "expenses" ? "Renda/Gastos" : "Investimentos"}
              </Button>
            ))}
          </div>
        </div>
        {mode === "all" && hasInvestments && (
          <p className="text-[11px] text-muted-foreground">
            💡 Movimentações de investimento (dourado) estão separadas dos gastos reais (vermelho)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {bars[mode]}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Entradas reais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            <span className="text-xs text-muted-foreground">Gastos reais</span>
          </div>
          {hasInvestments && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span className="text-xs text-muted-foreground">Investido</span>
            </div>
          )}
          {hasReversals && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
              <span className="text-xs text-muted-foreground">Estornos</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}