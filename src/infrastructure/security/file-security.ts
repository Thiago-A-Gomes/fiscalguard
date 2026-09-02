import type { FileSecurityPolicy } from '../../application/ports';

export const FILE_LIMITS = { maxFiles: 100, maxFileBytes: 5 * 1024 * 1024, maxBatchBytes: 25 * 1024 * 1024, maxXmlElements: 50_000 } as const;

export class SecureXmlFilePolicy implements FileSecurityPolicy {
  validateBatch(files: File[]) {
    if (!files.length) throw new Error('Selecione ao menos um arquivo XML.');
    if (files.length > FILE_LIMITS.maxFiles) throw new Error(`Limite de ${FILE_LIMITS.maxFiles} arquivos por análise.`);
    let total = 0;
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.xml')) throw new Error(`Formato não permitido: ${file.name}.`);
      if (file.size > FILE_LIMITS.maxFileBytes) throw new Error(`${file.name} excede o limite de 5 MB.`);
      total += file.size;
    }
    if (total > FILE_LIMITS.maxBatchBytes) throw new Error('O lote excede o limite total de 25 MB.');
  }

  validateContent(xml: string) {
    const start = xml.slice(0, 2048).toLowerCase();
    if (start.includes('<!doctype') || /<!entity\s/i.test(xml)) throw new Error('DTD e entidades externas não são aceitas por segurança.');
    if (!/<(?:\w+:)?(?:nfeProc|NFe)\b/.test(xml)) throw new Error('Estrutura de NF-e não reconhecida.');
    const elementCount = (xml.match(/<[^!?/][^>]*>/g) ?? []).length;
    if (elementCount > FILE_LIMITS.maxXmlElements) throw new Error('XML excessivamente complexo.');
  }
}

export function protectSpreadsheetCell(value: string) {
  return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}
