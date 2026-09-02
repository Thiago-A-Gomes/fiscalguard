import type { Finding, Invoice, Severity } from './fiscal';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function isValidCnpj(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const digit = (base: string, factors: number[]) => {
    const sum = factors.reduce((acc, factor, index) => acc + Number(base[index]) * factor, 0);
    const result = 11 - (sum % 11);
    return result >= 10 ? 0 : result;
  };
  const d1 = digit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${d1}${d2}`);
}

export function analyzeInvoices(invoices: Invoice[]): Finding[] {
  const results: Finding[] = [];
  const keyCount = new Map<string, number>();
  invoices.forEach((invoice) => invoice.key && keyCount.set(invoice.key, (keyCount.get(invoice.key) ?? 0) + 1));

  invoices.forEach((invoice, invoiceIndex) => {
    const doc = `NF ${invoice.number}`;
    const add = (severity: Severity, rule: string, detail: string, suggestion: string) =>
      results.push({ id: `${invoiceIndex}-${rule}-${results.length}`, severity, rule, document: doc, detail, suggestion });

    if (invoice.key && (keyCount.get(invoice.key) ?? 0) > 1)
      add('Crítico', 'Documento duplicado', 'A mesma chave de acesso foi enviada mais de uma vez.', 'Manter apenas uma ocorrência antes da escrituração.');
    if (Math.abs(invoice.itemTotal - invoice.total) > 0.01)
      add('Crítico', 'Total da nota', `A soma bruta dos itens (${money.format(invoice.itemTotal)}) difere do vNF (${money.format(invoice.total)}).`, 'Revisar descontos, frete, tributos e totalização; esta checagem é indicativa.');
    if (!isValidCnpj(invoice.cnpj))
      add('Crítico', 'CNPJ do emitente', `O CNPJ “${invoice.cnpj || 'não informado'}” não passou na validação matemática.`, 'Conferir o cadastro e o XML autorizado.');

    invoice.products.forEach((product, productIndex) => {
      if (!/^\d{8}$/.test(product.ncm)) add('Atenção', 'Classificação NCM', `Item ${productIndex + 1} — “${product.description || 'sem descrição'}” — possui NCM ausente ou fora do formato de 8 dígitos.`, 'Confirmar a classificação com o responsável tributário.');
      if (!/^\d{4}$/.test(product.cfop)) add('Atenção', 'Código CFOP', `Item ${productIndex + 1} possui CFOP “${product.cfop || 'não informado'}”.`, 'Conferir o código da operação no documento fiscal.');
    });
    if (!invoice.hasCbsIbs) add('Informativo', 'CBS e IBS', 'Não foram localizados grupos de CBS ou IBS no XML.', 'Verificar a exigência aplicável ao leiaute e período de emissão.');
  });

  const productNcms = new Map<string, Set<string>>();
  invoices.flatMap((invoice) => invoice.products).forEach((product) => {
    const name = product.description.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
    if (!name || !product.ncm) return;
    if (!productNcms.has(name)) productNcms.set(name, new Set());
    productNcms.get(name)!.add(product.ncm);
  });
  productNcms.forEach((ncms, product) => {
    if (ncms.size > 1) results.push({ id: `ncm-${product}`, severity: 'Atenção', rule: 'NCM inconsistente', document: 'Várias notas', detail: `“${product}” aparece com os códigos ${Array.from(ncms).join(', ')}.`, suggestion: 'Revisar o cadastro fiscal do produto.' });
  });
  return results;
}
