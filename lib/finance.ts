// ─────────────────────────────────────────────────────────────
//  lib/finance.ts  —  Baruck Finance
//  Parser multi-banco + multi-formato:
//  • CSV: Nubank, Inter, Itaú, Bradesco, C6, Caixa, Santander, BTG
//  • OFX/SGML: qualquer banco que exporte .ofx
//  • Fallback: mapeamento manual de colunas
// ─────────────────────────────────────────────────────────────

// ── Tipos base ────────────────────────────────────────────────

export type TransactionKind =
  | "expense"      // Gasto real: alimentação, moradia, lazer...
  | "income"       // Renda real: salário, freelance, venda...
  | "investment"   // Movimentação de investimento: compra ação/FII/ETF, aplicação, resgate, dividendo
  | "transfer"     // Transferência entre contas próprias
  | "reversal"     // Estorno, cancelamento, devolução, chargeback

export interface Transaction {
  date: Date
  description: string
  category: string
  amount: number
  type: "income" | "expense"   // mantido para compatibilidade
  kind: TransactionKind        // classificação precisa da transação
}

export interface MonthlySummaryData {
  income: number
  expense: number
  investment: number   // movimentações de investimento (valor absoluto saído para investir)
  reversal: number     // estornos e cancelamentos (valor absoluto devolvido)
  total: number
}

export interface MonthlyData {
  [key: string]: MonthlySummaryData
}

export interface CategoryData {
  [key: string]: number
}

export interface FinanceSummary {
  totalIncome: number       // renda real (salário, freelance — kind: income)
  totalExpense: number      // gastos reais (kind: expense) — sem investimentos/estornos
  totalInvested: number     // total saído para investimentos (valor positivo)
  totalReversals: number    // total de estornos/cancelamentos (valor positivo)
  balance: number           // renda - gastos reais
  monthlyAverage: number    // média mensal de gastos reais
  topCategory: string
  topCategoryAmount: number
  transactionCount: number
  investmentCount: number   // número de movimentações de investimento
  reversalCount: number     // número de estornos
}

// ── Tipos do parser multi-banco ────────────────────────────────

export type BankId =
  | "nubank"
  | "inter"
  | "itau"
  | "bradesco"
  | "c6"
  | "caixa"
  | "santander"
  | "btg"
  | "generic"

export interface BankFormat {
  id: BankId
  name: string
  logo: string   // emoji
  separator: string
  skipLines: number  // linhas de cabeçalho/metadado antes das colunas reais
  columns: {
    date: string[]
    description: string[]
    value?: string[]      // coluna única com valor (positivo = crédito, negativo = débito)
    credit?: string[]     // coluna de crédito separada
    debit?: string[]      // coluna de débito separada
    type?: string[]       // coluna D/C
    category?: string[]
  }
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "DD/MM/YY" | "YYYY/MM/DD"
  valueFormat: "br" | "us"   // br = 1.234,56 | us = 1234.56
  typeMap?: { debit: string; credit: string }   // mapeamento para colunas D/C
  negativeIsDebit?: boolean   // valor negativo = débito (padrão true)
}

export interface ParseResult {
  bankId: BankId
  bankName: string
  bankLogo: string
  transactions: Transaction[]
  /** Cabeçalhos detectados no arquivo (para mapeamento manual) */
  detectedHeaders: string[]
  /** Primeiras linhas brutas (para preview no mapeamento manual) */
  rawRows: string[][]
  /** Separador detectado */
  separator: string
  /** True quando o banco não foi reconhecido e precisa de mapeamento manual */
  needsMapping: boolean
  /** Número de linhas ignoradas antes dos dados */
  skippedLines: number
  /** Erros/avisos durante o parsing */
  warnings: string[]
}

export interface ColumnMapping {
  dateCol: string
  descriptionCol: string
  valueCol?: string
  creditCol?: string
  debitCol?: string
  typeCol?: string
  categoryCol?: string
}

// ── Definições dos formatos por banco ─────────────────────────

