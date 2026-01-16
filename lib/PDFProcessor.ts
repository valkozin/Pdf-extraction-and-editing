export interface PageElement {
  type: 'header' | 'paragraph' | 'list_item' | 'table' | 'image_caption';
  content: string;
  metadata?: {
    level?: number;
    rows?: number;
    cols?: number;
  };
}

export interface ExtractedData {
  document: string;
  pageCount: number;
  processedDate: string;
  pages: {
    pageIndex: number;
    elements: PageElement[];
  }[];
}

// Keeping this for compatibility or if we still want local extraction as fallback
export async function extractTextFromPDF(file: File): Promise<any> {
  // ... (existing logic can be moved to a legacy function or kept as fallback)
  // For now, we will use the API route primarily.
}
