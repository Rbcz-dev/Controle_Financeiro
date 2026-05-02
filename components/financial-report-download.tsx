"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"
import {
  formatCurrency,
  type Transaction,
  type MonthlyData,
  type CategoryData,
  type FinanceSummary,
} from "@/lib/finance"

interface FinancialReportDownloadProps {
  transactions: Transaction[]
  monthlyData: MonthlyData
  categoryData: CategoryData
  summary: FinanceSummary
  variant?: "button" | "icon"
}

const MONTH_NAMES: Record<string, string> = {
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

const PIE_COLORS = [
  "#d4a017",
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
]

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-")
  return `${MONTH_NAMES[month] || month}/${year}`
}

function generatePieChartSVG(categoryData: CategoryData): string {
  const entries = Object.entries(categoryData).sort(([, a], [, b]) => b - a)
  if (entries.length === 0) return ""

  const total = entries.reduce((sum, [, val]) => sum + val, 0)
  const cx = 120
  const cy = 120
  const r = 100

  let currentAngle = -Math.PI / 2
  const paths: string[] = []
  const legendItems: string[] = []

  entries.forEach(([cat, val], i) => {
    const pct = val / total
    const angle = pct * 2 * Math.PI
    const endAngle = currentAngle + angle
    const largeArc = angle > Math.PI ? 1 : 0

    const x1 = cx + r * Math.cos(currentAngle)
    const y1 = cy + r * Math.sin(currentAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)

    const color = PIE_COLORS[i % PIE_COLORS.length]

    paths.push(
      `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="white" stroke-width="2"/>`
    )

    legendItems.push(
      `<div style="display:flex;align-items:center;gap:8px;font-size:13px;">
        <span style="width:12px;height:12px;border-radius:3px;background:${color};display:inline-block;flex-shrink:0;"></span>
        <span style="color:#374151;">${cat}</span>
        <span style="color:#6b7280;margin-left:auto;">${formatCurrency(val)} (${(pct * 100).toFixed(1)}%)</span>
      </div>`
    )

    currentAngle = endAngle
  })

  return `
    <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:center;justify-content:center;">
      <svg width="240" height="240" viewBox="0 0 240 240">
        ${paths.join("\n")}
      </svg>
      <div style="display:flex;flex-direction:column;gap:6px;min-width:200px;">
        ${legendItems.join("\n")}
      </div>
    </div>
  `
}

function generateBarChartSVG(monthlyData: MonthlyData): string {
  const entries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return ""

  const maxVal = Math.max(
    ...entries.flatMap(([, d]) => [d.income, Math.abs(d.expense)])
  )
  if (maxVal === 0) return ""

  const barGroupWidth = 80
  const chartWidth = Math.max(entries.length * barGroupWidth + 60, 400)
  const chartHeight = 220
  const barMaxHeight = 160
  const barWidth = 28
  const baseY = chartHeight - 40

  const bars: string[] = []
  const labels: string[] = []

  entries.forEach(([month, data], i) => {
    const x = 40 + i * barGroupWidth
    const incomeH = maxVal > 0 ? (data.income / maxVal) * barMaxHeight : 0
    const expenseH = maxVal > 0 ? (Math.abs(data.expense) / maxVal) * barMaxHeight : 0

    bars.push(
      `<rect x="${x}" y="${baseY - incomeH}" width="${barWidth}" height="${incomeH}" rx="4" fill="#22c55e" opacity="0.85"/>`,
      `<rect x="${x + barWidth + 4}" y="${baseY - expenseH}" width="${barWidth}" height="${expenseH}" rx="4" fill="#ef4444" opacity="0.85"/>`,
    )

    const [, m] = month.split("-")
    const label = MONTH_NAMES[m]?.slice(0, 3) || m
    labels.push(
      `<text x="${x + barWidth + 2}" y="${baseY + 18}" text-anchor="middle" font-size="11" fill="#6b7280">${label}</text>`
    )
  })

  return `
    <div style="overflow-x:auto;">
      <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
        <line x1="40" y1="${baseY}" x2="${chartWidth - 10}" y2="${baseY}" stroke="#e5e7eb" stroke-width="1"/>
        ${bars.join("\n")}
        ${labels.join("\n")}
      </svg>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;font-size:12px;color:#6b7280;">
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="width:10px;height:10px;border-radius:2px;background:#22c55e;display:inline-block;"></span>
          Entradas
        </div>
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="width:10px;height:10px;border-radius:2px;background:#ef4444;display:inline-block;"></span>
          Gastos
        </div>
      </div>
    </div>
  `
}

