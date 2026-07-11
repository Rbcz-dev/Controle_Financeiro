"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Shield, X, ChevronRight, Info } from "lucide-react"

type Investment = {
  name: string
  icon: string
  risk: 1 | 2 | 3 | 4 | 5
  liquidity: string
  minValue: string
  irExempt: boolean
  fgc: boolean
  description: string
  howItWorks: string
  example: {
    scenario: string
    steps: string[]
    conclusion: string
  }
  pros: string[]
  cons: string[]
}

type Category = {
  label: string
  icon: string
  color: string
  items: Investment[]
}

const CATEGORIES: Category[] = [
  {
    label: "Títulos Públicos",
    icon: "🏛️",
    color: "text-amber-500",
    items: [
      {
        name: "Tesouro Selic",
        icon: "🏛️",
        risk: 1,
        liquidity: "Alta",
        minValue: "R$ 100",
        irExempt: false,
        fgc: false,
        description:
          "Título público federal pós-fixado indexado à taxa Selic. O investimento mais seguro do Brasil — garantido pelo Tesouro Nacional. Ideal para reserva de emergência.",
        howItWorks:
          "O rendimento acompanha a Selic diariamente. Se a Selic subir, o rendimento sobe junto. Resgate disponível a qualquer momento sem perda de valor.",
        example: {
          scenario: "João aplica R$ 10.000 de reserva de emergência",
          steps: [
            "Selic em 13,75% ao ano",
            "Após 12 meses, rendimento bruto ≈ R$ 1.375",
            "IR de 17,5% (prazo entre 361–720 dias): ≈ R$ 240,62",
            "Rendimento líquido: ≈ R$ 1.134",
            "Saldo final: ≈ R$ 11.134",
          ],
          conclusion: "Mais seguro e mais rentável que a poupança, com liquidez diária.",
        },
        pros: ["Investimento mais seguro do Brasil", "Alta liquidez — resgate diário", "Acessível a partir de R$ 100"],
        cons: ["Paga IR (tabela regressiva)", "Rendimento menor que produtos de crédito privado"],
      },
      {
        name: "Tesouro IPCA+",
        icon: "📊",
        risk: 2,
        liquidity: "Média",
        minValue: "R$ 100",
        irExempt: false,
        fgc: false,
        description:
          "Título híbrido: paga IPCA (inflação) + taxa prefixada. Garante rentabilidade real acima da inflação. Ideal para objetivos de longo prazo.",
        howItWorks:
          "Rendimento = variação do IPCA + taxa fixa adicional contratada na compra (ex: IPCA+6%). Garante ganho real independente da inflação.",
        example: {
          scenario: "Maria investe R$ 20.000 a IPCA+6% por 10 anos",
          steps: [
            "IPCA do período: 4,5% ao ano",
            "Rendimento total bruto: 10,5% ao ano",
            "Saldo bruto em 10 anos: ≈ R$ 54.400",
            "IR de 15% (acima de 720 dias): ≈ R$ 5.160",
            "Saldo líquido: ≈ R$ 49.240",
          ],
          conclusion: "Garantia de 6% de ganho REAL acima da inflação — protege o poder de compra.",
        },
        pros: ["Protege contra inflação", "Rendimento real garantido", "Ótimo para longo prazo"],
        cons: ["Oscila no curto prazo (marcação a mercado)", "Menos líquido antes do vencimento", "Paga IR"],
      },
      {
        name: "Tesouro Prefixado",
        icon: "🔒",
        risk: 2,
        liquidity: "Média",
        minValue: "R$ 100",
        irExempt: false,
        fgc: false,
        description:
          "Taxa totalmente definida no momento da compra. Você sabe exatamente quanto receberá no vencimento, independente do cenário econômico.",
        howItWorks:
          "A taxa é fixada na compra. Se você comprar a 12,5% ao ano, receberá exatamente isso até o vencimento — se não vender antes.",
        example: {
          scenario: "Carlos investe R$ 15.000 a 12,5% por 3 anos",
          steps: [
            "Rendimento bruto acumulado em 3 anos: ≈ R$ 5.742",
            "IR de 15% (acima de 720 dias): ≈ R$ 861",
            "Rendimento líquido: ≈ R$ 4.881",
            "Saldo final: ≈ R$ 19.881",
          ],
          conclusion: "Vantajoso se a Selic cair abaixo de 12,5% — você trava a taxa alta de hoje.",
        },
        pros: ["Previsibilidade total do retorno", "Vantajoso quando juros tendem a cair"],
        cons: ["Oscila se vender antes do vencimento", "Perde se inflação superar a taxa", "Paga IR"],
      },
    ],
  },
  {
    label: "Títulos Bancários",
    icon: "🏦",
    color: "text-blue-500",
    items: [
      {
        name: "CDB",
        icon: "🏦",
        risk: 1,
        liquidity: "Média/Alta",
        minValue: "R$ 100",
        irExempt: false,
        fgc: true,
        description:
          "Certificado de Depósito Bancário. Você empresta dinheiro ao banco e ele paga juros. Garantido pelo FGC até R$ 250.000 por CPF por instituição.",
        howItWorks:
          "Pode ser pós-fixado (% do CDI), prefixado ou híbrido (IPCA+taxa). Bancos menores geralmente oferecem taxas maiores por terem menor porte.",
        example: {
          scenario: "Fernanda investe R$ 30.000 a 110% do CDI por 2 anos",
          steps: [
            "CDI 13,65% → CDB rende 15,01% ao ano",
            "Rendimento bruto em 2 anos: ≈ R$ 9.606",
            "IR de 17,5% (entre 361–720 dias): ≈ R$ 1.681",
            "Rendimento líquido: ≈ R$ 7.925",
            "Saldo final: ≈ R$ 37.925",
          ],
          conclusion: "Simples, seguro e significativamente mais rentável que a poupança.",
        },
        pros: ["Garantia FGC até R$ 250k", "Alta liquidez (muitos com resgate diário)", "Fácil acesso em qualquer corretora"],
        cons: ["Paga IR (tabela regressiva)", "Bancos grandes pagam taxas baixas"],
      },
      {
        name: "LCI",
        icon: "🏠",
        risk: 1,
        liquidity: "Baixa/Média",
        minValue: "R$ 1.000",
        irExempt: true,
        fgc: true,
        description:
          "Letra de Crédito Imobiliário. O banco capta para financiar o setor imobiliário. Para pessoa física, é totalmente isenta de IR — o grande diferencial.",
        howItWorks:
          "Funciona como CDB, mas isenta de IR para PF. Para ser vantajosa, a taxa líquida da LCI precisa superar a taxa líquida do CDB equivalente.",
        example: {
          scenario: "Roberto compara LCI 92% CDI vs CDB 110% CDI",
          steps: [
            "CDB 110% CDI = 15,01% bruto → 12,38% líquido após IR 17,5%",
            "LCI 92% CDI = 12,56% — mas ISENTA de IR",
            "LCI vence: 12,56% líquido vs CDB 12,38% líquido",
            "Em R$ 50.000 por 2 anos, LCI rende ≈ R$ 180 a mais",
          ],
          conclusion: "A isenção de IR faz diferença real. Compare sempre a taxa líquida, não a nominal.",
        },
        pros: ["Isenta de IR para pessoa física", "Garantia FGC", "Segura como o CDB"],
        cons: ["Carência mínima de 12 meses (após 2023)", "Taxa nominal menor que CDB", "Menos líquida"],
      },
      {
        name: "LCA",
        icon: "🌾",
        risk: 1,
        liquidity: "Baixa/Média",
        minValue: "R$ 1.000",
        irExempt: true,
        fgc: true,
        description:
          "Letra de Crédito do Agronegócio. Mesma estrutura da LCI, mas o dinheiro financia o agronegócio. Isenta de IR para pessoa física.",
        howItWorks:
          "Funciona exatamente como a LCI. A diferença é o lastro (agronegócio vs imobiliário). Mesma lógica de comparação de taxa líquida.",
        example: {
          scenario: "Mariana investe R$ 20.000 a 93% CDI por 1 ano",
          steps: [
            "LCA rende 12,69% ao ano — ISENTA de IR",
            "CDB 110% CDI bruto = 15,01%, líquido após IR 22,5% = 11,63%",
            "LCA supera o CDB em 1,06 p.p. líquido",
            "Diferença em 1 ano sobre R$ 20.000: ≈ R$ 212 a mais",
          ],
          conclusion: "A isenção de IR compensa a taxa nominal menor — vence o CDB de banco grande.",
        },
        pros: ["Isenta de IR para PF", "Garantia FGC", "Suporte ao agronegócio brasileiro"],
        cons: ["Carência mínima de 9 meses", "Pouco líquida", "Taxa nominal menor que CDB"],
      },
    ],
  },
  {
    label: "Crédito Privado",
    icon: "📑",
    color: "text-violet-500",
    items: [
      {
        name: "CRI",
        icon: "🏘️",
        risk: 3,
        liquidity: "Baixa",
        minValue: "R$ 1.000",
        irExempt: true,
        fgc: false,
        description:
          "Certificado de Recebíveis Imobiliários. Securitiza receitas do setor imobiliário (aluguéis, parcelas de imóveis). Isento de IR, sem FGC.",
        howItWorks:
          "Uma securitizadora transforma recebíveis imobiliários em títulos. Você recebe os pagamentos dos devedores. Risco é do lastro, não do banco.",
        example: {
          scenario: "Beatriz investe R$ 10.000 em CRI IPCA+7% por 5 anos",
          steps: [
            "IPCA 4,5% ao ano → rentabilidade total: 11,5% ao ano",
            "Rendimento bruto em 5 anos: ≈ R$ 7.175",
            "IR: ZERO (isento para PF)",
            "Saldo final líquido: ≈ R$ 17.175",
          ],
          conclusion: "Ótimo retorno real + isenção de IR. Analise bem o emissor — não tem FGC.",
        },
        pros: ["Isento de IR para PF", "Retorno atrativo acima do CDI", "Proteção contra inflação (IPCA+)"],
        cons: ["Sem garantia do FGC", "Risco do emissor/devedor", "Baixa liquidez no mercado secundário"],
      },
      {
        name: "CRA",
        icon: "🚜",
        risk: 3,
        liquidity: "Baixa",
        minValue: "R$ 1.000",
        irExempt: true,
        fgc: false,
        description:
          "Certificado de Recebíveis do Agronegócio. Similar ao CRI, mas com lastro em recebíveis do agronegócio. Isento de IR para PF.",
        howItWorks:
          "Securitizadora transforma recebíveis de empresas do agro (vendas de grãos, equipamentos) em títulos. Setor com histórico sólido de pagamentos.",
        example: {
          scenario: "Sérgio investe R$ 20.000 em CRA CDI+2,5% por 3 anos",
          steps: [
            "CDI 13,65% + 2,5% = 16,15% ao ano",
            "Rendimento bruto em 3 anos: ≈ R$ 11.225",
            "IR: ZERO (isento para PF)",
            "Saldo final: ≈ R$ 31.225",
            "CDB equivalente líquido (IR 15%): ≈ R$ 28.540",
            "CRA supera em ≈ R$ 2.685 pela isenção",
          ],
          conclusion: "Isenção + spread alto = excelente retorno. Verifique o rating de crédito do emissor.",
        },
        pros: ["Isento de IR para PF", "Alta rentabilidade com spread sobre CDI", "Lastro no robusto agronegócio"],
        cons: ["Sem FGC", "Risco do emissor e do setor", "Pouco líquido"],
      },
      {
        name: "Debêntures Incentivadas",
        icon: "⚡",
        risk: 3,
        liquidity: "Baixa",
        minValue: "R$ 1.000",
        irExempt: true,
        fgc: false,
        description:
          "Debêntures de empresas de infraestrutura (energia, rodovias, ferrovias, saneamento). Isentas de IR para PF pela Lei 12.431.",
        howItWorks:
          "Empresas de infraestrutura captam para grandes projetos. O governo incentiva com isenção de IR para atrair PF. Alta rentabilidade + isenção.",
        example: {
          scenario: "Paulo investe R$ 30.000 em debênture incentivada IPCA+8% por 7 anos",
          steps: [
            "IPCA 4,5% → rentabilidade total: 12,5% ao ano",
            "Saldo bruto acumulado em 7 anos: ≈ R$ 165.000",
            "IR: ZERO (isento para PF)",
            "CDB equivalente com IR 15%: ≈ R$ 145.250",
            "Ganho pela isenção: ≈ R$ 19.750",
          ],
          conclusion: "Uma das melhores combinações do mercado: spread alto + isenção + setor de infraestrutura sólido.",
        },
        pros: ["Isento de IR para PF", "Altíssima rentabilidade", "Setor de infraestrutura resiliente"],
        cons: ["Sem FGC", "Prazo longo (5–12 anos)", "Risco do projeto e da empresa emissora"],
      },
    ],
  },
  {
    label: "Ações e ETFs",
    icon: "📈",
    color: "text-emerald-500",
    items: [
      {
        name: "Ações ON/PN",
        icon: "📈",
        risk: 5,
        liquidity: "Alta",
        minValue: "R$ 5",
        irExempt: false,
        fgc: false,
        description:
          "Participação societária em empresas. ON dá direito a voto. PN tem prioridade em dividendos. Ganhos via valorização + dividendos isentos de IR.",
        howItWorks:
          "Compra e venda na B3 via corretora. Dividendos são isentos de IR para PF. Venda de ações até R$ 20.000/mês também é isenta.",
        example: {
          scenario: "André compra 100 ações PETR3 a R$ 38,00",
          steps: [
            "Investimento inicial: 100 × R$38 = R$ 3.800",
            "Dividendos pagos no ano: R$ 2,50/ação → R$ 250 (isentos!)",
            "Ação valoriza para R$ 48,00",
            "Venda: 100 × R$48 = R$ 4.800 (lucro de R$1.000 — isento pois <R$20k/mês)",
            "Retorno total: R$250 + R$1.000 = R$1.250 (32,9%)",
          ],
          conclusion: "Alto potencial de retorno. Dividendos e ganhos até R$20k/mês isentos de IR.",
        },
        pros: ["Potencial de valorização ilimitado", "Dividendos isentos de IR", "Venda até R$20k/mês isenta"],
        cons: ["Alta volatilidade", "Risco de perda total (falência)", "Exige análise e acompanhamento constante"],
      },
      {
        name: "ETF de Índice (BOVA11)",
        icon: "📦",
        risk: 4,
        liquidity: "Alta",
        minValue: "R$ 100",
        irExempt: false,
        fgc: false,
        description:
          "Fundo negociado em bolsa que replica automaticamente um índice (Ibovespa, S&P 500 etc.). Dezenas de ações em uma única cota.",
        howItWorks:
          "Compra como ação na B3. O gestor replica o índice automaticamente. Taxa de administração baixíssima (0,1% a 0,5% ao ano). Sem isenção de R$ 20k.",
        example: {
          scenario: "Rafael compra 10 cotas de BOVA11 a R$ 110",
          steps: [
            "Investimento: 10 × R$110 = R$ 1.100",
            "Ibovespa sobe 15% no ano",
            "BOVA11 sobe ≈ 14,9% (descontada taxa de 0,10% a.a.)",
            "Saldo: R$ 1.100 × 1,149 = R$ 1.264",
            "Lucro: R$ 164 → IR 15% = R$ 24,60 se vender",
          ],
          conclusion: "Diversificação instantânea com custo baixíssimo. Ótimo ponto de entrada para iniciantes em renda variável.",
        },
        pros: ["Diversificação automática em dezenas de ativos", "Taxa de administração baixíssima", "Simples de operar"],
        cons: ["Paga IR na venda (sem isenção de R$20k)", "Oscila com o mercado", "Não bate o índice (replica, não supera)"],
      },
      {
        name: "ETF Internacional (IVVB11)",
        icon: "🌎",
        risk: 4,
        liquidity: "Alta",
        minValue: "R$ 150",
        irExempt: false,
        fgc: false,
        description:
          "ETF que replica índices do exterior (S&P 500, Nasdaq) negociado na B3 em reais. Exposição ao mercado americano + proteção cambial.",
        howItWorks:
          "O preço em reais segue o índice americano + variação do dólar. Dólar subindo amplifica o ganho; dólar caindo, reduz.",
        example: {
          scenario: "Daniela investe R$ 5.000 em IVVB11",
          steps: [
            "S&P 500 sobe 12% em dólares",
            "Dólar sobe de R$5,00 para R$5,20 (+4%)",
            "Retorno em BRL: 12% × 1,04 = +16,48%",
            "Saldo: R$ 5.000 × 1,1648 = R$ 5.824",
            "Lucro líquido após IR 15%: ≈ R$ 700",
          ],
          conclusion: "As 500 maiores empresas americanas + proteção cambial natural em um único ativo.",
        },
        pros: ["Diversificação global", "Proteção cambial embutida", "Baixo custo de gestão"],
        cons: ["Paga IR", "Câmbio pode ser desfavorável", "Tributação em ambos países em alguns casos"],
      },
      {
        name: "FII (Fundo Imobiliário)",
        icon: "🏢",
        risk: 3,
        liquidity: "Alta",
        minValue: "R$ 100",
        irExempt: true,
        fgc: false,
        description:
          "Fundos que investem em imóveis (shoppings, galpões, lajes corporativas). Pagam aluguéis mensais isentos de IR para PF.",
        howItWorks:
          "Você compra cotas na B3. O fundo distribui mensalmente 95%+ dos rendimentos (aluguéis). Para PF, esses rendimentos são totalmente isentos de IR.",
        example: {
          scenario: "Juliana investe R$ 30.000 em 4 FIIs com yield médio de 9,15%",
          steps: [
            "Renda mensal: R$ 30.000 × 9,15% ÷ 12 = ≈ R$ 229/mês",
            "IR: ZERO sobre os rendimentos (isento para PF)",
            "Em 12 meses: R$ 2.748 em renda passiva",
            "+ possível valorização das cotas",
          ],
          conclusion: "Renda passiva mensal isenta de IR. O 'imóvel sem burocracia' com liquidez na B3.",
        },
        pros: ["Renda mensal isenta de IR", "Liquidez — vende na B3 quando quiser", "Diversificação imobiliária com pouco capital"],
        cons: ["Cota pode desvalorizar", "Risco de vacância nos imóveis", "Gestão fora do seu controle"],
      },
    ],
  },
]

