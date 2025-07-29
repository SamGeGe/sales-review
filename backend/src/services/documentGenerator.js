const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DocumentGenerator {
  constructor() {
    this.tempDir = '/tmp';
  }

  // 生成PDF文档
  async generatePDF(content, options = {}) {
    try {
      // 方案1：使用html-pdf-node（最可靠）
      try {
        return await this.generatePDFWithHtmlPdfNode(content, options);
      } catch (error) {
        console.warn('html-pdf-node生成失败，尝试方案2:', error.message);
        
        // 方案2：使用puppeteer
        try {
          return await this.generatePDFWithPuppeteer(content, options);
        } catch (error) {
          console.warn('Puppeteer PDF生成失败，尝试方案3:', error.message);
          
          // 方案3：使用markdown-pdf
          try {
            return await this.generatePDFWithMarkdownPdf(content, options);
          } catch (error) {
            console.warn('markdown-pdf生成失败，使用方案4:', error.message);
            
            // 方案4：生成HTML文件供用户下载
          return await this.generateHTMLFile(content, options);
          }
        }
      }
    } catch (error) {
      console.error('所有PDF生成方案都失败了:', error);
      throw new Error(`PDF生成失败: ${error.message}`);
    }
  }

  // 使用html-pdf-node生成PDF
  async generatePDFWithHtmlPdfNode(content, options) {
    const htmlPdf = require('html-pdf-node');
    
    const html = this.convertMarkdownToHTML(content);
    
    const file = {
      content: html
    };
    
    const pdfBuffer = await htmlPdf.generatePdf(file, {
      format: 'A4',
      margin: {
        top: '40px',
        bottom: '40px',
        left: '40px',
        right: '40px'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    return pdfBuffer;
  }

  // 使用Puppeteer生成PDF
  async generatePDFWithPuppeteer(content, options) {
    const puppeteer = require('puppeteer');
    
    const html = this.convertMarkdownToHTML(content);
    
    const browser = await puppeteer.launch({ 
      headless: 'new', 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096',
        '--single-process',
        '--no-zygote'
      ]
    });
    
    const page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 1200, height: 800 });
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // 等待内容完全加载
    await page.waitForTimeout(3000);
    
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true, 
      margin: { top: 40, bottom: 40, left: 40, right: 40 },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      scale: 1.0
    });
    
    await browser.close();
    return pdfBuffer;
  }

  // 使用markdown-pdf生成PDF
  async generatePDFWithMarkdownPdf(content, options) {
    const tempMarkdownFile = path.join(this.tempDir, `temp_${Date.now()}.md`);
    const tempPdfFile = path.join(this.tempDir, `temp_${Date.now()}.pdf`);
    
    try {
      await fs.writeFile(tempMarkdownFile, content, 'utf-8');
      
      // 使用markdown-pdf命令，不使用外部CSS
      await execAsync(`npx markdown-pdf --css-style "body{font-family:'Microsoft YaHei','SimSun',Arial,sans-serif;font-size:12pt;line-height:1.6;color:#333;margin:2cm;} h1,h2,h3{color:#1890ff;page-break-after:avoid;} table{border-collapse:collapse;width:100%;margin:15px 0;font-size:10pt;page-break-inside:avoid;} th,td{border:1px solid #ddd;padding:6px;text-align:left;vertical-align:top;} th{background-color:#f5f5f5;font-weight:bold;color:#333;} tr:nth-child(even){background-color:#f9f9f9;}" ${tempMarkdownFile} -o ${tempPdfFile}`);
        
        const pdfBuffer = await fs.readFile(tempPdfFile);
        
        // 清理临时文件
        await fs.unlink(tempMarkdownFile).catch(() => {});
        await fs.unlink(tempPdfFile).catch(() => {});
        
        return pdfBuffer;
      } catch (error) {
      // 清理临时文件
      await fs.unlink(tempMarkdownFile).catch(() => {});
      await fs.unlink(tempPdfFile).catch(() => {});
      throw error;
    }
  }

  // 使用HTML转PDF生成PDF
  async generatePDFWithHtmlToPdf(content, options) {
          const html = this.convertMarkdownToHTML(content);
          const tempHtmlFile = path.join(this.tempDir, `temp_${Date.now()}.html`);
    const tempPdfFile = path.join(this.tempDir, `temp_${Date.now()}.pdf`);
    
    try {
          await fs.writeFile(tempHtmlFile, html, 'utf-8');
          
      // 尝试使用wkhtmltopdf（如果可用）
      try {
        await execAsync(`wkhtmltopdf --page-size A4 --margin-top 20 --margin-bottom 20 --margin-left 20 --margin-right 20 --encoding utf-8 --no-outline --quiet ${tempHtmlFile} ${tempPdfFile}`);
      } catch (error) {
        // 如果wkhtmltopdf不可用，尝试使用pandoc
        try {
          await execAsync(`pandoc ${tempHtmlFile} -o ${tempPdfFile} --pdf-engine=wkhtmltopdf`);
        } catch (pandocError) {
          // 如果pandoc也失败，尝试使用weasyprint
          try {
            await execAsync(`python3 -m weasyprint ${tempHtmlFile} ${tempPdfFile}`);
          } catch (weasyprintError) {
            throw new Error('所有PDF生成工具都不可用');
          }
        }
      }
          
          const pdfBuffer = await fs.readFile(tempPdfFile);
          
          // 清理临时文件
          await fs.unlink(tempHtmlFile).catch(() => {});
          await fs.unlink(tempPdfFile).catch(() => {});
          
          return pdfBuffer;
    } catch (error) {
      // 清理临时文件
      await fs.unlink(tempHtmlFile).catch(() => {});
      await fs.unlink(tempPdfFile).catch(() => {});
      throw error;
    }
  }

  // 生成HTML文件
  async generateHTMLFile(content, options) {
    const html = this.convertMarkdownToHTML(content);
    return Buffer.from(html, 'utf-8');
  }

  // 生成Word文档
  async generateWord(content, options = {}) {
    try {
      // 方案1：使用pandoc（最佳效果）
      try {
        return await this.generateWordWithPandoc(content, options);
      } catch (error) {
        console.warn('Pandoc Word生成失败，尝试方案2:', error.message);
        
        // 方案2：使用docx库
        try {
          return await this.generateWordWithDocx(content, options);
        } catch (error) {
          console.warn('Docx库生成失败，使用方案3:', error.message);
          
          // 方案3：生成HTML文件
          return await this.generateHTMLFile(content, options);
        }
      }
    } catch (error) {
      console.error('所有Word文档生成方案都失败了:', error);
      throw new Error(`Word文档生成失败: ${error.message}`);
    }
  }

  // 使用Pandoc生成Word文档
  async generateWordWithPandoc(content, options) {
    const tempMarkdownFile = path.join(this.tempDir, `temp_${Date.now()}.md`);
    const tempDocxFile = path.join(this.tempDir, `temp_${Date.now()}.docx`);
    
    try {
      await fs.writeFile(tempMarkdownFile, content, 'utf-8');
      
      await execAsync(`pandoc ${tempMarkdownFile} -o ${tempDocxFile}`);
      
      const docxBuffer = await fs.readFile(tempDocxFile);
      
      // 清理临时文件
      await fs.unlink(tempMarkdownFile).catch(() => {});
      await fs.unlink(tempDocxFile).catch(() => {});
      
      return docxBuffer;
    } catch (error) {
      // 清理临时文件
      await fs.unlink(tempMarkdownFile).catch(() => {});
      await fs.unlink(tempDocxFile).catch(() => {});
      throw error;
    }
  }

  // 使用Docx库生成Word文档
  async generateWordWithDocx(content, options) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');
    
    const lines = content.split('\n');
    const paragraphs = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        if (paragraphs.length > 0) {
          paragraphs.push(new Paragraph({
            children: [],
            spacing: { after: 200 }
          }));
        }
        continue;
      }
      
      // 检查是否是表格行
      if (line.startsWith('|') && line.endsWith('|')) {
        const tableRows = [];
        let tableStart = i;
        let tableEnd = i;
        
        // 找到表格的所有行
        while (tableEnd < lines.length && lines[tableEnd].trim().startsWith('|') && lines[tableEnd].trim().endsWith('|')) {
          tableEnd++;
        }
        
        // 处理表格
        for (let j = tableStart; j < tableEnd; j++) {
          const tableLine = lines[j].trim();
          const cells = tableLine.split('|').filter(cell => cell.trim() !== '');
          
          if (cells.length > 0) {
            const tableRow = new TableRow({
              children: cells.map((cell, cellIndex) => {
                const cellContent = cell.trim();
                const isHeader = j === tableStart; // 第一行作为表头
                
                return new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellContent,
                          bold: isHeader,
                          size: isHeader ? 24 : 20
                        })
                      ],
                      spacing: { before: 100, after: 100 }
                    })
                  ],
                  width: {
                    size: 100 / cells.length,
                    type: WidthType.PERCENTAGE
                  },
                  shading: isHeader ? {
                    fill: "E7E6E6"
                  } : undefined
                });
              })
            });
            tableRows.push(tableRow);
          }
        }
        
        if (tableRows.length > 0) {
          const table = new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            }
          });
          paragraphs.push(table);
          paragraphs.push(new Paragraph({
            children: [],
            spacing: { after: 200 }
          }));
        }
        
        i = tableEnd - 1; // 跳过已处理的表格行
        continue;
      }
      
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const titleText = line.replace(/^#+\s*/, '');
        
        let headingLevel;
        switch (level) {
          case 1: headingLevel = HeadingLevel.HEADING_1; break;
          case 2: headingLevel = HeadingLevel.HEADING_2; break;
          case 3: headingLevel = HeadingLevel.HEADING_3; break;
          default: headingLevel = HeadingLevel.HEADING_3;
        }
        
        paragraphs.push(new Paragraph({
          text: titleText,
          heading: headingLevel,
          spacing: { before: 400, after: 200 },
          alignment: AlignmentType.LEFT
        }));
      } else {
        paragraphs.push(new Paragraph({
          text: line,
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED
        }));
      }
    }
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs
      }]
    });
    
    return await Packer.toBuffer(doc);
  }

  // 将Markdown转换为HTML
  convertMarkdownToHTML(text) {
    let html = text;
    
    // 转换标题
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 转换GitHub风格表格
    html = this.convertGitHubTables(html);
    
    // 转换列表
    html = this.convertLists(html);
    
    // 转换强调文本
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // 转换代码块
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 转换引用块
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // 转换分割线
    html = html.replace(/^---$/gim, '<hr>');
    
    // 转换链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // 转换段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/^(.+)$/gm, '<p>$1</p>');
    
    // 清理多余的标签
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><p>/g, '<p>');
    html = html.replace(/<\/p><\/p>/g, '</p>');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>复盘报告</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            font-size: 12pt;
            background: white;
          }
          h1 {
            color: #1890ff;
            font-size: 18pt;
            margin-top: 30px;
            margin-bottom: 20px;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 10px;
            page-break-after: avoid;
          }
          h2 {
            color: #1890ff;
            font-size: 16pt;
            margin-top: 25px;
            margin-bottom: 15px;
            page-break-after: avoid;
          }
          h3 {
            color: #1890ff;
            font-size: 14pt;
            margin-top: 20px;
            margin-bottom: 10px;
            page-break-after: avoid;
          }
          p {
            margin-bottom: 12px;
            text-align: justify;
            orphans: 3;
            widows: 3;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
            font-size: 10pt;
            page-break-inside: avoid;
            border: 2px solid #e8e8e8;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td {
            border: 1px solid #e8e8e8;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #dee2e6;
            padding: 12px 8px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          ul, ol {
            margin-bottom: 20px;
            padding-left: 24px;
            line-height: 1.8;
          }
          li {
            margin-bottom: 8px;
            font-size: 12pt;
            color: #2d3748;
          }
          strong {
            font-weight: 600;
            color: #3182ce;
            background-color: #ebf8ff;
            padding: 2px 4px;
            border-radius: 3px;
          }
          em {
            font-style: italic;
            color: #718096;
            background-color: #f7fafc;
            padding: 1px 3px;
            border-radius: 2px;
          }
          code {
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11pt;
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            color: #e53e3e;
          }
          pre {
            background-color: #f7fafc;
            padding: 16px;
            border-radius: 6px;
            font-size: 11pt;
            font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
            color: #2d3748;
            display: block;
            overflow: auto;
            border: 1px solid #e2e8f0;
            margin: 15px 0;
          }
          blockquote {
            border-left: 4px solid #3182ce;
            padding-left: 16px;
            margin: 20px 0;
            background-color: #f7fafc;
            padding: 16px;
            border-radius: 4px;
            font-style: italic;
            color: #4a5568;
          }
          hr {
            border: none;
            height: 2px;
            background-color: #e2e8f0;
            margin: 32px 0;
            border-radius: 1px;
          }
          a {
            color: #3182ce;
            text-decoration: none;
            border-bottom: 1px solid #3182ce;
            padding-bottom: 1px;
          }
          .page-break {
            page-break-before: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
  }

  // 转换GitHub风格表格
  convertGitHubTables(text) {
    const lines = text.split('\n');
    let result = [];
    let inTable = false;
    let tableLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 检查是否是表格行
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        if (!inTable) {
          inTable = true;
        }
        tableLines.push(line);
      } else if (inTable) {
        // 表格结束，处理表格
        if (tableLines.length > 0) {
          result.push(this.processTable(tableLines));
          tableLines = [];
        }
        inTable = false;
        result.push(line);
      } else {
        result.push(line);
      }
    }
    
    // 处理最后的表格
    if (tableLines.length > 0) {
      result.push(this.processTable(tableLines));
    }
    
    return result.join('\n');
  }

  // 处理表格内容
  processTable(tableLines) {
    let tableHtml = '<table>';
    let isHeader = true;
    
    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i];
      const cells = line.split('|').filter(cell => cell.trim() !== '');
      
      // 跳过分隔行（包含 --- 的行）
      if (cells.some(cell => cell.trim().match(/^[-:]+$/))) {
        continue;
      }
      
      if (cells.length > 0) {
        tableHtml += '<tr>';
        cells.forEach(cell => {
          const cellContent = cell.trim();
          const tag = isHeader ? 'th' : 'td';
          tableHtml += `<${tag}>${cellContent}</${tag}>`;
        });
        tableHtml += '</tr>';
      }
      
      if (isHeader) {
        isHeader = false;
      }
    }
    
    tableHtml += '</table>';
    return tableHtml;
  }

  // 转换列表
  convertLists(text) {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let listType = '';
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 检查是否是列表项
      if (trimmedLine.match(/^[-*+]\s+/)) {
        if (!inList) {
          inList = true;
          listType = 'ul';
        }
        listItems.push(line.replace(/^[-*+]\s+/, ''));
      } else if (trimmedLine.match(/^\d+\.\s+/)) {
        if (!inList) {
          inList = true;
          listType = 'ol';
        }
        listItems.push(line.replace(/^\d+\.\s+/, ''));
      } else if (inList) {
        // 列表结束，处理列表
        if (listItems.length > 0) {
          result.push(this.processList(listItems, listType));
          listItems = [];
        }
        inList = false;
        result.push(line);
      } else {
        result.push(line);
      }
    }
    
    // 处理最后的列表
    if (listItems.length > 0) {
      result.push(this.processList(listItems, listType));
    }
    
    return result.join('\n');
  }

  // 处理列表内容
  processList(items, type) {
    const listTag = type === 'ol' ? 'ol' : 'ul';
    let listHtml = `<${listTag}>`;
    
    items.forEach(item => {
      listHtml += `<li>${item}</li>`;
    });
    
    listHtml += `</${listTag}>`;
    return listHtml;
  }
}

module.exports = new DocumentGenerator(); 