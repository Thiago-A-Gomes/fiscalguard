import { describe, expect, it } from 'vitest';
import { analyzeInvoices, isValidCnpj } from './policies';
import type { Invoice } from './fiscal';

const invoice: Invoice = {
  fileName: 'nfe.xml', key: '1'.repeat(44), number: '10', issuer: 'Teste',
  cnpj: '11222333000181', date: '2026-09-02', total: 100, itemTotal: 100,
  products: [{ description: 'Produto', ncm: '12345678', cfop: '5102' }], hasCbsIbs: true,
};

describe('políticas fiscais', () => {
  it('valida dígitos de CNPJ', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
  });

  it('detecta chave duplicada', () => {
    expect(analyzeInvoices([invoice, { ...invoice, fileName: 'copia.xml' }]).filter((item) => item.rule === 'Documento duplicado')).toHaveLength(2);
  });

  it('detecta classificação incompleta', () => {
    const changed = { ...invoice, products: [{ description: 'Produto', ncm: '', cfop: '' }] };
    expect(analyzeInvoices([changed]).map((item) => item.rule)).toEqual(expect.arrayContaining(['Classificação NCM', 'Código CFOP']));
  });
});