function generateHTMLReport(
  transactions: Transaction[],
  monthlyData: MonthlyData,
  categoryData: CategoryData,
  summary: FinanceSummary,
): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const pieChart = generatePieChartSVG(categoryData)
  const barChart = generateBarChartSVG(monthlyData)

  const monthlyEntries = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b))

  const sortedTransactions = [...transactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Relatorio Financeiro - ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      background: #f9fafb;
      line-height: 1.5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 2px solid #d4a017;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }
    .header p {
      color: #6b7280;
      font-size: 14px;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 36px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .summary-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
    }
    .summary-card .label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .summary-card .value {
      font-size: 18px;
      font-weight: 700;
    }
    .summary-card .subtitle {
      font-size: 12px;
      color: #6b7280;
    }
    .green { color: #16a34a; }
    .red { color: #ef4444; }
    .chart-container {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 16px;
    }
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
    }
    .monthly-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .monthly-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
    }
    .monthly-card .month-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .monthly-card .row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 2px 0;
    }
    .monthly-card .row .label { color: #6b7280; }
    .monthly-card .divider {
      border-top: 1px solid #e5e7eb;
      margin: 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    thead {
      background: #f3f4f6;
    }
    th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    td {
      padding: 8px 14px;
      border-top: 1px solid #f3f4f6;
      color: #4b5563;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      padding: 1px 8px;
      border-radius: 9999px;
      background: #f3f4f6;
      color: #4b5563;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { background: white; }
      .container { padding: 16px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Relatorio Financeiro</h1>
      <p>Gerado em ${dateStr}</p>
    </div>

    <!-- Resumo Geral -->
    <div class="section">
      <div class="section-title">Resumo Geral</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Total Entradas</div>
          <div class="value green">${formatCurrency(summary.totalIncome)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total Gastos</div>
          <div class="value red">${formatCurrency(Math.abs(summary.totalExpense))}</div>
        </div>
        <div class="summary-card">
          <div class="label">Saldo</div>
          <div class="value ${summary.balance >= 0 ? "green" : "red"}">${formatCurrency(summary.balance)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Media Mensal de Gastos</div>
          <div class="value">${formatCurrency(summary.monthlyAverage)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Maior Categoria</div>
          <div class="value">${summary.topCategory}</div>
          <div class="subtitle">${formatCurrency(summary.topCategoryAmount)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total de Transacoes</div>
          <div class="value">${summary.transactionCount}</div>
        </div>
      </div>
    </div>

    <!-- Gastos por Categoria -->
    ${Object.keys(categoryData).length > 0 ? `
    <div class="section">
      <div class="section-title">Gastos por Categoria</div>
      <div class="chart-container">
        ${pieChart}
      </div>
    </div>
    ` : ""}

    <!-- Evolucao Mensal -->
    ${monthlyEntries.length > 0 ? `
    <div class="section">
      <div class="section-title">Evolucao Mensal</div>
      <div class="chart-container">
        ${barChart}
      </div>
    </div>
    ` : ""}

    <!-- Resumo Mensal -->
    ${monthlyEntries.length > 0 ? `
    <div class="section">
      <div class="section-title">Detalhamento Mensal</div>
      <div class="monthly-grid">
        ${monthlyEntries
          .map(
            ([month, data]) => `
          <div class="monthly-card">
            <div class="month-name">${formatMonthLabel(month)}</div>
            <div class="row">
              <span class="label">Entradas</span>
              <span class="green" style="font-weight:600;">${formatCurrency(data.income)}</span>
            </div>
            <div class="row">
              <span class="label">Saidas</span>
              <span class="red" style="font-weight:600;">${formatCurrency(data.expense)}</span>
            </div>
            <div class="divider"></div>
            <div class="row">
              <span class="label" style="font-weight:500;">Saldo</span>
              <span class="${data.total >= 0 ? "green" : "red"}" style="font-weight:700;">${formatCurrency(data.total)}</span>
            </div>
          </div>`,
          )
          .join("\n")}
      </div>
    </div>
    ` : ""}

    <!-- Lista de Transacoes -->
    <div class="section">
      <div class="section-title">Todas as Transacoes (${sortedTransactions.length})</div>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descricao</th>
            <th>Categoria</th>
            <th style="text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${sortedTransactions
            .map(
              (t) => `
          <tr>
            <td>${t.date.toLocaleDateString("pt-BR")}</td>
            <td>${t.description}</td>
            <td><span class="badge">${t.category}</span></td>
            <td style="text-align:right;font-weight:600;" class="${t.type === "income" ? "green" : "red"}">${formatCurrency(t.amount)}</td>
          </tr>`,
            )
            .join("\n")}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Controle Financeiro &mdash; Relatorio gerado automaticamente
    </div>
  </div>
</body>
</html>`
}

export function FinancialReportDownload({
  transactions,
  monthlyData,
  categoryData,
  summary,
  variant = "button",
}: FinancialReportDownloadProps) {
  const handleDownload = useCallback(() => {
    try {
      const html = generateHTMLReport(transactions, monthlyData, categoryData, summary)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      const now = new Date()
      const dateSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      a.download = `relatorio-financeiro-${dateSlug}.html`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Relatorio baixado com sucesso", {
        description: "Abra o arquivo HTML no navegador para visualizar ou imprimir.",
      })
    } catch {
      toast.error("Erro ao gerar o relatorio")
    }
  }, [transactions, monthlyData, categoryData, summary])

  if (variant === "icon") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleDownload}
        title="Baixar relatorio financeiro"
        aria-label="Baixar relatorio financeiro"
        className="bg-transparent"
      >
        <Download className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      className="gap-1.5 bg-transparent"
    >
      <Download className="h-4 w-4" />
      Baixar Relatorio
    </Button>
  )
}