const BANK_FORMATS: BankFormat[] = [
  {
    id: "nubank",
    name: "Nubank",
    logo: "🟣",
    separator: ",",
    skipLines: 0,
    columns: {
      date: ["data", "date"],
      description: ["descrição", "descricao", "description", "título", "titulo"],
      value: ["valor", "value", "amount"],
      category: ["categoria", "category"],
    },
    dateFormat: "YYYY-MM-DD",
    valueFormat: "us",
    negativeIsDebit: true,
  },
  {
    id: "inter",
    name: "Banco Inter",
    logo: "🟠",
    separator: ",",
    skipLines: 0,
    columns: {
      date: ["data", "date", "data lançamento", "data lancamento"],
      description: ["lançamento", "lancamento", "descrição", "descricao", "histórico", "historico"],
      value: ["valor", "value"],
      type: ["tipo"],
    },
    dateFormat: "DD/MM/YYYY",
    valueFormat: "br",
    typeMap: { debit: "D", credit: "C" },
  },
  {
    id: "itau",
    name: "Itaú",
    logo: "🔵",
    separator: ";",
    skipLines: 0,
    columns: {
      date: ["data", "date"],
      description: ["histórico", "historico", "descrição", "descricao"],
      credit: ["crédito", "credito"],
      debit: ["débito", "debito"],
    },
    dateFormat: "DD/MM/YYYY",
    valueFormat: "br",
  },
  {
    id: "bradesco",
    name: "Bradesco",
    logo: "🔴",
    separator: ";",
    skipLines: -1,  // -1 = detectar automaticamente quantas linhas pular
    columns: {
      date: ["data", "date", "lançamento", "lancamento"],
      description: ["histórico", "historico", "descrição", "descricao"],
      value: ["valor", "value"],
    },
    dateFormat: "DD/MM/YYYY",
    valueFormat: "br",
    negativeIsDebit: true,
  },
  {
    id: "c6",
    name: "C6 Bank",
    logo: "⚫",
    separator: ",",
    skipLines: 0,
    columns: {
      date: ["data de lançamento", "data de lancamento", "data", "date"],
      description: ["descrição", "descricao", "description"],
      value: ["valor", "value"],
    },
    dateFormat: "YYYY-MM-DD",
    valueFormat: "us",
    negativeIsDebit: true,
  },
  {
    id: "caixa",
    name: "Caixa Econômica",
    logo: "🟡",
    separator: ";",
    skipLines: 0,
    columns: {
      date: ["data", "date"],
      description: ["histórico", "historico", "lançamento", "lancamento"],
      value: ["valor", "value"],
    },
    dateFormat: "DD/MM/YYYY",
    valueFormat: "br",
    negativeIsDebit: true,
  },
  {
    id: "santander",
    name: "Santander",
    logo: "🔴",
    separator: ";",
    skipLines: 0,
    columns: {
      date: ["data", "date"],
      description: ["descrição", "descricao", "histórico", "historico"],
      value: ["valor", "value"],
    },
    dateFormat: "DD/MM/YYYY",
    valueFormat: "br",
    negativeIsDebit: true,
  },
  {
    id: "btg",
    name: "BTG Pactual",
    logo: "🔷",
    separator: ",",
    skipLines: 0,
    columns: {
      date: ["data", "date"],
      description: ["histórico", "historico", "descrição", "descricao"],
      value: ["valor", "value"],
    },
    dateFormat: "DD/MM/YYYY",
    valueFormat: "br",
    negativeIsDebit: true,
  },
]

// ── Utilitários ────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/** Corrige encoding: tenta detectar ISO-8859-1 e converte */
export function fixEncoding(text: string): string {
  // Se não há caracteres de reposição, está OK
  if (!text.includes("\uFFFD")) return text
  // Tenta decodificar como latin1 via escape
  try {
    return decodeURIComponent(escape(text))
  } catch {
    return text
  }
}

/** Normaliza uma string de cabeçalho para comparação */
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

/** Detecta o separador de um CSV */
function detectSeparator(line: string): string {
  const counts = { ";": 0, ",": 0, "\t": 0 }
  for (const ch of line) {
    if (ch in counts) counts[ch as keyof typeof counts]++
  }
  if (counts[";"] > counts[","] && counts[";"] > counts["\t"]) return ";"
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"] ) return "\t"
  return ","
}

