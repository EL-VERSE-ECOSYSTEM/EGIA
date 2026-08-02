import * as pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createWorker } from 'tesseract.js';

export enum QuestionType {
  MULTIPLE_CHOICE_SINGLE = "MCQ_SINGLE",
  MULTIPLE_CHOICE_MULTIPLE = "MCQ_MULTIPLE",
  FILL_IN_THE_BLANK = "FILL_BLANK",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER"
}

export interface ProcessedQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  confidence: number;
}

export class PDFToCBTConverter {
  private ai: GoogleGenerativeAI;
  private confidenceThreshold = 0.85;

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async convertPDFToCBT(pdfBuffer: Buffer): Promise<any> {
    const extractedData = await this.extractPDFContent(pdfBuffer);
    let text = extractedData.text;

    if (extractedData.isScanned) {
      text = await this.performOCR(pdfBuffer);
    }

    const cleanedText = this.preprocessText(text);
    const rawQuestions = this.splitIntoQuestions(cleanedText);
    const processedQuestions = await this.parseQuestionsWithAI(rawQuestions);

    return {
      success: true,
      questions: processedQuestions,
      confidence: this.calculateOverallConfidence(processedQuestions)
    };
  }

  private async extractPDFContent(buffer: Buffer) {
    // pdf-parse may be a CommonJS callable; cast to any to be resilient to typing differences
    const data = await (pdf as any)(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      isScanned: data.text.trim().length < 100 && data.numpages > 0
    };
  }

  private async performOCR(buffer: Buffer): Promise<string> {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
  }

  private preprocessText(text: string): string {
    return text
      .replace(/(\w)-\n(\w)/g, '$1$2')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private splitIntoQuestions(text: string): string[] {
    const questionPattern = /(?:^|\n)(?:\d+\.|\d+\)|Q\d+\.)(?:\s+)/g;
    const questions: string[] = [];
    const matches = [...text.matchAll(questionPattern)];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i < matches.length - 1 ? matches[i + 1].index! : text.length;
      questions.push(text.substring(start, end).trim());
    }

    return questions.length > 0 ? questions : [text];
  }

  private async parseQuestionsWithAI(rawQuestions: string[]): Promise<ProcessedQuestion[]> {
    const model = this.ai.getGenerativeModel({ model: "gemini-pro" });
    const results: ProcessedQuestion[] = [];

    for (const raw of rawQuestions) {
      try {
        const prompt = `Parse this exam question into JSON format: ${raw}.
        Identify type (MCQ_SINGLE, MCQ_MULTIPLE, FILL_BLANK, TRUE_FALSE, SHORT_ANSWER),
        questionText, options, and correctAnswer.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          results.push({
            id: crypto.randomUUID(),
            ...parsed,
            points: 1,
            confidence: 0.9
          });
        }
      } catch (e) {
        console.error("AI parsing failed for a question", e);
      }
    }

    return results;
  }

  private calculateOverallConfidence(questions: ProcessedQuestion[]): number {
    if (questions.length === 0) return 0;
    return questions.reduce((acc, q) => acc + q.confidence, 0) / questions.length;
  }
}
