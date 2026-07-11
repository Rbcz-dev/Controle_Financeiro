"use client"

import React, { useCallback, useRef, useState } from "react"
import {
  Upload, FileText, X, Download, AlertCircle, Loader2,
  CheckCircle2, ChevronDown, RefreshCw, Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  parseStatement, applyManualMapping, SAMPLE_CSVS as SAMPLE_CSVS_LIB,
  type ParseResult, type ColumnMapping, type Transaction,
} from "@/lib/finance"

// ── Fallback local caso finance.ts ainda não tenha sido atualizado ──
const SAMPLE_CSVS_FALLBACK: Record<string, { label: string; logo: string; content: string }> = {
  generic: {
    label: "Genérico",
    logo: "📄",
    content: `Data,Descricao,Valor
01/01/2025,Salario,5500.00
03/01/2025,Supermercado,-450.30
05/01/2025,Uber,-35.90
10/01/2025,Aluguel,-1800.00
12/01/2025,Conta de Luz,-180.50
28/01/2025,Freelance,1200.00`,
  },
  nubank: {
    label: "Nubank",
    logo: "🟣",
    content: `Data,Descrição,Valor
2025-01-01,Salário,5500.00
2025-01-03,Mercado Livre,-189.90
2025-01-05,iFood,-45.00
2025-01-10,Pix Enviado Aluguel,-1800.00
2025-01-20,Freelance recebido,1200.00`,
  },
  inter: {
    label: "Inter",
    logo: "🟠",
    content: `Data,Lançamento,Tipo,Valor
01/01/2025,Pix Recebido Salário,C,5500.00
03/01/2025,Pix Enviado Supermercado,D,320.00
07/01/2025,Pix Enviado Aluguel,D,1800.00
15/01/2025,Transferência Recebida,C,1200.00`,
  },
  itau: {
    label: "Itaú",
    logo: "🔵",
    content: `Data;Histórico;Docto;Crédito;Débito;Saldo
01/01/2025;CREDITO SALARIO;;;5.500,00;14.200,00
03/01/2025;COMPRA DÉBITO SUPERMERCADO;;;450,30;13.749,70
07/01/2025;PIX ENVIADO ALUGUEL;;;1.800,00;11.769,20
15/01/2025;TED RECEBIDA FREELANCE;;1.200,00;;12.933,30`,
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
07/01/2025;PIX ENVIADO ALUGUEL;;-1800,00;10.069,20`,
  },
}

// Usa os samples do lib se disponível, senão usa o fallback local
const SAMPLE_CSVS: Record<string, { label: string; logo: string; content: string }> =
  (typeof SAMPLE_CSVS_LIB !== "undefined" && SAMPLE_CSVS_LIB !== null && Object.keys(SAMPLE_CSVS_LIB).length > 0)
    ? SAMPLE_CSVS_LIB
    : SAMPLE_CSVS_FALLBACK

// ── Tipos ────────────────────────────────────────────────────

interface FileUploadProps {
  onFileLoaded: (transactions: Transaction[]) => void
}

type Step = "idle" | "loading" | "mapping" | "done" | "error"

type DateFormatOption = "DD/MM/YYYY" | "YYYY-MM-DD" | "DD/MM/YY" | "YYYY/MM/DD"
type ValueFormatOption = "br" | "us"

// ── Helpers ───────────────────────────────────────────────────

/** Lê o arquivo como texto, tentando UTF-8 e depois windows-1252 */
function readFileWithEncoding(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const tryRead = (encoding: string) =>
      new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result as string)
        reader.onerror = () => rej(new Error("Erro ao ler o arquivo"))
        reader.readAsText(file, encoding)
      })

    tryRead("UTF-8")
      .then((text) => {
        // Se há muitos caracteres de substituição, tenta latin1
        const badChars = (text.match(/\uFFFD/g) || []).length
        if (badChars > 3) {
          return tryRead("windows-1252")
        }
        return text
      })
      .then(resolve)
      .catch(reject)
  })
}

// ── Componente principal ──────────────────────────────────────

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [step, setStep] = useState<Step>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [rawText, setRawText] = useState<string>("")

  // Mapeamento manual
  const [dateCol, setDateCol] = useState("")
  const [descCol, setDescCol] = useState("")
  const [valueCol, setValueCol] = useState("")
  const [creditCol, setCreditCol] = useState("")
  const [debitCol, setDebitCol] = useState("")
  const [typeCol, setTypeCol] = useState("")
  const [dateFormat, setDateFormat] = useState<DateFormatOption>("DD/MM/YYYY")
  const [valueFormat, setValueFormat] = useState<ValueFormatOption>("br")
  const [negIsDebit, setNegIsDebit] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Processar arquivo ───────────────────────────────────────

  const processFile = useCallback(
    async (file: File) => {
      const allowed = [".csv", ".txt", ".ofx"]
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      if (!allowed.includes(ext)) {
        setError("Formato não suportado. Use arquivos .csv, .txt ou .ofx.")
        setStep("error")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Arquivo muito grande. Tamanho máximo: 10 MB.")
        setStep("error")
        return
      }

      setStep("loading")
      setError(null)
      setFileName(file.name)

      try {
        const text = await readFileWithEncoding(file)
        setRawText(text)

        // Verifica se o finance.ts já foi atualizado com parseStatement
        if (typeof parseStatement !== "function") {
          setError(
            "Atualize também o arquivo lib/finance.ts para habilitar a detecção automática de bancos. " +
            "Por enquanto, use o mapeamento manual abaixo."
          )
          // Fallback: tenta detectar cabeçalho básico para mapeamento manual
          const lines = text.replace(/\r\n/g, "\n").split("\n").filter(Boolean)
          const sep = lines[0]?.includes(";") ? ";" : ","
          const headers = lines[0]?.split(sep).map((h) => h.trim().replace(/"/g, "")) ?? []
          const rawRows = lines.slice(1, 6).map((l) =>
            l.split(sep).map((c) => c.trim().replace(/"/g, ""))
          )
          setParseResult({
            bankId: "generic",
            bankName: "Banco Não Identificado",
            bankLogo: "🏦",
            transactions: [],
            detectedHeaders: headers,
            rawRows,
            separator: sep,
            needsMapping: true,
            skippedLines: 0,
            warnings: ["Detecção automática indisponível — mapeie as colunas manualmente."],
          } as ParseResult)
          setStep("mapping")
          return
        }

        const result = parseStatement(text)
        setParseResult(result)

        if (result.needsMapping) {
          // Preenche sugestões automáticas para o mapeamento manual
          const h = result.detectedHeaders
          const find = (keywords: string[]) =>
            h.find((col) =>
              keywords.some((k) =>
                col.toLowerCase().includes(k)
              )
            ) ?? ""

          setDateCol(find(["data", "date"]))
          setDescCol(find(["descri", "histor", "lancam", "lançam"]))
          setValueCol(find(["valor", "value", "amount"]))
          setStep("mapping")
        } else {
          onFileLoaded(result.transactions)
          setStep("done")
        }
      } catch (e) {
        setError("Erro ao processar o arquivo. Verifique se é um extrato válido.")
        setStep("error")
      }
    },
    [onFileLoaded]
  )

  // ── Confirmar mapeamento manual ─────────────────────────────

  const confirmMapping = useCallback(() => {
    if (!rawText || !parseResult) return
    if (!dateCol || !descCol || (!valueCol && !creditCol && !debitCol)) {
      setError("Selecione pelo menos as colunas de Data, Descrição e Valor.")
      return
    }

    const mapping: ColumnMapping = {
      dateCol,
      descriptionCol: descCol,
      valueCol: valueCol || undefined,
      creditCol: creditCol || undefined,
      debitCol: debitCol || undefined,
      typeCol: typeCol || undefined,
    }

    let transactions: Transaction[] = []

    if (typeof applyManualMapping === "function") {
      transactions = applyManualMapping(rawText, mapping, {
        separator: parseResult.separator,
        headerLine: parseResult.skippedLines,
        dateFormat,
        valueFormat,
        negativeIsDebit: negIsDebit,
      })
    } else {
      // Fallback mínimo enquanto finance.ts não for atualizado
      setError("Atualize o arquivo lib/finance.ts para habilitar o mapeamento manual completo.")
      return
    }

    if (transactions.length === 0) {
      setError("Nenhuma transação foi encontrada com esse mapeamento. Verifique as colunas e formatos.")
      return
    }

    onFileLoaded(transactions)
    setStep("done")
    setError(null)
  }, [rawText, parseResult, dateCol, descCol, valueCol, creditCol, debitCol, typeCol, dateFormat, valueFormat, negIsDebit, onFileLoaded])

  // ── Carregar exemplo ────────────────────────────────────────

  const loadSample = useCallback(
    (bankId = "generic") => {
      const sample = SAMPLE_CSVS[bankId]
      if (!sample) return
      setRawText(sample.content)
      setFileName(`exemplo-${bankId}.csv`)
      if (typeof parseStatement !== "function") {
        // Fallback: mapeamento manual com os cabeçalhos do sample
        const lines = sample.content.replace(/\r\n/g, "\n").split("\n").filter(Boolean)
        const sep = lines[0]?.includes(";") ? ";" : ","
        const headers = lines[0]?.split(sep).map((h) => h.trim().replace(/"/g, "")) ?? []
        const rawRows = lines.slice(1, 6).map((l) =>
          l.split(sep).map((c) => c.trim().replace(/"/g, ""))
        )
        setParseResult({
          bankId: "generic", bankName: "Genérico", bankLogo: "📄",
          transactions: [], detectedHeaders: headers, rawRows,
          separator: sep, needsMapping: true, skippedLines: 0,
          warnings: ["Instale o finance.ts atualizado para detecção automática."],
        } as ParseResult)
        setStep("mapping")
        return
      }
      const result = parseStatement(sample.content)
      setParseResult(result)
      if (!result.needsMapping) {
        onFileLoaded(result.transactions)
        setStep("done")
      } else {
        setStep("mapping")
      }
    },
    [onFileLoaded]
  )

  const downloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSVS.generic.content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "exemplo-extrato.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const reset = useCallback(() => {
    setStep("idle")
    setFileName(null)
    setError(null)
    setParseResult(null)
    setRawText("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  // ── Drag & drop ─────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // ── Render: drop zone ────────────────────────────────────────

  const DropZone = () => (
    <Card className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
          className="flex flex-col items-center justify-center gap-4 p-10 cursor-pointer rounded-lg hover:bg-muted/40 transition-colors"
        >
          <input ref={fileInputRef} type="file" accept=".csv,.txt,.ofx" onChange={handleInputChange} className="sr-only" />

          {step === "loading" ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Detectando banco e processando...</p>
            </div>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">
                  Arraste o extrato aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporta <strong>.ofx</strong> (detecção automática) e <strong>.csv / .txt</strong> de qualquer banco brasileiro
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                <Badge variant="outline" className="text-[10px] gap-1 border-primary/50 text-primary font-semibold">
                  ✦ OFX automático
                </Badge>
                {Object.values(SAMPLE_CSVS).slice(0, 4).map((s) => (
                  <Badge key={s.label} variant="secondary" className="text-[10px] gap-1">
                    {s.logo} {s.label}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-[10px]">+ outros CSV</Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // ── Render: resultado (banco detectado) ──────────────────────

  const DoneState = () => {
    if (!parseResult) return null
    return (
      <Card className="border-emerald-800/40 bg-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{fileName}</span>
                  <Badge variant="outline" className="text-[10px] gap-1 border-emerald-700 text-emerald-400">
                    {parseResult.bankLogo} {parseResult.bankName}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {parseResult.transactions.length} transações importadas com sucesso
                  {parseResult.skippedLines > 0 && ` · ${parseResult.skippedLines} linha(s) de cabeçalho ignoradas`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              Trocar arquivo
            </Button>
          </div>

          {parseResult.warnings.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {parseResult.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Render: mapeamento manual ────────────────────────────────

  const MappingForm = () => {
    if (!parseResult) return null
    const headers = parseResult.detectedHeaders
    const noValue = !valueCol && !creditCol && !debitCol

    const ColSelect = ({
      label, value, onChange, required = false, description,
    }: {
      label: string
      value: string
      onChange: (v: string) => void
      required?: boolean
      description?: string
    }) => (
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-red-400">*</span>}
        </Label>
        <Select value={value || "_none"} onValueChange={(v) => onChange(v === "_none" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder="Selecione a coluna..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none" className="text-xs text-muted-foreground">
              — Não usar
            </SelectItem>
            {headers.map((h) => (
              <SelectItem key={h} value={h} className="text-xs">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    )

    return (
      <div className="flex flex-col gap-4">
        {/* Cabeçalho do formulário */}
        <Card className="border-amber-800/40 bg-amber-950/15">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Banco não identificado automaticamente
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Encontramos <strong>{headers.length} colunas</strong> no arquivo <strong>{fileName}</strong>.
                  Indique quais colunas correspondem a cada campo para importar corretamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview do arquivo */}
        {parseResult.rawRows.length > 0 && (
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Prévia do arquivo (primeiras {parseResult.rawRows.length} linhas)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-3">
              <div className="overflow-x-auto px-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h, i) => (
                        <TableHead key={i} className="text-[11px] whitespace-nowrap py-2">
                          {h || <span className="text-muted-foreground/50">(vazio)</span>}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.rawRows.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-[11px] py-1.5 whitespace-nowrap">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de mapeamento */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Mapeamento de colunas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Colunas obrigatórias */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Campos obrigatórios
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ColSelect
                  label="Data da transação"
                  value={dateCol}
                  onChange={setDateCol}
                  required
                  description='Ex: "Data", "Data lançamento"'
                />
                <ColSelect
                  label="Descrição / Histórico"
                  value={descCol}
                  onChange={setDescCol}
                  required
                  description='Ex: "Descrição", "Histórico", "Lançamento"'
                />
              </div>
            </div>

            {/* Colunas de valor */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Valor — escolha uma das opções abaixo
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">
                Opção A: coluna única (positivo = entrada, negativo = saída) · Opção B: colunas separadas de crédito e débito
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ColSelect
                  label="Coluna de valor único (A)"
                  value={valueCol}
                  onChange={(v) => { setValueCol(v); if (v) { setCreditCol(""); setDebitCol("") } }}
                  description='Ex: "Valor", "Quantia"'
                />
                <ColSelect
                  label="Coluna de crédito (B)"
                  value={creditCol}
                  onChange={(v) => { setCreditCol(v); if (v) setValueCol("") }}
                  description='Ex: "Crédito", "Entrada"'
                />
                <ColSelect
                  label="Coluna de débito (B)"
                  value={debitCol}
                  onChange={(v) => { setDebitCol(v); if (v) setValueCol("") }}
                  description='Ex: "Débito", "Saída"'
                />
              </div>
            </div>

            {/* Coluna de tipo */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Campos opcionais
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ColSelect
                  label="Tipo de lançamento (D/C)"
                  value={typeCol}
                  onChange={setTypeCol}
                  description='Coluna com "D" para débito e "C" para crédito (Inter, alguns bancos)'
                />
              </div>
            </div>

            {/* Formatos */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-border">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Formato da data</Label>
                <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormatOption)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY" className="text-xs">DD/MM/AAAA — ex: 15/01/2025</SelectItem>
                    <SelectItem value="YYYY-MM-DD" className="text-xs">AAAA-MM-DD — ex: 2025-01-15</SelectItem>
                    <SelectItem value="DD/MM/YY" className="text-xs">DD/MM/AA — ex: 15/01/25</SelectItem>
                    <SelectItem value="YYYY/MM/DD" className="text-xs">AAAA/MM/DD — ex: 2025/01/15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Formato do valor</Label>
                <Select value={valueFormat} onValueChange={(v) => setValueFormat(v as ValueFormatOption)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="br" className="text-xs">Brasileiro — ex: 1.234,56</SelectItem>
                    <SelectItem value="us" className="text-xs">Internacional — ex: 1234.56</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Valor negativo significa</Label>
                <Select
                  value={negIsDebit ? "debit" : "credit"}
                  onValueChange={(v) => setNegIsDebit(v === "debit")}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit" className="text-xs">Saída/Débito (padrão)</SelectItem>
                    <SelectItem value="credit" className="text-xs">Entrada/Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={confirmMapping} disabled={!dateCol || !descCol || noValue} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Confirmar e importar
              </Button>
              <Button variant="ghost" onClick={reset} className="gap-1.5 text-muted-foreground">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Render final ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Estado: ocioso, carregando ou erro → mostra drop zone */}
      {(step === "idle" || step === "loading" || step === "error") && <DropZone />}

      {/* Erro fora do loading */}
      {step === "error" && error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={reset} className="h-7 w-7 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Botões de exemplo (só no estado inicial) */}
      {step === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-xs text-muted-foreground">ou carregue um extrato de exemplo</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(SAMPLE_CSVS).map(([id, s]) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => loadSample(id)}
                className="gap-1.5 text-xs bg-transparent"
              >
                {s.logo} {s.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadSample}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar CSV
            </Button>
          </div>
        </div>
      )}

      {/* Estado: mapeamento manual */}
      {step === "mapping" && <MappingForm />}

      {/* Estado: concluído */}
      {step === "done" && <DoneState />}
    </div>
  )
}