/** Faz parse de uma linha CSV respeitando aspas */
function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === sep && !inQuote) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** Converte string de valor para número */
function parseAmount(raw: string, format: "br" | "us"): number | null {
  if (!raw) return null
  // Remove espaços e caracteres invisíveis
  let s = raw.replace(/\s+/g, "").replace(/[^\d,.\-+]/g, "")
  if (!s) return null

  if (format === "br") {
    // 1.234,56 → 1234.56
    s = s.replace(/\./g, "").replace(",", ".")
  } else {
    // 1,234.56 → 1234.56
    s = s.replace(/,/g, "")
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

/** Converte string de data para Date */
function parseDate(raw: string, format: BankFormat["dateFormat"]): Date | null {
  if (!raw) return null
  const s = raw.trim()

  try {
    if (format === "YYYY-MM-DD" || format === "YYYY/MM/DD") {
      const sep = format === "YYYY-MM-DD" ? "-" : "/"
      const [y, m, d] = s.split(sep).map(Number)
      const date = new Date(y, m - 1, d)
      return isNaN(date.getTime()) ? null : date
    }
    if (format === "DD/MM/YYYY") {
      const parts = s.split("/")
      if (parts.length !== 3) return null
      const [d, m, y] = parts.map(Number)
      const date = new Date(y, m - 1, d)
      return isNaN(date.getTime()) ? null : date
    }
    if (format === "DD/MM/YY") {
      const [d, m, y] = s.split("/").map(Number)
      const fullYear = y < 50 ? 2000 + y : 1900 + y
      const date = new Date(fullYear, m - 1, d)
      return isNaN(date.getTime()) ? null : date
    }
  } catch {
    return null
  }
  return null
}

/** Encontra a chave de coluna dentro de um conjunto de headers */
function findColumn(headers: string[], candidates: string[]): string | null {
  const normalizedHeaders = headers.map(normalizeHeader)
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate)
    const idx = normalizedHeaders.findIndex(
      (h) => h === normalizedCandidate || h.includes(normalizedCandidate)
    )
    if (idx !== -1) return headers[idx]
  }
  return null
}

// ── Detecção de banco ─────────────────────────────────────────

/**
 * Identifica o banco com base nos cabeçalhos e conteúdo.
 * Retorna o formato e quantas linhas pular antes do cabeçalho real.
 */
function detectBank(
  lines: string[],
  separator: string
): { format: BankFormat | null; dataStartLine: number } {
  // Tenta cada formato de banco
  for (let startLine = 0; startLine < Math.min(8, lines.length); startLine++) {
    const headerLine = lines[startLine]
    if (!headerLine?.trim()) continue

    const headers = parseCsvLine(headerLine, separator).map(normalizeHeader)
    if (headers.length < 2) continue

    for (const format of BANK_FORMATS) {
      if (format.id === "generic") continue

      const dateCol = format.columns.date.some((c) =>
        headers.some((h) => h === normalizeHeader(c) || h.includes(normalizeHeader(c)))
      )
      const descCol = format.columns.description.some((c) =>
        headers.some((h) => h === normalizeHeader(c) || h.includes(normalizeHeader(c)))
      )
      const valueCol = [
        ...(format.columns.value ?? []),
        ...(format.columns.credit ?? []),
        ...(format.columns.debit ?? []),
      ].some((c) =>
        headers.some((h) => h === normalizeHeader(c) || h.includes(normalizeHeader(c)))
      )

      // Precisa ter pelo menos data + descrição + alguma coluna de valor
      if (dateCol && descCol && valueCol) {
        // Verifica separador (se for específico do banco)
        if (format.separator !== separator && startLine === 0) continue
        return { format, dataStartLine: startLine }
      }
    }
  }

  return { format: null, dataStartLine: 0 }
}

// ── Parser principal ──────────────────────────────────────────

/**
 * Converte linhas CSV num array de Transaction usando o formato do banco.
 */
function parseRows(
  rows: string[][],
  headers: string[],
  format: BankFormat,
  warnings: string[]
): Transaction[] {
  const cols = format.columns

  const dateKey   = findColumn(headers, cols.date)
  const descKey   = findColumn(headers, cols.description)
  const valueKey  = cols.value   ? findColumn(headers, cols.value)   : null
  const creditKey = cols.credit  ? findColumn(headers, cols.credit)  : null
  const debitKey  = cols.debit   ? findColumn(headers, cols.debit)   : null
  const typeKey   = cols.type    ? findColumn(headers, cols.type)    : null
  const catKey    = cols.category ? findColumn(headers, cols.category) : null

  if (!dateKey || !descKey) {
    warnings.push("Não foi possível identificar as colunas de data ou descrição.")
    return []
  }

  const transactions: Transaction[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 2 || row.every((c) => !c)) continue

    const rowMap: Record<string, string> = {}
    headers.forEach((h, idx) => { rowMap[h] = row[idx] ?? "" })

    // Data
    const date = parseDate(rowMap[dateKey], format.dateFormat)
    if (!date) continue

    // Descrição
    const description = rowMap[descKey]?.trim()
    if (!description) continue

    // Valor
    let amount: number | null = null

    if (valueKey && rowMap[valueKey] !== undefined) {
      // Coluna de valor única
      amount = parseAmount(rowMap[valueKey], format.valueFormat)

      // Se há coluna de tipo (D/C) e o valor veio positivo, aplicar sinal
      if (typeKey && format.typeMap && amount !== null) {
        const typeVal = rowMap[typeKey]?.trim().toUpperCase()
        if (typeVal === format.typeMap.debit && amount > 0) amount = -amount
        else if (typeVal === format.typeMap.credit && amount < 0) amount = Math.abs(amount)
      }
    } else if (creditKey && debitKey) {
      // Colunas crédito/débito separadas (ex: Itaú)
      const credit = parseAmount(rowMap[creditKey], format.valueFormat)
      const debit  = parseAmount(rowMap[debitKey],  format.valueFormat)
      if (credit && credit !== 0) amount = Math.abs(credit)
      else if (debit && debit !== 0) amount = -Math.abs(debit)
    }

    if (amount === null || isNaN(amount)) continue

    // Categoria
    const category = catKey && rowMap[catKey]?.trim()
      ? rowMap[catKey].trim()
      : detectCategory(description)

    const kind = detectKind(description, amount)

    transactions.push({
      date,
      description,
      category,
      amount,
      type: amount >= 0 ? "income" : "expense",
      kind,
    })
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada. Verifique o formato do arquivo.")
  }

  return transactions
}

