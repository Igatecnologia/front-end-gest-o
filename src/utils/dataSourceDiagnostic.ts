import { ERP_STANDARD_FIELDS } from '../api/erpStandardFields'

// ─── Palavras-chave para reconhecer areas por nome de campo ─────────────────

const AREA_KEYWORDS: Record<string, string[]> = {
  'compras-materia-prima': ['fornecedor', 'supplier', 'material', 'notafiscal', 'nf_', 'compra', 'purchase', 'materia_prima', 'raw_material'],
  'lotes-producao': ['lote', 'batch', 'densidade', 'density', 'rendimento', 'yield', 'operador', 'operator', 'volumem3', 'volume_m3', 'mao_de_obra'],
  'fichas-tecnicas': ['ficha', 'spec', 'produto', 'product', 'margem', 'margin', 'preco_sugerido', 'suggested_price', 'peso_kg', 'consumo_kg'],
  'pedidos': ['cliente', 'client', 'customer', 'pedido', 'order', 'peca', 'piece', 'pagamento', 'payment', 'forma_pagamento'],
  'ordens-producao': ['ordem', 'work_order', 'op_', 'producao', 'production', 'data_prevista', 'planned_date', 'data_conclusao'],
  'faturamentos': ['fatura', 'invoice', 'nf', 'nota_fiscal', 'frete', 'freight', 'imposto', 'tax', 'numero_nf'],
  'movimentos-estoque': ['estoque', 'stock', 'inventory', 'movimento', 'movement', 'entrada', 'saida', 'saldo', 'balance', 'nivel_estoque'],
  'custo-real': ['custo_real', 'real_cost', 'margem_real', 'actual_margin', 'preco_venda', 'sale_price', 'alerta_margem'],
  'alertas': ['alerta', 'alert', 'severidade', 'severity', 'titulo', 'title', 'descricao', 'description', 'lido', 'read'],
}

// ─── Palavras-chave para detectar campos de vendas (SGBR BI style) ──────────

const VENDAS_KEYWORDS = ['venda', 'vendida', 'codprod', 'decprod', 'codcliente', 'nomecliente', 'valorunit', 'totalprodutos', 'statuspedido', 'datafec', 'qtde', 'sale', 'sold']

export type AreaMatch = {
  area: string
  label: string
  confidence: 'alta' | 'media' | 'baixa'
  matchedFields: string[]
  missingFields: string[]
}

export type DiagnosticResult = {
  /** Areas reconhecidas nos dados */
  recognized: AreaMatch[]
  /** Campos que nao pertencem a nenhuma area conhecida */
  unknownFields: string[]
  /** Se parece ser dados de vendas analitico (tipo SGBR BI) */
  isVendasAnalitico: boolean
  /** Mapeamentos sugeridos automaticamente */
  suggestedMappings: Array<{ standardField: string; sourceField: string; transform: 'none' | 'trim' | 'number' | 'date_iso' }>
  /** Endpoints sugeridos */
  suggestedEndpoints: string[]
}

/**
 * Analisa os campos retornados pela API e identifica:
 * - Quais areas do painel esses dados alimentam
 * - Quais campos estao faltando
 * - Quais campos sao desconhecidos
 * - Sugestoes de mapeamento automatico
 */
export function diagnoseFields(sampleFields: string[]): DiagnosticResult {
  const normalized = sampleFields.map((f) => f.toLowerCase().trim())
  const recognized: AreaMatch[] = []
  const matchedFieldsAll = new Set<string>()

  // Checa vendas analitico (SGBR BI pattern)
  const vendasScore = normalized.filter((f) =>
    VENDAS_KEYWORDS.some((kw) => f.includes(kw)),
  ).length
  const isVendasAnalitico = vendasScore >= 3

  // Para cada area, calcula match
  for (const [areaKey, config] of Object.entries(ERP_STANDARD_FIELDS)) {
    const keywords = AREA_KEYWORDS[areaKey] ?? []
    const areaFields = config.fields

    // Campos da API que batem com keywords da area
    const matchedByKeyword = normalized.filter((f) =>
      keywords.some((kw) => f.includes(kw)),
    )

    // Campos da API que batem direto com campos padrao (nome exato ou similar)
    const matchedByName = normalized.filter((f) =>
      areaFields.some((sf) => f === sf.toLowerCase() || f.includes(sf.toLowerCase()) || sf.toLowerCase().includes(f)),
    )

    const allMatched = [...new Set([...matchedByKeyword, ...matchedByName])]

    if (allMatched.length === 0) continue

    // Confianca baseada em quantos campos batem
    const ratio = allMatched.length / areaFields.length
    const confidence: 'alta' | 'media' | 'baixa' =
      ratio >= 0.5 ? 'alta' : ratio >= 0.25 ? 'media' : 'baixa'

    // Campos padrao que NAO foram encontrados
    const missingFields = areaFields.filter(
      (sf) => !normalized.some((f) => f === sf.toLowerCase() || f.includes(sf.toLowerCase())),
    )

    allMatched.forEach((f) => matchedFieldsAll.add(f))

    recognized.push({
      area: areaKey,
      label: config.label,
      confidence,
      matchedFields: allMatched,
      missingFields,
    })
  }

  // Campos que nao pertencem a nenhuma area
  const unknownFields = sampleFields.filter(
    (f) => !matchedFieldsAll.has(f.toLowerCase().trim()),
  )

  // Mapeamentos sugeridos
  const suggestedMappings = buildSuggestedMappings(sampleFields, recognized)

  // Endpoints sugeridos (areas com confianca alta ou media)
  const suggestedEndpoints = recognized
    .filter((r) => r.confidence === 'alta' || r.confidence === 'media')
    .map((r) => r.area)

  // Ordena por confianca
  recognized.sort((a, b) => {
    const order = { alta: 0, media: 1, baixa: 2 }
    return order[a.confidence] - order[b.confidence]
  })

  return { recognized, unknownFields, isVendasAnalitico, suggestedMappings, suggestedEndpoints }
}

