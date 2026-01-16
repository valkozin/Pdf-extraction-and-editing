export interface ExtractedData {
  metadata: {
    title: string;
    pages: number;
    extractedAt: string;
  };
  content: {
    pageNumber: number;
    lines: {
      text: string;
      y: number;
    }[];
  }[];
}

export async function extractTextFromPDF(file: File): Promise<ExtractedData> {
  try {
    // Lazy import pdfjs-dist only when this function is called (client-side)
    const pdfjsLib = await import('pdfjs-dist');
    
    // Use a more reliable CDN (unpkg) and version-matched worker
    // For pdfjs-dist v4+, the worker is often an .mjs file
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const result: ExtractedData = {
      metadata: {
        title: file.name,
        pages: pdf.numPages,
        extractedAt: new Date().toISOString(),
      },
      content: [],
    };

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const linesMap = new Map<number, string[]>();
      
      textContent.items.forEach((item: any) => {
        const y = Math.round(item.transform[5]);
        if (!linesMap.has(y)) {
          linesMap.set(y, []);
        }
        linesMap.get(y)!.push(item.str);
      });

      const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
      
      const pageLines = sortedY.map(y => ({
        text: linesMap.get(y)!.join(' ').trim(),
        y: y
      })).filter(line => line.text.length > 0);

      result.content.push({
        pageNumber: i,
        lines: pageLines,
      });
    }

    return result;
  } catch (error: any) {
    console.error('Extraction error:', error);
    throw new Error(`PDF Error: ${error.message || 'Unknown error during extraction'}`);
  }
}

export function convertToStructuredJson(data: ExtractedData): any {
  return {
    document: data.metadata.title,
    pageCount: data.metadata.pages,
    processedDate: data.metadata.extractedAt,
    pages: data.content.map(p => ({
      pageIndex: p.pageNumber,
      textBlocks: p.lines.map(l => l.text)
    }))
  };
}
