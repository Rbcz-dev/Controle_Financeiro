"use client"

import { TrendingUp, TrendingDown, Wallet, BarChart3, Tag, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, type FinanceSummary } from "@/lib/finance"

interface SummaryCardsProps {
  summary: FinanceSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Entradas",
      value: formatCurrency(summary.totalIncome),
      icon: TrendingUp,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Gastos",
      value: formatCurrency(Math.abs(summary.totalExpense)),
      icon: TrendingDown,
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-500 dark:text-red-400",
      valueColor: "text-red-500 dark:text-red-400",
    },
    {
      label: "Saldo",
      value: formatCurrency(summary.balance),
      icon: Wallet,
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: summary.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
    },
    {
      label: "Media Mensal",
      value: formatCurrency(summary.monthlyAverage),
      icon: BarChart3,
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: "text-foreground",
    },
    {
      label: "Maior Categoria",
      value: summary.topCategory,
      subtitle: formatCurrency(summary.topCategoryAmount),
      icon: Tag,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      valueColor: "text-foreground",
    },
    {
      label: "Transacoes",
      value: String(summary.transactionCount),
      icon: FileText,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      valueColor: "text-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card border-border">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                {card.label}
              </span>
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-bold ${card.valueColor} truncate`}>
                {card.value}
              </span>
              {card.subtitle && (
                <span className="text-xs text-muted-foreground">{card.subtitle}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
