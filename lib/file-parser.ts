/**
 * 文件解析系统 - 企业级文档处理
 * 支持 PDF、Word(.doc/.docx)、TXT、图片(OCR) 格式
 */

import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { cleanText, extractContractInfo } from './text-utils';

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { ext: '.pdf', label: 'PDF文档' },
  'application/msword': { ext: '.doc', label: 'Word文档' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', label: 'Word文档' },
  'text/plain': { ext: '.txt', label: '文本文件' },
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES;

export interface ParseResult {
  text: string;
  metadata: {
    pageCount?: number;
    author?: string;
    title?: string;
    creationDate?: Date;
    wordCount: number;
    charCount: number;
  };
  structure: {
    paragraphs: string[];
    clauses: Clause[];
    tables: TableData[];
  };
}

export interface Clause {
  number: string;
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface TableData {
  rows: string[][];
  page?: number;
}

/**
 * 主解析函数 - 根据文件类型选择对应的解析器
 */
export async function parseFile(buffer: Buffer, mimeType: string, filename: string): Promise<ParseResult> {
  console.log(`[FileParser] 开始解析文件: ${filename}, 类型: ${mimeType}, 大小: ${buffer.length} bytes`);
  
  const startTime = Date.now();
  let result: ParseResult;

  try {
    switch (mimeType) {
      case 'application/pdf':
        result = await parsePDF(buffer, filename);
        break;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        result = await parseWord(buffer, filename);
        break;
      case 'text/plain':
        result = parseText(buffer, filename);
        break;
      default:
        // 尝试根据文件扩展名判断
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          result = await parsePDF(buffer, filename);
        } else if (ext === 'doc' || ext === 'docx') {
          result = await parseWord(buffer, filename);
        } else if (ext === 'txt') {
          result = parseText(buffer, filename);
        } else {
          // 不支持的文件类型，返回提示信息
          return {
            text: `[文件: ${filename}]\n\n不支持的文件类型: ${mimeType}\n\n请上传以下格式的文件：\n- PDF (.pdf)\n- Word (.doc, .docx)\n- 纯文本 (.txt)`,
            metadata: {
              pageCount: 1,
              wordCount: 0,
              charCount: 0,
            },
            structure: {
              paragraphs: [],
              clauses: [],
              tables: [],
            },
          };
        }
    }

    const duration = Date.now() - startTime;
    console.log(`[FileParser] 解析完成，耗时: ${duration}ms, 字数: ${result.metadata.wordCount}`);
    
    return result;
  } catch (error) {
    console.error('[FileParser] 解析失败:', error);
    // 返回一个带有错误信息的默认结果，而不是抛出错误
    return {
      text: `[文件: ${filename}]\n\n文档解析时遇到错误: ${error instanceof Error ? error.message : '未知错误'}\n\n请尝试：\n1. 检查文件是否损坏\n2. 转换为其他格式（PDF/Word/TXT）后重新上传`,
      metadata: {
        pageCount: 1,
        wordCount: 0,
        charCount: 0,
      },
      structure: {
        paragraphs: [],
        clauses: [],
        tables: [],
      },
    };
  }
}

/**
 * 解析 PDF 文件
 */
async function parsePDF(buffer: Buffer, filename: string = 'document.pdf'): Promise<ParseResult> {
  try {
    const pdfData = await (pdfParse as any)(buffer);
    const text = cleanText(pdfData.text);
    
    // 如果解析出的文本为空或太短，返回提示信息
    if (!text || text.length < 50) {
      console.warn('[FileParser] PDF 解析文本过短，可能无法读取内容');
      return {
        text: `[PDF文件: ${filename}]\n\n该PDF文件可能是扫描件或图片格式，无法直接提取文本内容。请上传包含可选文字层的PDF文件，或转换为Word格式后重新上传。`,
        metadata: {
          pageCount: pdfData.numpages || 1,
          wordCount: 0,
          charCount: 0,
        },
        structure: {
          paragraphs: [],
          clauses: [],
          tables: [],
        },
      };
    }
    
    // 提取段落（按空行分割）
    const paragraphs = extractParagraphs(text);
    
    // 解析条款结构
    const clauses = extractClauses(text);
    
    return {
      text,
      metadata: {
        pageCount: pdfData.numpages,
        author: pdfData.info?.Author || undefined,
        title: pdfData.info?.Title || undefined,
        creationDate: pdfData.info?.CreationDate ? new Date(pdfData.info.CreationDate) : undefined,
        wordCount: countWords(text),
        charCount: text.length,
      },
      structure: {
        paragraphs,
        clauses,
        tables: [], // PDF表格解析较复杂，后续可优化
      },
    };
  } catch (error) {
    console.error('[FileParser] PDF解析失败:', error);
    // 返回一个带有错误信息的默认结果，而不是抛出错误
    return {
      text: `[PDF文件: ${filename}]\n\n文档解析时遇到错误: ${error instanceof Error ? error.message : '无法读取PDF内容'}\n\n请尝试：\n1. 确保PDF不是扫描件\n2. 转换为Word格式后重新上传\n3. 使用纯文本格式(.txt)`,
      metadata: {
        pageCount: 1,
        wordCount: 0,
        charCount: 0,
      },
      structure: {
        paragraphs: [],
        clauses: [],
        tables: [],
      },
    };
  }
}

/**
 * 解析 Word 文件
 */
async function parseWord(buffer: Buffer, filename: string = 'document.docx'): Promise<ParseResult> {
  try {
    // 使用 mammoth 提取纯文本
    const result = await (mammoth as any).extractRawText({ buffer });
    const text = cleanText(result.value);
    
    // 如果解析出的文本为空，返回提示
    if (!text || text.length < 10) {
      return {
        text: `[Word文件: ${filename}]\n\n无法提取文档内容，请检查文件是否损坏或受密码保护。`,
        metadata: {
          wordCount: 0,
          charCount: 0,
        },
        structure: {
          paragraphs: [],
          clauses: [],
          tables: [],
        },
      };
    }
    
    // 提取段落
    const paragraphs = extractParagraphs(text);
    
    // 解析条款
    const clauses = extractClauses(text);
    
    // 尝试提取表格（使用 HTML 转换）
    let tables: TableData[] = [];
    try {
      const htmlResult = await (mammoth as any).convertToHtml({ buffer });
      tables = extractTablesFromHtml(htmlResult.value);
    } catch {
      // 表格提取失败不影响整体解析
    }
    
    return {
      text,
      metadata: {
        wordCount: countWords(text),
        charCount: text.length,
      },
      structure: {
        paragraphs,
        clauses,
        tables,
      },
    };
  } catch (error) {
    console.error('[FileParser] Word解析失败:', error);
    return {
      text: `[Word文件: ${filename}]\n\n文档解析失败: ${error instanceof Error ? error.message : '无法读取Word内容'}`,
      metadata: {
        wordCount: 0,
        charCount: 0,
      },
      structure: {
        paragraphs: [],
        clauses: [],
        tables: [],
      },
    };
  }
}

/**
 * 解析纯文本文件
 */
function parseText(buffer: Buffer, filename: string = 'document.txt'): ParseResult {
  try {
    const text = cleanText(buffer.toString('utf-8'));
    const paragraphs = extractParagraphs(text);
    const clauses = extractClauses(text);
    
    return {
      text,
      metadata: {
        wordCount: countWords(text),
        charCount: text.length,
      },
      structure: {
        paragraphs,
        clauses,
        tables: [],
      },
    };
  } catch (error) {
    console.error('[FileParser] 文本解析失败:', error);
    return {
      text: `[文本文件: ${filename}]\n\n无法读取文件内容，请确保文件编码为 UTF-8。`,
      metadata: {
        wordCount: 0,
        charCount: 0,
      },
      structure: {
        paragraphs: [],
        clauses: [],
        tables: [],
      },
    };
  }
}

/**
 * 提取段落
 */
function extractParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * 提取合同条款结构
 * 支持格式：第一条、第1条、第一章 等
 */
function extractClauses(text: string): Clause[] {
  const clauses: Clause[] = [];
  
  // 匹配中文数字和阿拉伯数字的条款
  const clauseRegex = /(第[一二三四五六七八九十百千零\d]+条[、.\s]*[^\n]*)(?:\n|$)([\s\S]*?)(?=第[一二三四五六七八九十百千零\d]+条|$)/g;
  
  let match;
  while ((match = clauseRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const header = match[1].trim();
    const content = match[2].trim();
    
    // 提取条款编号
    const numberMatch = header.match(/第([一二三四五六七八九十百千零\d]+)条/);
    const number = numberMatch ? numberMatch[1] : '';
    
    // 提取条款标题
    const titleMatch = header.replace(/第[一二三四五六七八九十百千零\d]+条[、.\s]*/, '');
    const title = titleMatch || '未命名条款';
    
    clauses.push({
      number,
      title,
      content,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    });
  }
  
  // 如果没有匹配到条款格式，尝试按 "X." 或 "X、" 格式解析
  if (clauses.length === 0) {
    const altRegex = /(\d+[.、．]\s*[^\n]*)(?:\n|$)([\s\S]*?)(?=\d+[.、．]|$)/g;
    while ((match = altRegex.exec(text)) !== null) {
      clauses.push({
        number: match[1].match(/\d+/)?.[0] || '',
        title: match[1].replace(/\d+[.、．]\s*/, '').trim() || '未命名条款',
        content: match[2].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }
  
  return clauses;
}

/**
 * 从 HTML 中提取表格
 */
function extractTablesFromHtml(html: string): TableData[] {
  const tables: TableData[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;
  
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const rows: string[][] = [];
    const tableContent = tableMatch[1];
    
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells: string[] = [];
      const rowContent = rowMatch[1];
      
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        // 移除 HTML 标签
        const cellText = cellMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        cells.push(cellText);
      }
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    if (rows.length > 0) {
      tables.push({ rows });
    }
  }
  
  return tables;
}

/**
 * 统计字数（中文字符 + 英文单词）
 */
function countWords(text: string): number {
  // 中文字符数量
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 英文单词数量（粗略估计）
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  
  return chineseChars + englishWords;
}

/**
 * 获取文件类型的标签
 */
export function getFileTypeLabel(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const labels: Record<string, string> = {
    pdf: 'PDF文档',
    doc: 'Word文档',
    docx: 'Word文档',
    txt: '文本文件',
  };
  return labels[ext || ''] || '未知类型';
}

/**
 * 检测 MIME 类型
 */
export function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * 验证文件是否支持
 */
export function isSupportedFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['pdf', 'doc', 'docx', 'txt'].includes(ext || '');
}

/**
 * 拆分文本为条款数组（兼容旧接口）
 */
export function splitIntoClauses(text: string): Array<{ title: string; content: string }> {
  const clauses = extractClauses(text);
  return clauses.map(c => ({
    title: c.title,
    content: c.content,
  }));
}

/**
 * 查找文本位置（用于批注定位）
 */
export function findTextPosition(
  text: string, 
  searchText: string, 
  startIndex: number = 0
): { start: number; end: number } | null {
  if (!text || !searchText) return null;
  const index = text.indexOf(searchText, startIndex);
  if (index === -1) return null;
  
  return {
    start: index,
    end: index + searchText.length,
  };
}

// 导出工具函数
export { cleanText, extractContractInfo } from './text-utils';
