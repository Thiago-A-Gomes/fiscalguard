import type { Invoice } from '../domain/fiscal';

export interface InvoiceParser {
  parse(xml: string, fileName: string): Invoice;
}

export interface FileSecurityPolicy {
  validateBatch(files: File[]): void;
  validateContent(xml: string): void;
}
