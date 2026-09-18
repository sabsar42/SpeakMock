import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AiCriterionScore, TranscriptTurn } from "@/lib/types";

export interface AiTestReportData {
  studentName: string;
  testDate: string;
  fluencyCoherence: AiCriterionScore;
  lexicalResource: AiCriterionScore;
  grammaticalRange: AiCriterionScore;
  pronunciation: AiCriterionScore;
  overallBand: number;
  overallFeedback: string;
  transcript: TranscriptTurn[];
}

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// pdf-lib's standard fonts only support WinAnsi encoding, which lacks many
// Unicode characters LLM output commonly contains (curly quotes, em/en
// dashes, non-breaking hyphens, ellipsis) — drawing them throws rather than
// silently dropping them. Normalize to the closest WinAnsi-safe equivalent,
// then strip anything still outside the printable Latin-1 range as a
// fallback so unexpected characters can never crash PDF generation.
function sanitizeForWinAnsi(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "");
}

const COLOR_TEXT = rgb(0x15 / 255, 0x24 / 255, 0x30 / 255);
const COLOR_MUTED = rgb(0x4b / 255, 0x63 / 255, 0x73 / 255);
const COLOR_ACCENT = rgb(0xc2 / 255, 0x5c / 255, 0x15 / 255);
const COLOR_PRIMARY = rgb(0x1f / 255, 0x4a / 255, 0x68 / 255);

/**
 * pdf-lib has no layout engine (no flexbox, no automatic text flow), so this
 * module implements the minimum needed by hand: word-wrapping and a cursor
 * that tracks the current y position, adding pages as content overflows.
 * Deliberately chosen over @react-pdf/renderer, whose React reconciler
 * crashes when bundled into a Vercel serverless function with React 19 — a
 * known upstream issue with no fix at the time this was written. pdf-lib is
 * pure JS with no reconciler and no native dependencies.
 */
class ReportBuilder {
  private doc!: PDFDocument;
  private page!: PDFPage;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private italicFont!: PDFFont;
  private y = PAGE_HEIGHT - MARGIN;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.italicFont = await this.doc.embedFont(StandardFonts.HelveticaOblique);
    this.addPage();
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN) this.addPage();
  }

  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = sanitizeForWinAnsi(text).split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private drawParagraph(
    text: string,
    options: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      x?: number;
      maxWidth?: number;
      lineHeight?: number;
      spacingAfter?: number;
    } = {}
  ) {
    const font = options.font ?? this.font;
    const size = options.size ?? 9;
    const color = options.color ?? COLOR_TEXT;
    const x = options.x ?? MARGIN;
    const maxWidth = options.maxWidth ?? CONTENT_WIDTH;
    const lineHeight = options.lineHeight ?? size * 1.4;
    const lines = this.wrapText(text, font, size, maxWidth);

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, { x, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    }
    this.y -= options.spacingAfter ?? 0;
  }

  private drawHeading(text: string, size: number, spacingAfter = 8) {
    this.ensureSpace(size + spacingAfter);
    this.page.drawText(sanitizeForWinAnsi(text), {
      x: MARGIN,
      y: this.y - size,
      size,
      font: this.boldFont,
      color: COLOR_TEXT,
    });
    this.y -= size + spacingAfter;
  }

  private drawCriterion(title: string, data: AiCriterionScore) {
    this.ensureSpace(70);
    this.page.drawText(String(data.score), {
      x: MARGIN,
      y: this.y - 20,
      size: 20,
      font: this.boldFont,
      color: COLOR_PRIMARY,
    });
    this.y -= 26;

    this.drawParagraph(title, { font: this.boldFont, size: 11, spacingAfter: 3 });
    this.drawParagraph(data.justification, { size: 9, color: COLOR_MUTED, spacingAfter: 3 });

    for (const example of data.examples) {
      this.drawParagraph(`“${example}”`, {
        font: this.italicFont,
        size: 8.5,
        color: COLOR_MUTED,
        spacingAfter: 2,
      });
    }

    this.drawParagraph(`Tip: ${data.tip}`, {
      size: 8.5,
      color: COLOR_ACCENT,
      spacingAfter: 12,
    });
  }

  async build(data: AiTestReportData): Promise<Uint8Array> {
    // Header
    this.page.drawText("SpeakMock", {
      x: MARGIN,
      y: this.y - 18,
      size: 18,
      font: this.boldFont,
      color: COLOR_TEXT,
    });
    const speakWidth = this.boldFont.widthOfTextAtSize("SpeakMock", 18);
    this.page.drawText(" - IELTS Speaking Mock Test Report", {
      x: MARGIN + speakWidth,
      y: this.y - 18,
      size: 13,
      font: this.font,
      color: COLOR_TEXT,
    });
    this.y -= 24;

    this.drawParagraph(`${data.studentName} - ${data.testDate}`, {
      size: 10,
      color: COLOR_MUTED,
      spacingAfter: 14,
    });

    // Overall band
    this.page.drawText("OVERALL BAND SCORE", {
      x: MARGIN,
      y: this.y - 9,
      size: 9,
      font: this.font,
      color: COLOR_MUTED,
    });
    this.y -= 16;
    this.page.drawText(String(data.overallBand), {
      x: MARGIN,
      y: this.y - 36,
      size: 36,
      font: this.boldFont,
      color: COLOR_ACCENT,
    });
    this.y -= 46;

    this.drawParagraph(data.overallFeedback, { size: 9.5, spacingAfter: 14 });

    // Criteria
    this.drawCriterion("Fluency & Coherence", data.fluencyCoherence);
    this.drawCriterion("Lexical Resource", data.lexicalResource);
    this.drawCriterion("Grammatical Range & Accuracy", data.grammaticalRange);
    this.drawCriterion("Pronunciation", data.pronunciation);

    this.drawParagraph(
      "Pronunciation is estimated from speech transcription clarity, not direct audio analysis.",
      { size: 8, font: this.italicFont, color: COLOR_MUTED, spacingAfter: 10 }
    );

    // Transcript
    this.drawHeading("Full Transcript", 13);
    for (const part of [1, 2, 3] as const) {
      const turns = data.transcript.filter((t) => t.part === part);
      if (turns.length === 0) continue;

      this.drawParagraph(`Part ${part}`, { font: this.boldFont, size: 10, spacingAfter: 4 });
      for (const turn of turns) {
        const speaker = turn.speaker === "examiner" ? "Examiner" : data.studentName;
        this.drawParagraph(`${speaker}:`, {
          font: this.boldFont,
          size: 9,
          spacingAfter: 1,
        });
        this.drawParagraph(turn.text, { size: 9, color: COLOR_MUTED, spacingAfter: 6 });
      }
    }

    this.drawParagraph(
      "This is a practice mock test result only. It is not an official IELTS score.",
      { size: 8, color: COLOR_MUTED, spacingAfter: 0 }
    );

    return this.doc.save();
  }
}

export async function generateAiTestReportPdf(data: AiTestReportData): Promise<Uint8Array> {
  const builder = new ReportBuilder();
  await builder.init();
  return builder.build(data);
}
