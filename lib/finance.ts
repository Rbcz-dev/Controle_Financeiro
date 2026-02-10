export interface Transaction {
  date: Date
  description: string
  category: string
  amount: number
  type: "income" | "expense"
}

export interface MonthlySummaryData {
  income: number
  expense: number
  total: number
}

export interface MonthlyData {
  [key: string]: MonthlySummaryData
}

export interface CategoryData {
  [key: string]: number
}

export interface FinanceSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  monthlyAverage: number
  topCategory: string
  topCategoryAmount: number
  transactionCount: number
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []

  // Detect separator: semicolon or comma
  const firstLine = lines[0]
  const separator = firstLine.includes(";") ? ";" : ","

  const headers = firstLine.split(separator).map((h) => h.trim().replace(/"/g, ""))

  return lines.slice(1).map((line) => {
    const values = line.split(separator)
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim().replace(/"/g, "") ?? ""
    })
    return obj
  })
}

export function detectCategory(description: string): string {
  const text = description.toLowerCase()

  if (text.includes("mercado") || text.includes("supermercado") || text.includes("padaria") || text.includes("acougue"))
    return "Alimentacao"
  if (text.includes("ifood") || text.includes("restaurante") || text.includes("lanchonete") || text.includes("pizzaria"))
    return "Alimentacao"
  if (text.includes("aluguel") || text.includes("condominio") || text.includes("iptu"))
    return "Moradia"
  if (text.includes("uber") || text.includes("99") || text.includes("combustivel") || text.includes("gasolina") || text.includes("estacionamento"))
    return "Transporte"
  if (text.includes("salario") || text.includes("salário") || text.includes("freelance") || text.includes("pix recebido"))
    return "Renda"
  if (text.includes("luz") || text.includes("energia") || text.includes("agua") || text.includes("gas") || text.includes("internet") || text.includes("telefone"))
    return "Contas"
  if (text.includes("farmacia") || text.includes("saude") || text.includes("medico") || text.includes("hospital") || text.includes("plano de saude"))
    return "Saude"
  if (text.includes("escola") || text.includes("curso") || text.includes("faculdade") || text.includes("livro") || text.includes("udemy"))
    return "Educacao"
  if (text.includes("lazer") || text.includes("cinema") || text.includes("netflix") || text.includes("spotify") || text.includes("viagem") || text.includes("hotel"))
    return "Lazer"

  return "Outros"
}

// Normalize header names to handle variations
function normalizeHeaderKey(headers: string[]): { dateKey: string; descKey: string; amountKey: string; categoryKey: string | null } {
  const lower = headers.map((h) => h.toLowerCase().trim())

  const dateKey = headers[lower.findIndex((h) => h === "data" || h === "date")] ?? headers[0]
  const descKey = headers[lower.findIndex((h) => h.includes("descri") || h === "description")] ?? headers[1]
  const amountKey = headers[lower.findIndex((h) => h === "valor" || h === "amount" || h === "value")] ?? headers[2]
  const catIdx = lower.findIndex((h) => h === "categoria" || h === "category")
  const categoryKey = catIdx >= 0 ? headers[catIdx] : null

  return { dateKey, descKey, amountKey, categoryKey }
}

export function normalizeData(rawData: Record<string, string>[]): Transaction[] {
  if (rawData.length === 0) return []

  const headers = Object.keys(rawData[0])
  const { dateKey, descKey, amountKey, categoryKey } = normalizeHeaderKey(headers)

  return rawData
    .filter((item) => item[amountKey] && item[dateKey] && item[descKey])
    .map((item) => {
      const rawValue = item[amountKey].trim()
      const amount = rawValue.includes(",")
        ? Number(rawValue.replace(/\./g, "").replace(",", "."))
        : Number(rawValue)

      if (Number.isNaN(amount)) return null

      const description = item[descKey]
      const category = categoryKey && item[categoryKey]
        ? item[categoryKey]
        : detectCategory(description)

      // Parse date: try DD/MM/YYYY first, then YYYY-MM-DD
      const dateStr = item[dateKey]
      let date: Date
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/")
        if (parts[0].length === 4) {
          date = new Date(dateStr)
        } else {
          date = new Date(parts.reverse().join("-"))
        }
      } else {
        date = new Date(dateStr)
      }

      if (Number.isNaN(date.getTime())) return null

      return {
        date,
        description,
        category,
        amount,
        type: amount >= 0 ? ("income" as const) : ("expense" as const),
      }
    })
    .filter(Boolean) as Transaction[]
}

