import { describe, expect, it } from 'vitest';
import { protectSpreadsheetCell, SecureXmlFilePolicy } from './file-security';

const policy = new SecureXmlFilePolicy();

describe('segurança de entrada e saída', () => {
  it('bloqueia declaração de entidade em XML', () => {
    expect(() => policy.validateContent('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]><NFe/>')).toThrow(/entidades/i);
  });

  it('exige estrutura de NF-e', () => {
    expect(() => policy.validateContent('<documento/>')).toThrow(/não reconhecida/i);
  });

  it('neutraliza fórmulas de planilha', () => {
    expect(protectSpreadsheetCell('=HYPERLINK("https://evil")')).toBe("'=HYPERLINK(\"https://evil\")");
    expect(protectSpreadsheetCell('texto seguro')).toBe('texto seguro');
  });
});
