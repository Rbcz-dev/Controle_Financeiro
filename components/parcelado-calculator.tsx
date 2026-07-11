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
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CreditCard, Banknote, HelpCircle, Info, TrendingUp } from "lucide-react"

function fmtBRL(v: number): string {
  if (!isFinite(v)) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtPct(v: number, decimals = 2): string {
  return `${(v * 100).toFixed(decimals)}%`
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex ml-1" aria-label="Informação">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px]">
        <p className="text-xs leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-1">Mês {label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-sm" style={{ color: item.color }}>
          {item.dataKey === "saldo" ? "Saldo investido" : "Ponto de equilíbrio"}:{" "}
          {fmtBRL(item.value)}
        </p>
      ))}
    </div>
  )
}

type SimResult = {
  valorParcela: number
  totalPagoParcelado: number
  descontoVista: number
  saldoFinalParcelado: number
  taxaImplicitaMensal: number
  taxaImplicitaAnual: number
  melhorOpcao: "parcelado" | "vista"
  historico: Array<{ mes: number; saldo: number }>
  economiaOuCusto: number
}

function simular(
  precoParcelado: number,
  precoVista: number,
  numParcelas: number,
  taxaAnualInvest: number,
  jurosParcelaMensal: number
): SimResult {
  const taxaMensalInvest = Math.pow(1 + taxaAnualInvest / 100, 1 / 12) - 1

  // Valor de cada parcela
  let valorParcela: number
  if (jurosParcelaMensal > 0) {
    const r = jurosParcelaMensal / 100
    valorParcela = (precoParcelado * r) / (1 - Math.pow(1 + r, -numParcelas))
  } else {
    valorParcela = precoParcelado / numParcelas
  }

  // Simulação: mantém o valor à vista investido e paga parcelas mensalmente
  let saldo = precoVista
  const historico: Array<{ mes: number; saldo: number }> = []

  for (let mes = 1; mes <= numParcelas; mes++) {
    saldo = saldo * (1 + taxaMensalInvest)
    saldo = saldo - valorParcela
    historico.push({ mes, saldo })
  }

  const saldoFinalParcelado = saldo
  const totalPagoParcelado = valorParcela * numParcelas
  const descontoVista = precoParcelado - precoVista

  // Taxa implícita do desconto (breakeven) — busca binária
  let lo = 0, hi = 2
  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2
    let pv = 0
    for (let m = 1; m <= numParcelas; m++) {
      pv += valorParcela / Math.pow(1 + mid, m)
    }
    if (pv > precoVista) lo = mid
    else hi = mid
  }
  const taxaImplicitaMensal = (lo + hi) / 2
  const taxaImplicitaAnual = Math.pow(1 + taxaImplicitaMensal, 12) - 1

  const melhorOpcao: "parcelado" | "vista" = saldoFinalParcelado >= 0 ? "parcelado" : "vista"
  const economiaOuCusto = Math.abs(saldoFinalParcelado)

  return {
    valorParcela,
    totalPagoParcelado,
    descontoVista,
    saldoFinalParcelado,
    taxaImplicitaMensal,
    taxaImplicitaAnual,
    melhorOpcao,
    historico,
    economiaOuCusto,
  }
}

