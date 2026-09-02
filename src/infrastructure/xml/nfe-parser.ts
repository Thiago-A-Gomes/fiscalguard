import type { InvoiceParser } from '../../application/ports';
import type { Invoice } from '../../domain/fiscal';

type QueryRoot = Document | Element;
const elements = (root: QueryRoot, name: string) => Array.from(root.querySelectorAll('*')).filter((node) => node.localName === name);
const firstText = (root: QueryRoot, name: string) => elements(root, name)[0]?.textContent?.trim() ?? '';

export class BrowserNfeParser implements InvoiceParser {
  parse(xml: string, fileName: string): Invoice {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.querySelector('parsererror')) throw new Error('XML inválido');
    const infNFe = elements(document, 'infNFe')[0];
    if (!infNFe) throw new Error('o arquivo não contém uma NF-e reconhecível');
    const emit = elements(infNFe, 'emit')[0];
    const ide = elements(infNFe, 'ide')[0];
    const total = elements(infNFe, 'ICMSTot')[0];
    const productNodes = elements(infNFe, 'prod');
    const products = productNodes.map((product) => ({ description: firstText(product, 'xProd').slice(0, 500), ncm: firstText(product, 'NCM'), cfop: firstText(product, 'CFOP') }));
    const itemTotal = productNodes.reduce((sum, product) => sum + Number(firstText(product, 'vProd') || 0), 0);
    const taxNames = elements(infNFe, 'imposto').flatMap((node) => Array.from(node.querySelectorAll('*')).map((item) => item.localName));
    return { fileName, key: infNFe.getAttribute('Id')?.replace(/^NFe/, '') || firstText(document, 'chNFe'), number: firstText(ide, 'nNF') || '—', issuer: firstText(emit, 'xNome').slice(0, 200) || 'Emitente não informado', cnpj: firstText(emit, 'CNPJ'), date: firstText(ide, 'dhEmi') || firstText(ide, 'dEmi'), total: Number(firstText(total, 'vNF') || 0), itemTotal, products, hasCbsIbs: taxNames.some((name) => /^(IBS|CBS|IBSCBS)/i.test(name)) };
  }
}
