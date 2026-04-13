import { describe, expect, it } from 'vitest'
import { vendasAnaliticoResponseSchema } from './schemas'

describe('vendas analitico contract', () => {
  it('aceita payload minimo compativel com SGBR', () => {
    const sample = [
      {
        data: '2026-01-15',
        datafec: '2026-01-15',
        codvendedor: 1,
        nomevendedor: 'Vendedor',
        codprod: 10,
        decprod: 'Produto',
        qtdevendida: 2,
        und: 'UN',
        qtdeconvertidavd: 2,
        precocustoitem: 10,
        valorunit: 25,
        total: 50,
        codcliente: 99,
        nomecliente: 'Cliente',
        cepcliente: '00000-000',
        totalprodutos: 50,
        statuspedido: 'F',
      },
    ]
    const parsed = vendasAnaliticoResponseSchema.safeParse(sample)
    expect(parsed.success).toBe(true)
  })
})
