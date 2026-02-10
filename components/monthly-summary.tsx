"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthlyData } from "@/lib/finance"
import { formatCurrency } from "@/lib/finance"

interface MonthlySummaryProps {
  data: MonthlyData
}

const monthNames: Record<string, string> = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Marco",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
}

function formatMonth(key: string): string {
  const [year, month] = key.split("-")
  return `${monthNames[month] || month}/${year}`
}

export function MonthlySummary({ data }: MonthlySummaryProps) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b))

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Resumo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([month, values]) => (
            <div
              key={month}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4"
            >
              <span className="text-sm font-semibold text-foreground">
                {formatMonth(month)}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Entradas
                  </span>
                  <span className="text-xs font-medium text-emerald-600 tabular-nums">
                    {formatCurrency(values.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Saidas
                  </span>
                  <span className="text-xs font-medium text-red-500 tabular-nums">
                    {formatCurrency(values.expense)}
                  </span>
                </div>
                <div className="mt-1 border-t border-border pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Saldo
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${values.total >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {formatCurrency(values.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