// ── Parser OFX (SGML bancário) ────────────────────────────────

/**
 * Extrai o valor de uma tag OFX/SGML.
 * Suporta tanto `<TAG>valor</TAG>` quanto `<TAG>valor\n` (sem fechamento).
 */
function ofxTag(src: string, tag: string): string {
  const withClose = src.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`, "i"))
  if (withClose) return withClose[1].trim()
  const noClose = src.match(new RegExp(`<${tag}>([^\\n<]*)`, "i"))
  return noClose?.[1]?.trim() ?? ""
}

/** Converte data OFX `20260601000000[-3:BRT]` para Date */
function parseOFXDate(raw: string): Date | null {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(date.getTime()) ? null : date
}

/** Detecta o banco a partir do campo <ORG> do OFX */
function ofxBank(org: string): { bankId: BankId; bankName: string; bankLogo: string } {
  const u = org.toUpperCase()
  if (u.includes("NU PAGAMENTOS") || u.includes("NUBANK"))
    return { bankId: "nubank",   bankName: "Nubank",        bankLogo: "🟣" }
  if (u.includes("ITAU") || u.includes("ITAÚ"))
    return { bankId: "itau",     bankName: "Itaú",           bankLogo: "🔵" }
  if (u.includes("BRADESCO"))
    return { bankId: "bradesco", bankName: "Bradesco",       bankLogo: "🔴" }
  if (u.includes("SANTANDER"))
    return { bankId: "santander",bankName: "Santander",      bankLogo: "🔴" }
  if (u.includes("C6") || u.includes("BCO C6"))
    return { bankId: "c6",       bankName: "C6 Bank",        bankLogo: "⚫" }
  if (u.includes("INTER") || u.includes("BANCO INTER"))
    return { bankId: "inter",    bankName: "Banco Inter",    bankLogo: "🟠" }
  if (u.includes("BTG"))
    return { bankId: "btg",      bankName: "BTG Pactual",    bankLogo: "🔷" }
  if (u.includes("CAIXA") || u.includes("CEF"))
    return { bankId: "caixa",    bankName: "Caixa Econômica",bankLogo: "🟡" }
  if (u.includes("SICOOB") || u.includes("SICREDI"))
    return { bankId: "generic",  bankName: org,              bankLogo: "🤝" }
  return { bankId: "generic",    bankName: org || "Banco",   bankLogo: "🏦" }
}

/**
 * Faz parse de um arquivo OFX/SGML e retorna transações.
 * Compatível com o formato exportado por Nubank, Itaú, Bradesco, Inter etc.
 */
export function parseOFX(rawText: string): ParseResult {
  const text = fixEncoding(rawText)
  const warnings: string[] = []

  // Detecta banco
  const org = ofxTag(text, "ORG")
  const { bankId, bankName, bankLogo } = ofxBank(org)

  // Divide em blocos de transação — cada <STMTTRN> é uma transação
  const blocks = text.split(/<STMTTRN>/i).slice(1)

  if (blocks.length === 0) {
    warnings.push("Nenhum bloco <STMTTRN> encontrado no arquivo OFX.")
    return {
      bankId, bankName, bankLogo,
      transactions: [],
      detectedHeaders: [],
      rawRows: [],
      separator: "",
      needsMapping: false,
      skippedLines: 0,
      warnings,
    }
  }

  const transactions: Transaction[] = []

  for (const block of blocks) {
    const dateRaw  = ofxTag(block, "DTPOSTED")
    const amtRaw   = ofxTag(block, "TRNAMT")
    const memo     = ofxTag(block, "MEMO") || ofxTag(block, "NAME")

    const date   = parseOFXDate(dateRaw)
    const amount = parseFloat(amtRaw.replace(",", "."))

    if (!date || isNaN(amount)) continue

    const description = memo || "Sem descrição"
    const category    = detectCategory(description)
    const kind        = detectKind(description, amount)

    transactions.push({
      date,
      description,
      category,
      amount,
      type:  amount >= 0 ? "income" : "expense",
      kind,
    })
  }

  if (transactions.length === 0) {
    warnings.push("Nenhuma transação válida encontrada no OFX. Verifique se o arquivo está correto.")
  }

  return {
    bankId, bankName, bankLogo,
    transactions,
    detectedHeaders: ["Data", "Descrição", "Valor", "Tipo"],
    rawRows: [],
    separator: "",
    needsMapping: false,
    skippedLines: 0,
    warnings,
  }
}

// ── Parser principal ──────────────────────────────────────────

/**
 * Ponto de entrada principal do parser.
 * Aceita o texto bruto de qualquer extrato: CSV, OFX/SGML.
 */
export function parseStatement(rawText: string): ParseResult {
  const text = fixEncoding(rawText)

  // ── Detecta OFX antes de qualquer lógica CSV ──────────────
  const trimmed = text.trimStart()
  if (trimmed.startsWith("OFXHEADER") || /<OFX>/i.test(trimmed)) {
    return parseOFX(text)
  }

  // Normaliza quebras de linha (Windows \r\n → \n)
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")

  // Detecta separador a partir das primeiras linhas com conteúdo
  const firstContentLine = lines.find((l) => l.trim().length > 2) ?? lines[0]
  const separator = detectSeparator(firstContentLine)

  // Detecta banco
  const { format, dataStartLine } = detectBank(lines, separator)

  const warnings: string[] = []

  // Se não detectou nenhum banco → modo de mapeamento manual
  if (!format) {
    // Encontrar a linha de cabeçalho: a que tem mais colunas preenchidas
    let headerLine = 0
    let maxCols = 0
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const cols = parseCsvLine(lines[i], separator).filter((c) => c).length
      if (cols > maxCols) { maxCols = cols; headerLine = i }
    }

    const headers = parseCsvLine(lines[headerLine], separator)
    const rawRows = lines
      .slice(headerLine + 1)
      .filter((l) => l.trim())
      .slice(0, 5)
      .map((l) => parseCsvLine(l, separator))

    warnings.push("Banco não reconhecido automaticamente. Mapeie as colunas manualmente.")

    return {
      bankId: "generic",
      bankName: "Banco Não Identificado",
      bankLogo: "🏦",
      transactions: [],
      detectedHeaders: headers,
      rawRows,
      separator,
      needsMapping: true,
      skippedLines: headerLine,
      warnings,
    }
  }

  // Cabeçalho real
  const headers = parseCsvLine(lines[dataStartLine], separator)

  // Linhas de dados (após o cabeçalho)
  const dataLines = lines.slice(dataStartLine + 1).filter((l) => l.trim())
  const rows = dataLines.map((l) => parseCsvLine(l, separator))

  // Primeiras linhas para preview
  const rawRows = rows.slice(0, 5)

  const transactions = parseRows(rows, headers, format, warnings)

  return {
    bankId: format.id,
    bankName: format.name,
    bankLogo: format.logo,
    transactions,
    detectedHeaders: headers,
    rawRows,
    separator,
    needsMapping: false,
    skippedLines: dataStartLine,
    warnings,
  }
}

/**
 * Aplica um mapeamento manual e retorna as transações.
 * Usado quando o banco não foi detectado automaticamente.
 */
export function applyManualMapping(
  rawText: string,
  mapping: ColumnMapping,
  options: {
    separator: string
    headerLine: number
    dateFormat: BankFormat["dateFormat"]
    valueFormat: BankFormat["valueFormat"]
    negativeIsDebit: boolean
  }
): Transaction[] {
  const text = fixEncoding(rawText)
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")

  const headers = parseCsvLine(lines[options.headerLine], options.separator)
  const dataLines = lines.slice(options.headerLine + 1).filter((l) => l.trim())
  const rows = dataLines.map((l) => parseCsvLine(l, options.separator))

  const warnings: string[] = []
  const format: BankFormat = {
    id: "generic",
    name: "Genérico",
    logo: "🏦",
    separator: options.separator,
    skipLines: options.headerLine,
    columns: {
      date: [mapping.dateCol],
      description: [mapping.descriptionCol],
      value: mapping.valueCol ? [mapping.valueCol] : undefined,
      credit: mapping.creditCol ? [mapping.creditCol] : undefined,
      debit: mapping.debitCol ? [mapping.debitCol] : undefined,
      type: mapping.typeCol ? [mapping.typeCol] : undefined,
      category: mapping.categoryCol ? [mapping.categoryCol] : undefined,
    },
    dateFormat: options.dateFormat,
    valueFormat: options.valueFormat,
    negativeIsDebit: options.negativeIsDebit,
  }

  return parseRows(rows, headers, format, warnings)
}

// ── Manter compatibilidade com o código existente ─────────────

/** @deprecated Use parseStatement() */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  if (lines.length < 2) return []
  const separator = detectSeparator(lines[0])
  const headers = parseCsvLine(lines[0], separator)
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, separator)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? "" })
    return obj
  })
}

/** @deprecated Use parseStatement() */
export function normalizeData(rawData: Record<string, string>[]): Transaction[] {
  if (rawData.length === 0) return []
  const headers = Object.keys(rawData[0])

  const lower = headers.map((h) => normalizeHeader(h))
  const dateKey = headers[lower.findIndex((h) => h === "data" || h === "date")] ?? headers[0]
  const descKey = headers[lower.findIndex((h) => h.includes("descri") || h === "description")] ?? headers[1]
  const amountKey = headers[lower.findIndex((h) => h === "valor" || h === "amount" || h === "value")] ?? headers[2]
  const catIdx = lower.findIndex((h) => h === "categoria" || h === "category")
  const categoryKey = catIdx >= 0 ? headers[catIdx] : null

  return rawData
    .filter((item) => item[amountKey] && item[dateKey] && item[descKey])
    .map((item) => {
      const rawValue = item[amountKey].trim()
      const amount = rawValue.includes(",")
        ? Number(rawValue.replace(/\./g, "").replace(",", "."))
        : Number(rawValue)
      if (Number.isNaN(amount)) return null

      const description = item[descKey]
      const category =
        categoryKey && item[categoryKey] ? item[categoryKey] : detectCategory(description)

      const dateStr = item[dateKey]
      let date: Date
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/")
        date = parts[0].length === 4
          ? new Date(dateStr)
          : new Date(parts.reverse().join("-"))
      } else {
        date = new Date(dateStr)
      }
      if (Number.isNaN(date.getTime())) return null

      const kind = detectKind(description, amount)
      return { date, description, category, amount, type: amount >= 0 ? "income" as const : "expense" as const, kind }
    })
    .filter(Boolean) as Transaction[]
}

// ── Detecção do tipo de transação (kind) ──────────────────────

/**
 * Determina o kind de uma transação com base na descrição e valor.
 * Ordem de prioridade: reversal > investment > transfer > income/expense
 */
export function detectKind(description: string, amount: number): TransactionKind {
  const t = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // 1. Estornos e cancelamentos (checar antes de investimento)
  if (
    /estorno|cancelamento|cancel\.|chargeback|reembolso|devolucao|devol\.|ressarcimento/.test(t)
  ) return "reversal"

  // 2. Movimentações de investimento
  // — Corretoras e plataformas
  if (/\bxp\b|xp invest|btg|rico invest|clear corr|modalmais|modal mais|nuinvest|nu invest/.test(t)) return "investment"
  if (/easynvest|warren|magnetis|verios|kinvo|ativo|ativa corr|agora corr|genial/.test(t)) return "investment"
  if (/inter invest|inter dtvm|avenue|passfolio|stake|inter co/.test(t)) return "investment"
  if (/itau corr|bradesco corr|santander corr|banco modal/.test(t)) return "investment"
  if (/foxbit|binance|mercadobitcoin|novaDAX|bitso|coinbase/.test(t)) return "investment"
  // — Tipos de operação de investimento
  if (/compra acao|compra fii|compra etf|compra cri|compra cra|compra debenture/.test(t)) return "investment"
  if (/venda acao|venda fii|venda etf|venda cri|venda cra/.test(t)) return "investment"
  if (/\baplicacao\b|aplicação|aplic\.|resgate\b|portabilidade/.test(t)) return "investment"
  if (/tesouro direto|tesourodireto|tit pub|titulo publico/.test(t)) return "investment"
  if (/cdb\b|lci\b|lca\b|cri\b|cra\b|debenture|fundo invest/.test(t)) return "investment"
  if (/dividendo|div\. acao|jscp|juros sobre capital|rendimento fii|amortizacao fii/.test(t)) return "investment"
  if (/corretagem|taxa b3|emolumento|nota corretagem/.test(t)) return "investment"
  if (/\bb3\b|bovespa|bmf\b|clearing/.test(t)) return "investment"
  if (/staking|yield|airdrop|cripto|bitcoin|ethereum|btc\b|eth\b|bnb\b|usdt/.test(t)) return "investment"

  // 3. Transferências entre contas próprias
  if (/transf.*propri|ted.*propri|pix.*propri|conta propria|entre contas/.test(t)) return "transfer"
  if (/transf inter|transf interna|portabilidade salarial/.test(t)) return "transfer"

  // 4. Renda real (créditos que não são investimento)
  if (amount > 0) return "income"

  // 5. Gasto real (padrão para débitos)
  return "expense"
}

// ── Categorização automática ───────────────────────────────────

export function detectCategory(description: string): string {
  const t = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (/mercado|supermercado|padaria|acougue|hortifruti|feira|extra|carrefour|pao de acucar|atacadao|assai/.test(t))
    return "Alimentação"
  if (/ifood|rappi|uber eats|delivery|restaurante|lanchonete|pizzaria|hamburguer|sushi|churrascaria|cafe|cafeteria/.test(t))
    return "Alimentação"
  if (/aluguel|condominio|iptu|moradia|imovel|financiamento imob/.test(t))
    return "Moradia"
  if (/uber|99|cabify|taxi|metro|onibus|combustivel|gasolina|etanol|estacionamento|pedagio|calcular/.test(t))
    return "Transporte"
  if (/salario|salário|freelance|pix recebido|ted recebida|transferencia recebida|remuneracao/.test(t))
    return "Renda"
  if (/luz|energia|agua|gas|internet|telefone|celular|tim|vivo|claro|oi|net|sky/.test(t))
    return "Contas"
  if (/farmacia|saude|medico|hospital|clinica|plano de saude|dentista|laboratorio|exame/.test(t))
    return "Saúde"
  if (/escola|curso|faculdade|livro|udemy|alura|coursera|educacao|mensalidade escola/.test(t))
    return "Educação"
  if (/cinema|netflix|spotify|amazon prime|disney|hbo|lazer|viagem|hotel|airbnb|ingresso/.test(t))
    return "Lazer"
  if (/roupa|vestuario|calcado|loja|shopping|magazine|americanas|renner|riachuelo/.test(t))
    return "Vestuário"
  if (/investimento|tesouro|cdb|renda fixa|acao|fundo|corretora|xp|btg|nuinvest/.test(t))
    return "Investimentos"
  if (/imposto|ir|irpf|inss|contribuicao|taxa|cartorio|notario/.test(t))
    return "Impostos"

  return "Outros"
}

// ── Agrupamentos e cálculos ────────────────────────────────────

export interface MonthlySummaryData {
  income: number
  expense: number
  investment: number  // movimentações de investimento (saída)
  reversal: number    // estornos e cancelamentos
  total: number
}

export function groupByMonth(transactions: Transaction[]): MonthlyData {
  const result: MonthlyData = {}
  for (const item of transactions) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`
    if (!result[key]) result[key] = { income: 0, expense: 0, investment: 0, reversal: 0, total: 0 }

    const kind = item.kind ?? (item.type === "income" ? "income" : "expense")

    if (kind === "income") {
      result[key].income += item.amount
      result[key].total += item.amount
    } else if (kind === "expense") {
      result[key].expense += item.amount
      result[key].total += item.amount
    } else if (kind === "investment") {
      result[key].investment += item.amount
    } else if (kind === "reversal") {
      result[key].reversal += Math.abs(item.amount)
    }
    // transfer: ignora totalmente nos agrupamentos
  }
  return result
}