export function ParceladoCalculator() {
  const [precoParcelado, setPrecoParcelado] = useState(1200)
  const [precoVista, setPrecoVista] = useState(1080)
  const [numParcelas, setNumParcelas] = useState(12)
  const [taxaInvestimento, setTaxaInvestimento] = useState(13.65)
  const [jurosParcelamento, setJurosParcelamento] = useState(0)

  const result = useMemo(() => {
    if (precoParcelado <= 0 || precoVista <= 0 || numParcelas <= 0) return null
    return simular(precoParcelado, precoVista, numParcelas, taxaInvestimento, jurosParcelamento)
  }, [precoParcelado, precoVista, numParcelas, taxaInvestimento, jurosParcelamento])

  const isParcelado = result?.melhorOpcao === "parcelado"

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <CreditCard className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Parcelado vs À Vista</h2>
                <p className="text-xs text-muted-foreground">
                  Simula se vale mais pagar à vista com desconto ou parcelar e manter o dinheiro investido
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Inputs */}
          <Card className="bg-card border-border h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">Parâmetros da compra</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Preço parcelado */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label htmlFor="precoParcelado" className="text-xs text-muted-foreground">
                    Preço total parcelado (R$)
                  </Label>
                  <InfoTooltip text="O valor total do produto se você pagar parcelado (sem o desconto à vista)." />
                </div>
                <Input
                  id="precoParcelado"
                  type="number"
                  min={0}
                  value={precoParcelado}
                  onChange={(e) => setPrecoParcelado(Math.max(0, Number(e.target.value)))}
                  className="bg-background"
                />
                <Slider
                  value={[precoParcelado]}
                  onValueChange={([v]) => setPrecoParcelado(v)}
                  min={100}
                  max={50000}
                  step={100}
                />
              </div>

              {/* Preço à vista */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label htmlFor="precoVista" className="text-xs text-muted-foreground">
                    Preço à vista com desconto (R$)
                  </Label>
                  <InfoTooltip text="O valor que você pagaria hoje de uma vez para receber o desconto." />
                </div>
                <Input
                  id="precoVista"
                  type="number"
                  min={0}
                  value={precoVista}
                  onChange={(e) => setPrecoVista(Math.max(0, Number(e.target.value)))}
                  className="bg-background"
                />
                <Slider
                  value={[precoVista]}
                  onValueChange={([v]) => setPrecoVista(v)}
                  min={100}
                  max={precoParcelado}
                  step={50}
                />
                {precoVista < precoParcelado && (
                  <span className="text-[11px] text-emerald-500">
                    Desconto de {fmtBRL(precoParcelado - precoVista)} ({(((precoParcelado - precoVista) / precoParcelado) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>

              {/* Número de parcelas */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label htmlFor="numParcelas" className="text-xs text-muted-foreground">
                    Número de parcelas
                  </Label>
                  <InfoTooltip text="Em quantas parcelas mensais você pagaria o produto." />
                </div>
                <Input
                  id="numParcelas"
                  type="number"
                  min={1}
                  max={60}
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(Math.min(60, Math.max(1, Number(e.target.value))))}
                  className="bg-background"
                />
                <Slider
                  value={[numParcelas]}
                  onValueChange={([v]) => setNumParcelas(v)}
                  min={1}
                  max={60}
                  step={1}
                />
                <span className="text-[11px] text-muted-foreground">
                  {numParcelas} x {result ? fmtBRL(result.valorParcela) : "—"}{jurosParcelamento === 0 ? " sem juros" : ""}
                </span>
              </div>

              {/* Juros do parcelamento */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label htmlFor="jurosParcelamento" className="text-xs text-muted-foreground">
                    Juros do parcelamento (% a.m.)
                  </Label>
                  <InfoTooltip text="Taxa de juros mensal embutida nas parcelas. Deixe 0 se for parcelamento sem juros (valor total dividido igualmente)." />
                </div>
                <Input
                  id="jurosParcelamento"
                  type="number"
                  step={0.1}
                  min={0}
                  max={20}
                  value={jurosParcelamento}
                  onChange={(e) => setJurosParcelamento(Math.max(0, Number(e.target.value)))}
                  className="bg-background"
                />
                <span className="text-[11px] text-muted-foreground">
                  {jurosParcelamento === 0
                    ? "Parcelamento sem juros — valor total dividido por igual"
                    : `Juros compostos: parcelas maiores que o total ÷ ${numParcelas}`}
                </span>
              </div>

              {/* Taxa de investimento */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Label htmlFor="taxaInvest" className="text-xs text-muted-foreground">
                    Taxa de investimento (% a.a.)
                  </Label>
                  <InfoTooltip text="A taxa que o seu dinheiro renderia se você mantivesse investido (ex: CDI ≈ 13,65%, Tesouro Selic ≈ 13,75% a.a.)." />
                </div>
                <Input
                  id="taxaInvest"
                  type="number"
                  step={0.1}
                  min={0}
                  max={50}
                  value={taxaInvestimento}
                  onChange={(e) => setTaxaInvestimento(Math.max(0, Number(e.target.value)))}
                  className="bg-background"
                />
                <Slider
                  value={[taxaInvestimento]}
                  onValueChange={([v]) => setTaxaInvestimento(v)}
                  min={0}
                  max={25}
                  step={0.25}
                />
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {[
                    { label: "Selic", value: 13.75 },
                    { label: "CDI", value: 13.65 },
                    { label: "IPCA+5", value: 9.5 },
                    { label: "Poupança", value: 6.17 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTaxaInvestimento(preset.value)}
                      className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        taxaInvestimento === preset.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/40"
                      }`}
                    >
                      {preset.label} {preset.value}%
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultado */}
          <div className="flex flex-col gap-4">
            {/* Veredito */}
            {result && (
              <Card className={`border-2 ${isParcelado ? "border-emerald-800/50 bg-emerald-950/20" : "border-red-800/40 bg-red-950/15"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isParcelado ? (
                      <CreditCard className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Banknote className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className={`text-base font-bold mb-1 ${isParcelado ? "text-emerald-400" : "text-amber-400"}`}>
                        {isParcelado
                          ? "Vale mais a pena PARCELAR"
                          : "Vale mais a pena pagar À VISTA"}
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">
                        {isParcelado
                          ? `Investindo ${fmtBRL(precoVista)} e pagando as parcelas mensalmente com os rendimentos, você ainda fica com ${fmtBRL(result.saldoFinalParcelado)} no bolso ao final.`
                          : `Mesmo investindo o valor à vista e sacando parcelas mensalmente, você fica com saldo negativo de ${fmtBRL(Math.abs(result.saldoFinalParcelado))} — o desconto compensa mais.`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary cards */}
            {result && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Valor da parcela</span>
                  <p className="text-base font-bold text-foreground mt-1">{fmtBRL(result.valorParcela)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total pago parcelado</span>
                  <p className="text-base font-bold text-foreground mt-1">{fmtBRL(result.totalPagoParcelado)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Desconto à vista</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">{fmtBRL(result.descontoVista)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Saldo final investido</span>
                  <p className={`text-base font-bold mt-1 ${result.saldoFinalParcelado >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtBRL(result.saldoFinalParcelado)}
                  </p>
                </div>
              </div>
            )}

            {/* Taxa implícita */}
            {result && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <h4 className="text-sm font-semibold text-foreground">Taxa implícita do desconto (breakeven)</h4>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-2">
                    O desconto à vista equivale a um retorno de{" "}
                    <Badge variant="secondary" className="text-xs font-bold">
                      {fmtPct(result.taxaImplicitaMensal)} a.m.
                    </Badge>{" "}
                    /{" "}
                    <Badge variant="secondary" className="text-xs font-bold">
                      {fmtPct(result.taxaImplicitaAnual, 1)} a.a.
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.taxaImplicitaAnual > taxaInvestimento / 100
                      ? `⚠️ O desconto (${fmtPct(result.taxaImplicitaAnual, 1)} a.a.) vale mais do que sua taxa de investimento (${taxaInvestimento}% a.a.) → pagar à vista é melhor.`
                      : `✅ Sua taxa de investimento (${taxaInvestimento}% a.a.) supera o desconto à vista (${fmtPct(result.taxaImplicitaAnual, 1)} a.a.) → parcelar e investir é melhor.`}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Chart */}
            {result && result.historico.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Evolução do saldo investido mês a mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={result.historico}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="grad-saldo-pos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="grad-saldo-neg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                        <XAxis
                          dataKey="mes"
                          tick={{ fontSize: 11 }}
                          className="fill-muted-foreground"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => `M${v}`}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          className="fill-muted-foreground"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) =>
                            v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v.toFixed(0)}`
                          }
                        />
                        <RechartsTooltip content={<ChartTooltip />} />
                        <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
                        <Area
                          type="monotone"
                          dataKey="saldo"
                          stroke={result.saldoFinalParcelado >= 0 ? "#22c55e" : "#ef4444"}
                          strokeWidth={2}
                          fill={result.saldoFinalParcelado >= 0 ? "url(#grad-saldo-pos)" : "url(#grad-saldo-neg)"}
                          name="saldo"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    Saldo restante após pagar cada parcela — acima de zero: parcelar vantajoso
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tabela mês a mês colapsável */}
            {result && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Detalhe mês a mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-card">
                        <tr className="border-b border-border">
                          <th className="pb-2 text-left text-muted-foreground font-medium">Mês</th>
                          <th className="pb-2 text-right text-muted-foreground font-medium">Parcela paga</th>
                          <th className="pb-2 text-right text-muted-foreground font-medium">Saldo investido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.historico.map((h) => (
                          <tr
                            key={h.mes}
                            className={`border-b border-border/50 ${h.mes % 2 === 0 ? "bg-muted/20" : ""}`}
                          >
                            <td className="py-1.5 text-muted-foreground">{h.mes}</td>
                            <td className="py-1.5 text-right text-foreground">{fmtBRL(result.valorParcela)}</td>
                            <td className={`py-1.5 text-right font-medium ${h.saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {fmtBRL(h.saldo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Methodology note */}
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
              <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Como funciona o cálculo:</strong> simulamos aplicar o valor à vista
                na sua taxa de investimento e sacar uma parcela por mês. Se sobrar saldo ao final, parcelar foi vantajoso —
                o rendimento do investimento superou o desconto. O cálculo não considera IR sobre investimentos
                nem inflação no período.
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}