export function groupByMonth(transactions: Transaction[]): MonthlyData {
  const result: MonthlyData = {}

  for (const item of transactions) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`

    if (!result[key]) {
      result[key] = { income: 0, expense: 0, total: 0 }
    }

    if (item.type === "income") result[key].income += item.amount
    else result[key].expense += item.amount

    result[key].total += item.amount
  }

  return result
}

export function groupByCategory(transactions: Transaction[]): CategoryData {
  const result: CategoryData = {}

  for (const item of transactions) {
    if (item.type !== "expense") continue
    if (!result[item.category]) result[item.category] = 0
    result[item.category] += Math.abs(item.amount)
  }

  return result
}

export function computeSummary(
  transactions: Transaction[],
  monthlyData: MonthlyData,
  categoryData: CategoryData,
): FinanceSummary {
  let totalIncome = 0
  let totalExpense = 0

  for (const item of transactions) {
    if (item.type === "income") totalIncome += item.amount
    else totalExpense += item.amount
  }

  const monthCount = Math.max(Object.keys(monthlyData).length, 1)
  const monthlyAverage = Math.abs(totalExpense) / monthCount

  let topCategory = "N/A"
  let topCategoryAmount = 0
  for (const [cat, val] of Object.entries(categoryData)) {
    if (val > topCategoryAmount) {
      topCategory = cat
      topCategoryAmount = val
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome + totalExpense,
    monthlyAverage,
    topCategory,
    topCategoryAmount,
    transactionCount: transactions.length,
  }
}

export interface InvestmentPoint {
  month: number
  label: string
  invested: number
  value: number
}

export type InvestmentType = "selic" | "cdi" | "ipca"

export const INVESTMENT_RATES: Record<InvestmentType, { name: string; rate: number; description: string }> = {
  selic: {
    name: "SELIC",
    rate: 10.75,
    description: "Taxa basica de juros da economia brasileira, definida pelo Banco Central a cada 45 dias.",
  },
  cdi: {
    name: "CDI",
    rate: 10.65,
    description: "Certificado de Deposito Interbancario. Referencia para investimentos de renda fixa como CDBs.",
  },
  ipca: {
    name: "IPCA+",
    rate: 4.5,
    description: "Indice de inflacao oficial do Brasil. Investimentos IPCA+ protegem seu dinheiro da inflacao mais um premio fixo.",
  },
}

export function simulateInvestment(
  initialValue: number,
  monthlyContribution: number,
  months: number,
  annualRate: number,
): InvestmentPoint[] {
  const monthlyRate = annualRate / 100 / 12
  const results: InvestmentPoint[] = []

  let currentValue = initialValue
  let totalInvested = initialValue

  for (let i = 0; i <= months; i++) {
    const year = Math.floor(i / 12)
    const month = i % 12

    results.push({
      month: i,
      label: i === 0 ? "Inicio" : `${year > 0 ? `${year}a ` : ""}${month > 0 ? `${month}m` : ""}`.trim() || `${year}a`,
      invested: totalInvested,
      value: currentValue,
    })

    currentValue = currentValue * (1 + monthlyRate)
    if (i < months) {
      currentValue += monthlyContribution
      totalInvested += monthlyContribution
    }
  }

  return results
}

export const SAMPLE_CSV = `Data,Descricao,Valor
01/01/2025,Salario,5500.00
03/01/2025,Supermercado Extra,-450.30
05/01/2025,Uber,-35.90
07/01/2025,Netflix,-55.90
10/01/2025,Aluguel,-1800.00
12/01/2025,Conta de Luz,-180.50
15/01/2025,Farmacia Popular,-89.00
18/01/2025,Curso Udemy,-47.90
20/01/2025,Cinema,-32.00
22/01/2025,Restaurante Italiano,-95.00
25/01/2025,Gasolina,-200.00
28/01/2025,Freelance,1200.00
01/02/2025,Salario,5500.00
03/02/2025,Mercado Dia,-380.00
05/02/2025,99 Taxi,-28.50
08/02/2025,Condominio,-650.00
10/02/2025,Aluguel,-1800.00
12/02/2025,Internet,-120.00
15/02/2025,Plano de Saude,-450.00
18/02/2025,Padaria,-25.00
20/02/2025,Spotify,-21.90
22/02/2025,Supermercado Pao de Acucar,-520.00
25/02/2025,Estacionamento,-15.00
28/02/2025,Pix Recebido,800.00
01/03/2025,Salario,5500.00
04/03/2025,Acougue,-150.00
06/03/2025,Uber,-42.00
09/03/2025,Energia,-195.00
12/03/2025,Aluguel,-1800.00
15/03/2025,Escola Ingles,-350.00
18/03/2025,Viagem Praia,-1200.00
20/03/2025,Lanchonete,-18.00
23/03/2025,Telefone Celular,-79.90
25/03/2025,Mercado,-410.00
28/03/2025,Freelance,1500.00`
