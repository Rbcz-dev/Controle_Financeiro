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
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, PenLine } from "lucide-react"

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

  const handleAdd = useCallback(() => {
    if (!date || !description || !amount) return

    const parsedAmount = parseFloat(amount.replace(",", "."))
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    const finalAmount = type === "expense" ? -Math.abs(parsedAmount) : Math.abs(parsedAmount)

    // Parse date: handle DD/MM/YYYY or YYYY-MM-DD
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

    if (isNaN(parsedDate.getTime())) return

    const newTransaction: Transaction = {
      date: parsedDate,
      description,
      category,
      amount: finalAmount,
      type,
    }

    const updated = [...manualTransactions, newTransaction]
    onTransactionsChange(updated)

    // Clear form
    setDescription("")
    setAmount("")
  }, [date, description, amount, type, category, manualTransactions, onTransactionsChange])

  const handleRemove = useCallback(
    (index: number) => {
      const updated = manualTransactions.filter((_, i) => i !== index)
      onTransactionsChange(updated)
    },
    [manualTransactions, onTransactionsChange],
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold text-foreground">
            Entrada Manual
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Adicione seus gastos e ganhos manualmente.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Form */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manual-date" className="text-xs text-muted-foreground">
                Data
              </Label>
              <Input
                id="manual-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background"
              />
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
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background"
              />
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
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select
                value={type}
                onValueChange={(val: "income" | "expense") => setType(val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="income">Ganho</SelectItem>
                </SelectContent>
              </Select>
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
            disabled={!date || !description || !amount}
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
