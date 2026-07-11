"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/lib/finance"
import { formatCurrency, groupByCategory } from "@/lib/finance"

// CategoryChart agora recebe transactions diretamente para poder filtrar por kind
interface CategoryChartProps {
  transactions: Transaction[]
}

const COLORS = [
  "#c8960c", "#3b82f6", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#22c55e",
]

type FilterMode = "expenses" | "all"

function CustomTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { pct: string } }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
      <p className="text-xs text-muted-foreground">{payload[0].payload.pct} do total</p>
    </div>
  )
}

export function CategoryChart({ transactions }: CategoryChartProps) {
  const [mode, setMode] = useState<FilterMode>("expenses")

  // Filtra transações conforme modo
  const filtered = transactions.filter((t) => {
    if (mode === "expenses") {
      const kind = t.kind ?? (t.type === "income" ? "income" : "expense")
      return kind === "expense"
    }
    // "all": inclui tudo exceto transferências
    const kind = t.kind ?? (t.type === "income" ? "income" : "expense")
    return kind !== "transfer"
  })

  const categoryData = groupByCategory(filtered)

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  const chartDataWithPct = chartData.map((item) => ({
    ...item,
    pct: total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "0%",
  }))

  // Conta quantas transações foram excluídas dos gastos reais
  const excluded = transactions.filter((t) => {
    const kind = t.kind ?? "expense"
    return kind === "investment" || kind === "transfer" || kind === "reversal"
  })

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Gastos por Categoria
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={mode === "expenses" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("expenses")}
              className="h-7 px-2.5 text-[11px]"
            >
              Só gastos reais
            </Button>
            <Button
              variant={mode === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("all")}
              className="h-7 px-2.5 text-[11px]"
            >
              Tudo
            </Button>
          </div>
        </div>

        {mode === "expenses" && excluded.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-[10px] text-muted-foreground">Excluídos automaticamente:</span>
            {excluded.filter((t) => (t.kind ?? "expense") === "investment").length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-700/40 text-amber-500">
                🏦 {excluded.filter((t) => (t.kind ?? "expense") === "investment").length} investimentos
              </Badge>
            )}
            {excluded.filter((t) => (t.kind ?? "expense") === "reversal").length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-700/40 text-violet-400">
                ↩️ {excluded.filter((t) => (t.kind ?? "expense") === "reversal").length} estornos
              </Badge>
            )}
            {excluded.filter((t) => (t.kind ?? "expense") === "transfer").length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-700/40 text-blue-400">
                ↔️ {excluded.filter((t) => (t.kind ?? "expense") === "transfer").length} transferências
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma transação encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 md:flex-row">
            {/* Donut */}
            <div className="h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataWithPct}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartDataWithPct.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda */}
            <div className="flex flex-1 flex-col gap-1.5 min-w-0">
              {chartDataWithPct.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                    <span className="text-xs text-foreground truncate">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground tabular-nums">{item.pct}</span>
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-1 pt-1.5 border-t border-border flex justify-between">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xs font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}