export function groupByCategory(transactions: Transaction[]): CategoryData {
  const result: CategoryData = {}
  for (const item of transactions) {
    const kind = item.kind ?? (item.type === "income" ? "income" : "expense")
    // Só conta gastos reais — exclui investimentos, transferências e estornos
    if (kind !== "expense") continue
    if (!result[item.category]) result[item.category] = 0
    result[item.category] += Math.abs(item.amount)
  }
  return result
}

export function computeSummary(
  transactions: Transaction[],
  monthlyData: MonthlyData,
  categoryData: CategoryData
): FinanceSummary {
  let totalIncome = 0
  let totalExpense = 0
  let totalInvested = 0
  let totalReversals = 0
  let investmentCount = 0
  let reversalCount = 0

  for (const item of transactions) {
    const kind = item.kind ?? (item.type === "income" ? "income" : "expense")
    if (kind === "income")      { totalIncome += item.amount }
    else if (kind === "expense") { totalExpense += item.amount }
    else if (kind === "investment") {
      if (item.amount < 0) totalInvested += Math.abs(item.amount)  // saída p/ investimento
      investmentCount++
    } else if (kind === "reversal") {
      totalReversals += Math.abs(item.amount)
      reversalCount++
    }
    // transfer: ignora
  }

  const monthCount = Math.max(Object.keys(monthlyData).length, 1)
  const monthlyAverage = Math.abs(totalExpense) / monthCount

  let topCategory = "N/A"
  let topCategoryAmount = 0
  for (const [cat, val] of Object.entries(categoryData)) {
    if (val > topCategoryAmount) { topCategory = cat; topCategoryAmount = val }
  }

  return {
    totalIncome, totalExpense,
    totalInvested, totalReversals,
    balance: totalIncome + totalExpense,
    monthlyAverage, topCategory, topCategoryAmount,
    transactionCount: transactions.length,
    investmentCount, reversalCount,
  }
}

