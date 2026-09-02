import type { FileSecurityPolicy, InvoiceParser } from './ports';
import type { Invoice } from '../domain/fiscal';

export type ProcessingResult = { invoices: Invoice[]; failures: string[] };

export async function processInvoiceFiles(files: File[], parser: InvoiceParser, security: FileSecurityPolicy): Promise<ProcessingResult> {
  security.validateBatch(files);
  const invoices: Invoice[] = [];
  const failures: string[] = [];
  for (const file of files) {
    try {
      const xml = await file.text();
      security.validateContent(xml);
      invoices.push(parser.parse(xml, file.name));
    } catch (error) {
      failures.push(`${file.name}: ${error instanceof Error ? error.message : 'não foi possível ler'}`);
    }
  }
  return { invoices, failures };
}
