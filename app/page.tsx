"use client"

import { useState, useCallback } from "react"
import { FileUpload } from "@/components/file-upload"
import { SummaryCards } from "@/components/summary-cards"
import { TransactionList } from "@/components/transaction-list"
import { MonthlySummary } from "@/components/monthly-summary"
import { CategoryChart } from "@/components/category-chart"
import { MonthlyChart } from "@/components/monthly-chart"
import { ExpenseLineChart } from "@/components/expense-line-chart"
import { InvestmentSimulator } from "@/components/investment-simulator"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  parseCSV,
  normalizeData,
  groupByMonth,
  groupByCategory,
  computeSummary,
  type Transaction,
  type MonthlyData,
  type CategoryData,
  type FinanceSummary,
} from "@/lib/finance"
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Upload,
  PieChart,
  Menu,
} from "lucide-react"

type ActivePage = "dashboard" | "gastos" | "graficos" | "investimentos" | "upload"

const NAV_ITEMS: { id: ActivePage; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "gastos", label: "Gastos", icon: FileText },
  { id: "graficos", label: "Graficos", icon: PieChart },
  { id: "investimentos", label: "Investimentos", icon: TrendingUp },
  { id: "upload", label: "Upload CSV", icon: Upload },
]

function EmptyState({ icon: Icon, title, description }: { icon: typeof LayoutDashboard; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function SidebarNav({
  activePage,
  onNavigate,
  hasData,
}: {
  activePage: ActivePage
  onNavigate: (page: ActivePage) => void
  hasData: boolean
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = activePage === item.id
        const isDisabled = !hasData && item.id !== "upload" && item.id !== "investimentos"
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => !isDisabled && onNavigate(item.id)}
            disabled={isDisabled}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : isDisabled
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({})
  const [categoryData, setCategoryData] = useState<CategoryData>({})
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [hasData, setHasData] = useState(false)
  const [activePage, setActivePage] = useState<ActivePage>("upload")
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleFileLoaded = useCallback((content: string) => {
    const rawData = parseCSV(content)
    const normalized = normalizeData(rawData)
    const monthly = groupByMonth(normalized)
    const category = groupByCategory(normalized)
    const summaryData = computeSummary(normalized, monthly, category)

    setTransactions(normalized)
    setMonthlyData(monthly)
    setCategoryData(category)
    setSummary(summaryData)
    setHasData(true)
    setActivePage("dashboard")
  }, [])

  const handleNavigate = useCallback((page: ActivePage) => {
    setActivePage(page)
    setMobileOpen(false)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4 pt-8">
                <div className="flex items-center gap-3 mb-6 px-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <BarChart3 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-base font-bold text-foreground">Financas</span>
                </div>
                <SidebarNav activePage={activePage} onNavigate={handleNavigate} hasData={hasData} />
              </SheetContent>
            </Sheet>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-base font-bold text-foreground sm:text-lg">
              Controle Financeiro
            </h1>
          </div>

          {/* Desktop top nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id
              const isDisabled = !hasData && item.id !== "upload" && item.id !== "investimentos"
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !isDisabled && handleNavigate(item.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDisabled
                        ? "text-muted-foreground/50 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* UPLOAD PAGE */}
        {activePage === "upload" && (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
                Analise suas financas de forma simples
              </h2>
              <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
                Envie o extrato do seu banco em formato CSV e veja um resumo
                completo dos seus gastos, com graficos interativos e simulacao de investimentos.
              </p>
            </section>
            <FileUpload onFileLoaded={handleFileLoaded} />
          </div>
        )}

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <div className="flex flex-col gap-6">
            {summary ? (
              <>
                <SummaryCards summary={summary} />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <CategoryChart data={categoryData} />
                  <MonthlyChart data={monthlyData} />
                </div>
                <MonthlySummary data={monthlyData} />
              </>
            ) : (
              <EmptyState
                icon={LayoutDashboard}
                title="Nenhum dado disponivel"
                description="Faca o upload de um arquivo CSV na aba Upload CSV para visualizar o resumo dos seus gastos."
              />
            )}
          </div>
        )}

        {/* GASTOS (Transactions) */}
        {activePage === "gastos" && (
          <div className="flex flex-col gap-6">
            {hasData ? (
              <>
                <TransactionList transactions={transactions} />
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="Nenhuma transacao encontrada"
                description="Faca o upload de um arquivo CSV para visualizar suas transacoes."
              />
            )}
          </div>
        )}

        {/* GRAFICOS (Charts) */}
        {activePage === "graficos" && (
          <div className="flex flex-col gap-6">
            {hasData ? (
              <>
                <CategoryChart data={categoryData} />
                <MonthlyChart data={monthlyData} />
                <ExpenseLineChart transactions={transactions} />
              </>
            ) : (
              <EmptyState
                icon={PieChart}
                title="Nenhum grafico disponivel"
                description="Faca o upload de um arquivo CSV para gerar graficos interativos dos seus gastos."
              />
            )}
          </div>
        )}

        {/* INVESTIMENTOS */}
        {activePage === "investimentos" && (
          <InvestmentSimulator />
        )}
      </div>
    </main>
  )
}
