"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Transaction } from "@/lib/finance"
import { formatCurrency } from "@/lib/finance"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Transacoes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[380px] px-6 pb-6">
          <div className="flex flex-col gap-2">
            {transactions.map((item, index) => (
              <div
                key={`${item.description}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      item.type === "income"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
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
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    item.type === "income"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
