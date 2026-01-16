import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        // Updated to a much more recent and available model.
        const model = genAI.getGenerativeModel(
            {
                model: 'gemini-2.0-flash',
                generationConfig: { responseMimeType: 'application/json' }
            },
            { apiVersion: 'v1beta' }
        );

        const prompt = `Extract all text and structural elements from the provided PDF. 
Categorize each element into one of the following types:
- header (include level: 1, 2, 3, etc.)
- paragraph
- list_item
- table
- image_caption

Maintain the original order of elements. If the PDF contains images, perform OCR.
Return a valid JSON object with pages containing elements. 
Follow the schema: { document: string, pageCount: number, processedDate: string, pages: [{ pageIndex: number, elements: [{ type: string, content: string, metadata?: object }] }] }`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: Buffer.from(buffer).toString('base64'),
                    mimeType: 'application/pdf',
                },
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();

        try {
            const parsedJson = JSON.parse(text);
            return NextResponse.json(parsedJson);
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON response:', text);
            return NextResponse.json({ error: 'Failed to process structured data' }, { status: 500 });
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