// ── Simulador de investimentos ─────────────────────────────────

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
  annualRate: number
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
    if (i < months) { currentValue += monthlyContribution; totalInvested += monthlyContribution }
  }
  return results
}

// ── CSVs de exemplo por banco ──────────────────────────────────

export const SAMPLE_CSVS: Record<string, { label: string; logo: string; content: string }> = {
  generic: {
    label: "Genérico",
    logo: "📄",
    content: `Data,Descricao,Valor
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
28/01/2025,Freelance,1200.00`,
  },
  nubank: {
    label: "Nubank",
    logo: "🟣",
    content: `Data,Descrição,Valor
2025-01-01,Salário,5500.00
2025-01-03,Mercado Livre,-189.90
2025-01-05,iFood,-45.00
2025-01-07,Netflix,-55.90
2025-01-10,Pix Enviado Aluguel,-1800.00
2025-01-12,Conta de Luz,-180.50
2025-01-15,Farmácia,-89.00
2025-01-18,Uber,-42.00
2025-01-20,Freelance recebido,1200.00
2025-01-22,Supermercado Pão de Açúcar,-412.30`,
  },
  inter: {
    label: "Banco Inter",
    logo: "🟠",
    content: `Data,Lançamento,Tipo,Valor
01/01/2025,Pix Recebido Salário,C,5500.00
03/01/2025,Pix Enviado Supermercado,D,320.00
05/01/2025,Débito Automatico Luz,D,180.50
07/01/2025,Pix Enviado Aluguel,D,1800.00
10/01/2025,Uber,D,35.90
12/01/2025,iFood,D,67.00
15/01/2025,Transferência Recebida Freelance,C,1200.00
18/01/2025,Farmácia,D,89.00
20/01/2025,Netflix,D,55.90
22/01/2025,Gasolina,D,200.00`,
  },
  itau: {
    label: "Itaú",
    logo: "🔵",
    content: `Data;Histórico;Docto;Crédito;Débito;Saldo
01/01/2025;CREDITO SALARIO;;;5.500,00;14.200,00
03/01/2025;COMPRA DÉBITO SUPERMERCADO;;;450,30;13.749,70
05/01/2025;DÉBITO AUTOMÁTICO ENERGIA;;;180,50;13.569,20
07/01/2025;PIX ENVIADO ALUGUEL;;;1.800,00;11.769,20
10/01/2025;COMPRA UBER;;;35,90;11.733,30
15/01/2025;TED RECEBIDA FREELANCE;;1.200,00;;12.933,30
18/01/2025;COMPRA FARMACIA;;;89,00;12.844,30
20/01/2025;DÉBITO AUTOMÁTICO NETFLIX;;;55,90;12.788,40`,
  },
  bradesco: {
    label: "Bradesco",
    logo: "🔴",
    content: `Extrato de Conta Corrente
Agência: 1234-5  Conta: 98765-6
Período: 01/01/2025 a 31/01/2025

Data;Histórico;Docto;Valor;Saldo
01/01/2025;CREDITO EM CONTA SALARIO;;5500,00;12.500,00
03/01/2025;COMPRA DÉBITO ATACADÃO;;-450,30;12.049,70
05/01/2025;DEB AUT CEMIG;;-180,50;11.869,20
07/01/2025;PIX ENVIADO ALUGUEL;;-1800,00;10.069,20
15/01/2025;TED RECEBIDA;;1200,00;11.269,20
20/01/2025;COMPRA DEB FARMÁCIA;;-89,00;11.180,20`,
  },
}

/** @deprecated Use SAMPLE_CSVS.generic.content */
export const SAMPLE_CSV = SAMPLE_CSVS.generic.content