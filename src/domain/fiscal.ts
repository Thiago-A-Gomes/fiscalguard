export type Severity = 'Crítico' | 'Atenção' | 'Informativo';

export type FiscalProduct = {
  description: string;
  ncm: string;
  cfop: string;
};

export type Invoice = {
  fileName: string;
  key: string;
  number: string;
  issuer: string;
  cnpj: string;
  date: string;
  total: number;
  itemTotal: number;
  products: FiscalProduct[];
  hasCbsIbs: boolean;
};

export type Finding = {
  id: string;
  severity: Severity;
  rule: string;
  document: string;
  detail: string;
  suggestion: string;
};
