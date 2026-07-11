"use client"

import { useState } from "react"
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Transaction } from "@/lib/finance"
import { formatCurrency } from "@/lib/finance"

interface ExpenseLineChartProps {
  transactions: Transaction[]
}

type ViewMode = "expenses" | "investments" | "balance"

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const labels: Record<string, string> = {
    gastos: "Gastos acumulados",
    investido: "Investido acumulado",
    saldo: "Saldo do período",
  }
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-xs mb-0.5" style={{ color: item.color }}>
          {labels[item.dataKey] ?? item.dataKey}: <strong>{formatCurrency(item.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export function ExpenseLineChart({ transactions }: ExpenseLineChartProps) {
  const [mode, setMode] = useState<ViewMode>("expenses")

  if (transactions.length === 0) return null

  // Separar por kind e ordenar por data
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())

  // Acumular por dia
  const dayMap = new Map<string, { gastos: number; investido: number; renda: number }>()
  let cumGastos = 0
  let cumInvestido = 0
  let cumRenda = 0

  for (const t of sorted) {
    const kind = t.kind ?? (t.type === "income" ? "income" : "expense")
    const key = t.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

    if (kind === "expense") cumGastos += Math.abs(t.amount)
    else if (kind === "investment" && t.amount < 0) cumInvestido += Math.abs(t.amount)
    else if (kind === "income") cumRenda += t.amount

    dayMap.set(key, { gastos: cumGastos, investido: cumInvestido, renda: cumRenda })
  }

  const chartData = Array.from(dayMap.entries()).map(([date, vals]) => ({
    date,
    gastos: vals.gastos,
    investido: vals.investido,
    saldo: vals.renda - vals.gastos,
  }))

  const totalGastos = cumGastos
  const totalInvestido = cumInvestido
  const saldoFinal = cumRenda - cumGastos

  const views = {
    expenses: (
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2}
          fill="url(#gradGastos)" dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
      </AreaChart>
    ),
    investments: (
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradInvest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8960c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c8960c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="investido" stroke="#c8960c" strokeWidth={2}
          fill="url(#gradInvest)" dot={false} activeDot={{ r: 4, fill: "#c8960c" }} />
      </AreaChart>
    ),
    balance: (
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" axisLine={false} tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="saldo" stroke={saldoFinal >= 0 ? "#22c55e" : "#ef4444"}
          strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    ),
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Evolução ao Longo do Tempo
          </CardTitle>
          <div className="flex gap-1">
            {(["expenses", "investments", "balance"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                variant={mode === v ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode(v)}
                className="h-7 px-2.5 text-[11px]"
              >
                {v === "expenses" ? "Gastos" : v === "investments" ? "Investido" : "Saldo"}
              </Button>
            ))}
          </div>
        </div>

        {/* Mini-resumo contextual */}
        <div className="flex flex-wrap gap-2 mt-1">
          {mode === "expenses" && (
            <Badge variant="outline" className="text-[10px] border-red-800/40 text-red-400">
              Acumulado: {formatCurrency(totalGastos)} (apenas gastos reais)
            </Badge>
          )}
          {mode === "investments" && (
            <Badge variant="outline" className="text-[10px] border-amber-800/40 text-amber-500">
              Total investido: {formatCurrency(totalInvestido)}
            </Badge>
          )}
          {mode === "balance" && (
            <Badge
              variant="outline"
              className={`text-[10px] ${saldoFinal >= 0
                ? "border-emerald-800/40 text-emerald-400"
                : "border-red-800/40 text-red-400"}`}
            >
              Saldo final: {formatCurrency(saldoFinal)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {views[mode]}
          </ResponsiveContainer>
        </div>
        {mode === "expenses" && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Investimentos, estornos e transferências foram excluídos deste gráfico
          </p>
        )}
      </CardContent>
    </Card>
  )
}