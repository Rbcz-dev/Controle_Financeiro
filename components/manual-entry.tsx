"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, type Transaction } from "@/lib/finance"
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  PenLine,
  CalendarClock,
  Eraser,
} from "lucide-react"
import { toast } from "sonner"

const CATEGORIES = [
  "Alimentacao",
  "Moradia",
  "Transporte",
  "Renda",
  "Contas",
  "Saude",
  "Educacao",
  "Lazer",
  "Outros",
]

interface ManualEntryProps {
  onTransactionsChange: (transactions: Transaction[]) => void
  manualTransactions: Transaction[]
}

export function ManualEntry({ onTransactionsChange, manualTransactions }: ManualEntryProps) {
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [category, setCategory] = useState("Outros")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setToday = useCallback(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    setDate(`${yyyy}-${mm}-${dd}`)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.date
      return next
    })
  }, [])

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!date) newErrors.date = "Informe a data"
    if (!description.trim()) newErrors.description = "Informe a descricao"

    if (!amount) {
      newErrors.amount = "Informe o valor"
    } else {
      const parsed = parseFloat(amount.replace(",", "."))
      if (isNaN(parsed) || parsed <= 0) newErrors.amount = "Valor invalido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [date, description, amount])

  const handleAdd = useCallback(() => {
    if (!validate()) return

    const parsedAmount = parseFloat(amount.replace(",", "."))
    const finalAmount = type === "expense" ? -Math.abs(parsedAmount) : Math.abs(parsedAmount)

    let parsedDate: Date
    if (date.includes("/")) {
      const parts = date.split("/")
      if (parts[0].length === 4) {
        parsedDate = new Date(date)
      } else {
        parsedDate = new Date(parts.reverse().join("-"))
      }
    } else {
      parsedDate = new Date(date)
    }

    if (isNaN(parsedDate.getTime())) {
      setErrors((prev) => ({ ...prev, date: "Data invalida" }))
      return
    }

    const newTransaction: Transaction = {
      date: parsedDate,
      description: description.trim(),
      category,
      amount: finalAmount,
      type,
    }

    const updated = [...manualTransactions, newTransaction]
    onTransactionsChange(updated)

    toast.success("Transacao adicionada", {
      description: `${description.trim()} - ${formatCurrency(Math.abs(parsedAmount))}`,
    })

    setDescription("")
    setAmount("")
    setErrors({})
  }, [date, description, amount, type, category, manualTransactions, onTransactionsChange, validate])

  const handleRemove = useCallback(
    (index: number) => {
      const removed = manualTransactions[index]
      const updated = manualTransactions.filter((_, i) => i !== index)
      onTransactionsChange(updated)
      toast("Transacao removida", {
        description: removed.description,
      })
    },
    [manualTransactions, onTransactionsChange],
  )

  const handleClearAll = useCallback(() => {
    onTransactionsChange([])
    toast("Todas as transacoes manuais foram removidas")
  }, [onTransactionsChange])

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
      switch (field) {
        case "date":
          setDate(value)
          break
        case "description":
          setDescription(value)
          break
        case "amount":
          setAmount(value)
          break
      }
    },
    [errors],
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold text-foreground">
            Adicionar Transacao
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Registre seus gastos e ganhos manualmente para acompanhar sua situacao financeira.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {/* Type toggle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Tipo da transacao</Label>
            <div className="flex rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                  type === "expense"
                    ? "bg-red-500 text-white shadow-sm dark:bg-red-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-sm dark:bg-emerald-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Ganho
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-date" className="text-xs text-muted-foreground">
                Data
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id="manual-date"
                  type="date"
                  value={date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  className={`bg-background flex-1 ${errors.date ? "border-destructive" : ""}`}
                  aria-invalid={!!errors.date}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={setToday}
                  className="shrink-0 bg-transparent"
                  title="Usar data de hoje"
                  aria-label="Usar data de hoje"
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
              </div>
              {errors.date && (
                <span className="text-xs text-destructive">{errors.date}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-desc" className="text-xs text-muted-foreground">
                Descricao
              </Label>
              <Input
                id="manual-desc"
                type="text"
                placeholder="Ex: Supermercado"
                value={description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                }}
                className={`bg-background ${errors.description ? "border-destructive" : ""}`}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <span className="text-xs text-destructive">{errors.description}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-amount" className="text-xs text-muted-foreground">
                Valor (R$)
              </Label>
              <Input
                id="manual-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => handleFieldChange("amount", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                }}
                className={`bg-background ${errors.amount ? "border-destructive" : ""}`}
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <span className="text-xs text-destructive">{errors.amount}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="w-full sm:w-auto sm:self-start gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Adicionar transacao
          </Button>

          {/* List of manual transactions */}
          {manualTransactions.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Transacoes manuais ({manualTransactions.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpar tudo
                </Button>
              </div>
              <ScrollArea className={manualTransactions.length > 5 ? "h-[260px]" : ""}>
                <div className="flex flex-col gap-2">
                  {manualTransactions.map((item, index) => (
                    <div
                      key={`manual-${index}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            item.type === "income"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400"
                          }`}
                        >
                          {item.type === "income" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground line-clamp-1">
                            {item.description}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {item.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {item.date.toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            item.type === "income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Remover transacao"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
