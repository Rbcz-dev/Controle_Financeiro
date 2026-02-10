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
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-600",
    },
    {
      label: "Total Gastos",
      value: formatCurrency(Math.abs(summary.totalExpense)),
      icon: TrendingDown,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      valueColor: "text-red-500",
    },
    {
      label: "Saldo",
      value: formatCurrency(summary.balance),
      icon: Wallet,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: summary.balance >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Media Mensal",
      value: formatCurrency(summary.monthlyAverage),
      icon: BarChart3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-foreground",
    },
    {
      label: "Maior Categoria",
      value: summary.topCategory,
      subtitle: formatCurrency(summary.topCategoryAmount),
      icon: Tag,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      valueColor: "text-foreground",
    },
    {
      label: "Transacoes",
      value: String(summary.transactionCount),
      icon: FileText,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
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
