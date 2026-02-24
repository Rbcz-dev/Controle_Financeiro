"use client"

import { useState, useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  simulateInvestment,
  formatCurrency,
  INVESTMENT_RATES,
  type InvestmentType,
  type InvestmentPoint,
} from "@/lib/finance"
import { Calculator, TrendingUp, HelpCircle, Info } from "lucide-react"

const TYPE_COLORS: Record<InvestmentType, string> = {
  selic: "#c8960c",
  cdi: "#3b82f6",
  ipca: "#22c55e",
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string; payload: InvestmentPoint }>
}) {
  if (active && payload && payload.length) {
    const point = payload[0].payload
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{point.label || `Mes ${point.month}`}</p>
        {payload.map((item) => (
          <p key={item.dataKey} className="text-sm" style={{ color: item.color }}>
            {item.dataKey === "invested" ? "Investido" : "Valor"}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex ml-1" aria-label="Informacao">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px]">
        <p className="text-xs leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function InvestmentSimulator() {
  const [initialValue, setInitialValue] = useState(10000)
  const [monthlyContribution, setMonthlyContribution] = useState(500)
  const [months, setMonths] = useState(24)
  const [selectedType, setSelectedType] = useState<InvestmentType>("selic")
  const [compareAll, setCompareAll] = useState(false)
  const [customRates, setCustomRates] = useState<Record<InvestmentType, number>>({
    selic: INVESTMENT_RATES.selic.rate,
    cdi: INVESTMENT_RATES.cdi.rate,
    ipca: INVESTMENT_RATES.ipca.rate,
  })

  function handleRateChange(type: InvestmentType, value: string) {
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setCustomRates((prev) => ({ ...prev, [type]: parsed }))
    }
  }

  function resetRates() {
    setCustomRates({
      selic: INVESTMENT_RATES.selic.rate,
      cdi: INVESTMENT_RATES.cdi.rate,
      ipca: INVESTMENT_RATES.ipca.rate,
    })
  }

  const hasCustomRates =
    customRates.selic !== INVESTMENT_RATES.selic.rate ||
    customRates.cdi !== INVESTMENT_RATES.cdi.rate ||
    customRates.ipca !== INVESTMENT_RATES.ipca.rate

  const results = useMemo(() => {
    if (compareAll) {
      return {
        selic: simulateInvestment(initialValue, monthlyContribution, months, customRates.selic),
        cdi: simulateInvestment(initialValue, monthlyContribution, months, customRates.cdi),
        ipca: simulateInvestment(initialValue, monthlyContribution, months, customRates.ipca),
      }
    }
    return {
      [selectedType]: simulateInvestment(
        initialValue,
        monthlyContribution,
        months,
        customRates[selectedType],
      ),
    }
  }, [initialValue, monthlyContribution, months, selectedType, compareAll, customRates])

  const primaryResult = results[selectedType] || Object.values(results)[0]
  const finalValue = primaryResult ? primaryResult[primaryResult.length - 1].value : 0
  const totalInvested = primaryResult ? primaryResult[primaryResult.length - 1].invested : 0
  const totalReturn = finalValue - totalInvested
  const returnPercentage = totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(2) : "0"

  // Merge data for comparison chart
  const chartData = useMemo(() => {
    const primary = Object.values(results)[0]
    if (!primary) return []

    return primary.map((point, i) => {
      const merged: Record<string, unknown> = {
        month: point.month,
        label: point.label,
        invested: point.invested,
      }
      for (const [type, data] of Object.entries(results)) {
        merged[type] = data[i]?.value ?? 0
      }
      return merged
    })
  }, [results])

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  return (
    <TooltipProvider>
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Simulacao de Investimentos
              </CardTitle>
            </div>
            <Button
              variant={compareAll ? "default" : "outline"}
              size="sm"
              onClick={() => setCompareAll(!compareAll)}
              className="text-xs gap-1.5"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {compareAll ? "Comparando todos" : "Comparar tipos"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Investment type selector with editable rates */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo de Investimento</Label>
                  <InfoTooltip text="Escolha o tipo de renda fixa para simular. Voce pode editar as taxas de rendimento de cada tipo." />
                </div>
                {hasCustomRates && (
                  <Button variant="ghost" size="sm" onClick={resetRates} className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
                    Restaurar taxas padroes
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(Object.entries(INVESTMENT_RATES) as [InvestmentType, typeof INVESTMENT_RATES.selic][]).map(
                  ([type, info]) => {
                    const isSelected = selectedType === type
                    const isCustom = customRates[type] !== info.rate
                    return (
                      <div
                        key={type}
                        className={`relative flex flex-col gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-muted-foreground/30"
                        }`}
                        onClick={() => setSelectedType(type)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedType(type)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: TYPE_COLORS[type] }}
                            />
                            <span className="text-sm font-medium text-foreground">{info.name}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="inline-flex" aria-label={`Info ${info.name}`} onClick={(e) => e.stopPropagation()}>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px]">
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs font-medium">{info.name} - Padrao: {info.rate}% ao ano</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {isCustom && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-warning border-warning/30">
                              Editado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <Input
                            type="number"
                            step={0.01}
                            min={0}
                            max={100}
                            value={customRates[type]}
                            onChange={(e) => handleRateChange(type, e.target.value)}
                            className="h-8 text-sm font-semibold bg-card w-full"
                            aria-label={`Taxa ${info.name}`}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">% a.a.</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            Padrao: {info.rate}%
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Mensal: {(customRates[type] / 12).toFixed(3)}%
                          </span>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="investValue" className="text-xs text-muted-foreground">
                    Valor inicial (R$)
                  </Label>
                  <InfoTooltip text="Quanto voce tem para investir agora." />
                </div>
                <Input
                  id="investValue"
                  type="number"
                  min={0}
                  value={initialValue}
                  onChange={(e) => setInitialValue(Math.max(0, Number(e.target.value)))}
                  className="bg-background"
                />
                <Slider
                  value={[initialValue]}
                  onValueChange={([v]) => setInitialValue(v)}
                  min={0}
                  max={100000}
                  step={500}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="monthlyContrib" className="text-xs text-muted-foreground">
                    Aporte mensal (R$)
                  </Label>
                  <InfoTooltip text="Valor que voce vai adicionar todo mes ao investimento." />
                </div>
                <Input
                  id="monthlyContrib"
                  type="number"
                  min={0}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                  className="bg-background"
                />
                <Slider
                  value={[monthlyContribution]}
                  onValueChange={([v]) => setMonthlyContribution(v)}
                  min={0}
                  max={5000}
                  step={50}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="investMonths" className="text-xs text-muted-foreground">
                    Prazo (meses)
                  </Label>
                  <InfoTooltip text="Por quanto tempo voce pretende manter o investimento." />
                </div>
                <Input
                  id="investMonths"
                  type="number"
                  min={1}
                  max={360}
                  value={months}
                  onChange={(e) => setMonths(Math.min(360, Math.max(1, Number(e.target.value))))}
                  className="bg-background"
                />
                <Slider
                  value={[months]}
                  onValueChange={([v]) => setMonths(v)}
                  min={1}
                  max={360}
                  step={1}
                />
                <span className="text-[11px] text-muted-foreground">
                  {years > 0 && `${years} ano${years > 1 ? "s" : ""}`}
                  {years > 0 && remainingMonths > 0 && " e "}
                  {remainingMonths > 0 && `${remainingMonths} mes${remainingMonths > 1 ? "es" : ""}`}
                </span>
              </div>
            </div>

            {/* Results summary */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-background p-3">
                <span className="text-xs text-muted-foreground">Total investido</span>
                <p className="text-base font-bold text-foreground">
                  {formatCurrency(totalInvested)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Valor final</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {INVESTMENT_RATES[selectedType].name} {customRates[selectedType]}%
                  </Badge>
                </div>
                <p className="text-base font-bold text-success">
                  {formatCurrency(finalValue)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <span className="text-xs text-muted-foreground">Rendimento</span>
                <p className="text-base font-bold text-success">
                  {formatCurrency(totalReturn)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <span className="text-xs text-muted-foreground">Rentabilidade</span>
                <p className="text-base font-bold text-success">
                  {returnPercentage}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                      <linearGradient key={type} id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                    <linearGradient id="grad-invested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) =>
                      value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : `R$${value}`
                    }
                  />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#grad-invested)"
                    name="Investido"
                  />
                  {Object.entries(results).map(([type]) => (
                    <Area
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stroke={TYPE_COLORS[type as InvestmentType]}
                      strokeWidth={2}
                      fill={`url(#grad-${type})`}
                      name={INVESTMENT_RATES[type as InvestmentType].name}
                    />
                  ))}
                  <Legend
                    formatter={(value: string) => {
                      if (value === "invested") return "Total investido"
                      return INVESTMENT_RATES[value as InvestmentType]?.name ?? value
                    }}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Rates info */}
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Taxas utilizadas: SELIC {customRates.selic}% a.a. | CDI{" "}
                {customRates.cdi}% a.a. | IPCA+ {customRates.ipca}% a.a.
                {hasCustomRates && " (taxas editadas manualmente)"}
                {" "}Os valores sao simulacoes baseadas em taxas fixas e nao representam garantia de
                rendimento real. Consulte seu assessor de investimentos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
