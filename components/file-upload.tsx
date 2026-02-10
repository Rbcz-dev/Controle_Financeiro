"use client"

import React, { useCallback, useRef, useState } from "react"
import { Upload, FileText, X, Download, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SAMPLE_CSV } from "@/lib/finance"

interface FileUploadProps {
  onFileLoaded: (content: string) => void
}

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processContent = useCallback(
    (content: string, name: string) => {
      setIsLoading(true)
      setError(null)

      setTimeout(() => {
        try {
          const lines = content.trim().split("\n")
          if (lines.length < 2) {
            setError("O arquivo CSV precisa ter pelo menos um cabecalho e uma linha de dados.")
            setIsLoading(false)
            return
          }

          const separator = lines[0].includes(";") ? ";" : ","
          const headers = lines[0].split(separator).map((h) => h.trim().replace(/"/g, ""))
          const rows = lines.slice(1, Math.min(6, lines.length)).map((line) =>
            line.split(separator).map((v) => v.trim().replace(/"/g, "")),
          )

          setPreview([headers, ...rows])
          setFileName(name)
          onFileLoaded(content)
        } catch {
          setError("Erro ao processar o arquivo. Verifique se o formato CSV esta correto.")
        } finally {
          setIsLoading(false)
        }
      }, 400)
    },
    [onFileLoaded],
  )

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Por favor, selecione um arquivo CSV (.csv).")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("O arquivo e muito grande. Tamanho maximo: 5MB.")
        return
      }
      setError(null)
      const reader = new FileReader()
      reader.onload = () => {
        processContent(reader.result as string, file.name)
      }
      reader.onerror = () => {
        setError("Erro ao ler o arquivo. Tente novamente.")
      }
      reader.readAsText(file)
    },
    [processContent],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const clearFile = useCallback(() => {
    setFileName(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const downloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "exemplo-extrato.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const loadSample = useCallback(() => {
    processContent(SAMPLE_CSV, "exemplo-extrato.csv")
  }, [processContent])

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-2 border-dashed border-border bg-card">
        <CardContent className="p-0">
          <div
            role="button"
            tabIndex={0}
            aria-label="Area de upload de arquivo CSV"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click()
              }
            }}
            className={`flex flex-col items-center justify-center gap-4 p-8 transition-colors cursor-pointer rounded-lg ${
              isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleInputChange}
              className="sr-only"
              aria-label="Selecionar arquivo CSV"
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processando arquivo...</p>
              </div>
            ) : fileName ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{fileName}</span>
                  <span className="text-xs text-muted-foreground">Arquivo carregado com sucesso</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearFile()
                  }}
                  className="h-8 w-8"
                  aria-label="Remover arquivo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-medium text-foreground">Arraste seu extrato CSV aqui</p>
                  <p className="text-xs text-muted-foreground">ou clique para selecionar o arquivo</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Colunas: Data, Descricao, Valor
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!fileName && !isLoading && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={downloadSample} className="gap-1.5 bg-transparent">
            <Download className="h-3.5 w-3.5" />
            Baixar CSV exemplo
          </Button>
          <Button variant="ghost" size="sm" onClick={loadSample} className="gap-1.5 text-primary hover:text-primary">
            Carregar dados de exemplo
          </Button>
        </div>
      )}

      {preview && preview.length > 1 && (
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pre-visualizacao (primeiras {preview.length - 1} linhas)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="overflow-x-auto px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {preview[0].map((header, i) => (
                      <TableHead key={`h-${i}`} className="text-xs whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(1).map((row, i) => (
                    <TableRow key={`r-${i}`}>
                      {row.map((cell, j) => (
                        <TableCell key={`c-${i}-${j}`} className="text-xs py-2 whitespace-nowrap">
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
    </div>
  )
}
