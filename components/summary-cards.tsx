"use client"

import { TrendingUp, TrendingDown, Wallet, BarChart3, Tag, FileText, PiggyBank, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, type FinanceSummary } from "@/lib/finance"

interface SummaryCardsProps {
  summary: FinanceSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Entradas Reais",
      value: formatCurrency(summary.totalIncome),
      icon: TrendingUp,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
      subtitle: null as string | null,
      badge: null as string | null,
    },
    {
      label: "Gastos Reais",
      value: formatCurrency(Math.abs(summary.totalExpense)),
      icon: TrendingDown,
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-500 dark:text-red-400",
      valueColor: "text-red-500 dark:text-red-400",
      subtitle: null,
      badge: null,
    },
    {
      label: "Saldo",
      value: formatCurrency(summary.balance),
      icon: Wallet,
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: summary.balance >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-500 dark:text-red-400",
      subtitle: null,
      badge: null,
    },
    {
      label: "Investido",
      value: formatCurrency(summary.totalInvested ?? 0),
      icon: PiggyBank,
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueColor: "text-amber-600 dark:text-amber-400",
      subtitle: null,
      badge:
        (summary.investmentCount ?? 0) > 0
          ? `${summary.investmentCount} movim.`
          : null,
    },
    {
      label: "Estornos",
      value: formatCurrency(summary.totalReversals ?? 0),
      icon: RotateCcw,
      iconBg: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-500 dark:text-violet-400",
      valueColor: "text-violet-500 dark:text-violet-400",
      subtitle: null,
      badge:
        (summary.reversalCount ?? 0) > 0
          ? `${summary.reversalCount} evento${summary.reversalCount !== 1 ? "s" : ""}`
          : null,
    },
    {
      label: "Media Mensal",
      value: formatCurrency(summary.monthlyAverage),
      icon: BarChart3,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      valueColor: "text-foreground",
      subtitle: "gastos reais",
      badge: null,
    },
    {
      label: "Maior Categoria",
      value: summary.topCategory,
      icon: Tag,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/40",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      valueColor: "text-foreground",
      subtitle: formatCurrency(summary.topCategoryAmount),
      badge: null,
    },
    {
      label: "Transacoes",
      value: String(summary.transactionCount),
      icon: FileText,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      valueColor: "text-foreground",
      subtitle: null,
      badge: null,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Aviso se há estornos/investimentos que foram excluídos dos gastos */}
      {((summary.totalReversals ?? 0) > 0 || (summary.totalInvested ?? 0) > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-800/30 bg-amber-950/15 px-3 py-2">
          <span className="text-xs text-amber-400 font-medium">ℹ️ Filtro aplicado:</span>
          {(summary.totalInvested ?? 0) > 0 && (
            <Badge variant="outline" className="text-[10px] border-amber-700/50 text-amber-400 gap-1">
              🏦 {formatCurrency(summary.totalInvested)} em investimentos excluídos dos gastos
            </Badge>
          )}
          {(summary.totalReversals ?? 0) > 0 && (
            <Badge variant="outline" className="text-[10px] border-violet-700/50 text-violet-400 gap-1">
              ↩️ {formatCurrency(summary.totalReversals)} em estornos/cancelamentos excluídos
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {cards.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="flex flex-col gap-2.5 p-3.5">
              <div className="flex items-center gap-1.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                  {card.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-bold ${card.valueColor} truncate`}>
                  {card.value}
                </span>
                {card.subtitle && (
                  <span className="text-[10px] text-muted-foreground">{card.subtitle}</span>
                )}
                {card.badge && (
                  <Badge variant="secondary" className="w-fit text-[9px] px-1.5 py-0 mt-0.5">
                    {card.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}