const RISK_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Muito Baixo", color: "text-emerald-500" },
  2: { label: "Baixo", color: "text-lime-500" },
  3: { label: "Médio", color: "text-amber-500" },
  4: { label: "Alto", color: "text-orange-500" },
  5: { label: "Muito Alto", color: "text-red-500" },
}

const RISK_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-lime-500",
  3: "bg-amber-500",
  4: "bg-orange-500",
  5: "bg-red-500",
}

function RiskDots({ risk }: { risk: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i <= risk ? RISK_COLORS[risk] : "bg-muted"}`}
        />
      ))}
    </div>
  )
}

function InvestmentCard({
  inv,
  selected,
  onClick,
}: {
  inv: Investment
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-all hover:border-primary/50 ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{inv.icon}</span>
          <span className="text-sm font-semibold text-foreground">{inv.name}</span>
        </div>
        {inv.irExempt && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-500 shrink-0">
            IR Isento
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <RiskDots risk={inv.risk} />
        <span className={`text-[11px] font-medium ${RISK_LABELS[inv.risk].color}`}>
          {RISK_LABELS[inv.risk].label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {inv.fgc && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Shield className="h-2.5 w-2.5" /> FGC
          </Badge>
        )}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Mín: {inv.minValue}
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {inv.liquidity}
        </Badge>
      </div>
    </button>
  )
}

function DetailPanel({ inv, onClose }: { inv: Investment; onClose: () => void }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{inv.icon}</span>
              <CardTitle className="text-base font-semibold text-foreground">{inv.name}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {inv.irExempt && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-500">
                  ✓ Isento de IR
                </Badge>
              )}
              {inv.fgc && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/40 text-blue-400">
                  ✓ Garantia FGC
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Liquidez: {inv.liquidity}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Mínimo: {inv.minValue}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <RiskDots risk={inv.risk} />
              <span className={`text-xs font-medium ${RISK_LABELS[inv.risk].color}`}>
                Risco {RISK_LABELS[inv.risk].label}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* O que é */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">O que é</p>
          <p className="text-sm text-foreground leading-relaxed">{inv.description}</p>
        </div>

        {/* Como funciona */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Como funciona</p>
          <p className="text-sm text-foreground leading-relaxed">{inv.howItWorks}</p>
        </div>

        {/* Exemplo prático */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-2">
            📋 Exemplo Prático
          </p>
          <p className="text-xs text-muted-foreground italic mb-3">
            📌 {inv.example.scenario}
          </p>
          <div className="flex flex-col gap-2 mb-3">
            {inv.example.steps.map((step, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-xs text-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
          <div className="rounded-md bg-emerald-950/40 border border-emerald-800/30 px-3 py-2">
            <span className="text-xs font-medium text-emerald-400">
              ✅ {inv.example.conclusion}
            </span>
          </div>
        </div>

        {/* Pros e Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500 mb-2">Vantagens</p>
            <ul className="flex flex-col gap-1.5">
              {inv.pros.map((p, i) => (
                <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5">
                  <span className="text-emerald-500 shrink-0">·</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-400 mb-2">Desvantagens</p>
            <ul className="flex flex-col gap-1.5">
              {inv.cons.map((c, i) => (
                <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5">
                  <span className="text-red-400 shrink-0">·</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function InvestmentGuide() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [selected, setSelected] = useState<Investment | null>(null)

  const totalIrExempt = CATEGORIES.flatMap((c) => c.items).filter((i) => i.irExempt).length
  const totalFgc = CATEGORIES.flatMap((c) => c.items).filter((i) => i.fgc).length
  const total = CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Guia de Investimentos</h2>
                <p className="text-xs text-muted-foreground">
                  {total} produtos com explicação detalhada e exemplo prático
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalIrExempt}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">IR Isento</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{totalFgc}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Com FGC</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{total}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Produtos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => { setActiveCategory(i); setSelected(null) }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === i
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
            <Badge
              variant={activeCategory === i ? "secondary" : "outline"}
              className="text-[10px] px-1.5 py-0 ml-0.5"
            >
              {cat.items.length}
            </Badge>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground -mt-2 flex items-center gap-1.5">
        <ChevronRight className="h-3 w-3" />
        Clique em um produto para ver explicação completa e exemplo com cálculo real
      </p>

      {/* Grid: list + detail */}
      <div className={`grid gap-4 ${selected ? "grid-cols-1 lg:grid-cols-[300px_1fr]" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        <div className="flex flex-col gap-2">
          {CATEGORIES[activeCategory].items.map((inv) => (
            <InvestmentCard
              key={inv.name}
              inv={inv}
              selected={selected?.name === inv.name}
              onClick={() => setSelected(selected?.name === inv.name ? null : inv)}
            />
          ))}
        </div>

        {selected && (
          <div>
            <DetailPanel inv={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Conteúdo educacional. Taxas e exemplos são hipotéticos e baseados em cenários de 2024–2025.
          Rentabilidade passada não garante retornos futuros. Consulte um assessor financeiro certificado antes de investir.
        </p>
      </div>
    </div>
  )
}