/** Gera mapeamentos automaticos baseados em similaridade de nomes */
function buildSuggestedMappings(
  sampleFields: string[],
  recognized: AreaMatch[],
): DiagnosticResult['suggestedMappings'] {
  const mappings: DiagnosticResult['suggestedMappings'] = []
  const usedSource = new Set<string>()

  // Pega todos os campos padrao das areas reconhecidas
  const standardFields = recognized.flatMap((r) =>
    (ERP_STANDARD_FIELDS[r.area]?.fields ?? []),
  )
  const uniqueStandard = [...new Set(standardFields)]

  for (const std of uniqueStandard) {
    const stdLower = std.toLowerCase()

    // Match exato
    const exact = sampleFields.find((f) => f.toLowerCase() === stdLower && !usedSource.has(f))
    if (exact) {
      usedSource.add(exact)
      continue // nao precisa mapear, nome ja e igual
    }

    // Match parcial (contem o nome)
    const partial = sampleFields.find(
      (f) => !usedSource.has(f) && (
        f.toLowerCase().includes(stdLower) ||
        stdLower.includes(f.toLowerCase())
      ),
    )
    if (partial) {
      usedSource.add(partial)
      const transform = inferTransform(std, partial)
      mappings.push({ standardField: std, sourceField: partial, transform })
    }
  }

  // Mapeamentos conhecidos para SGBR BI
  const sgbrMap: Record<string, { std: string; transform: 'none' | 'trim' | 'number' | 'date_iso' }> = {
    decprod: { std: 'produto', transform: 'trim' },
    nomecliente: { std: 'cliente', transform: 'trim' },
    qtdevendida: { std: 'quantidade', transform: 'number' },
    valorunit: { std: 'valorunit', transform: 'number' },
    precocustoitem: { std: 'custoUnitario', transform: 'number' },
    total: { std: 'valorTotal', transform: 'number' },
    datafec: { std: 'data', transform: 'date_iso' },
    statuspedido: { std: 'status', transform: 'none' },
    codprod: { std: 'id', transform: 'number' },
    codcliente: { std: 'codcliente', transform: 'number' },
  }

  for (const sourceField of sampleFields) {
    const mapping = sgbrMap[sourceField.toLowerCase()]
    if (mapping && !usedSource.has(sourceField)) {
      usedSource.add(sourceField)
      if (!mappings.some((m) => m.standardField === mapping.std)) {
        mappings.push({ standardField: mapping.std, sourceField, transform: mapping.transform })
      }
    }
  }

  return mappings
}

/** Infere o tipo de transformacao baseado no nome do campo */
function inferTransform(standard: string, source: string): 'none' | 'trim' | 'number' | 'date_iso' {
  const s = (standard + source).toLowerCase()
  if (s.includes('data') || s.includes('date') || s.includes('dt_')) return 'date_iso'
  if (s.includes('valor') || s.includes('custo') || s.includes('preco') || s.includes('total') || s.includes('qtde') || s.includes('amount') || s.includes('price') || s.includes('cost')) return 'number'
  if (s.includes('nome') || s.includes('name') || s.includes('desc') || s.includes('produto')) return 'trim'
  return 'none'
}

// ─── Diagnostico de conexao ─────────────────────────────────────────────────

export type ConnectionDiagnostic = {
  status: 'ok' | 'auth_required' | 'auth_failed' | 'no_data' | 'error'
  message: string
  details: string[]
}

/**
 * Analisa o resultado do teste e retorna diagnostico amigavel
 */
export function diagnoseConnection(
  testSuccess: boolean,
  testMessage: string,
  sampleFields: string[] | undefined,
  httpStatus?: number,
): ConnectionDiagnostic {
  // Servidor nao alcancavel
  if (!testSuccess && (testMessage.includes('ECONNREFUSED') || testMessage.includes('Failed to fetch') || testMessage.includes('timeout'))) {
    return {
      status: 'error',
      message: 'Nao foi possivel conectar ao servidor',
      details: [
        'Verifique se o endereco esta correto',
        'Verifique se o servidor esta ligado',
        'Verifique se ha firewall bloqueando a conexao',
      ],
    }
  }

  // Auth required
  if (!testSuccess && (httpStatus === 401 || httpStatus === 403 || testMessage.includes('401') || testMessage.includes('403') || testMessage.includes('Unauthorized'))) {
    return {
      status: 'auth_required',
      message: 'O servidor exige autenticacao',
      details: [
        'Configure o metodo de autenticacao (Token, Chave de acesso ou Usuario/Senha)',
        'Verifique se as credenciais estao corretas',
        'Se usa token, verifique se nao esta expirado',
      ],
    }
  }

  // Conectou mas sem dados
  if (testSuccess && (!sampleFields || sampleFields.length === 0)) {
    return {
      status: 'no_data',
      message: 'Conectado, mas nenhum dado retornado',
      details: [
        'O servidor respondeu, porem sem dados',
        'Verifique se o caminho de dados esta correto',
        'Verifique se ha dados no periodo selecionado',
        'Pode ser necessario enviar parametros (ex: datas)',
      ],
    }
  }

  // Erro generico
  if (!testSuccess) {
    return {
      status: 'error',
      message: 'Falha na conexao',
      details: [testMessage],
    }
  }

  // Sucesso com dados
  return {
    status: 'ok',
    message: 'Conexao estabelecida com sucesso',
    details: [`${sampleFields?.length ?? 0} campos encontrados nos dados`],
  }
}
