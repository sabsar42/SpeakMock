import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AiCriterionScore, TranscriptTurn } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#152430" },
  header: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  headerAccent: { color: "#C25C15" },
  subheader: { fontSize: 10, color: "#4B6373", marginBottom: 16 },
  overallBox: { alignItems: "center", marginBottom: 20 },
  overallLabel: { fontSize: 9, color: "#8098A8", textTransform: "uppercase" },
  overallScore: { fontSize: 40, fontWeight: 700, color: "#C25C15" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  card: {
    width: "48%",
    border: "1pt solid #E1E8ED",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  cardScore: { fontSize: 20, fontWeight: 700, color: "#1F4A68" },
  cardTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  cardText: { fontSize: 9, color: "#4B6373", marginBottom: 4, lineHeight: 1.4 },
  quote: { fontSize: 8.5, fontStyle: "italic", color: "#4B6373", marginBottom: 2 },
  tipBox: { backgroundColor: "#FDEEE0", borderRadius: 4, padding: 6, marginTop: 4 },
  tipText: { fontSize: 8.5, color: "#9E4A0F" },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 6 },
  transcriptTurn: { marginBottom: 6 },
  transcriptSpeaker: { fontSize: 9, fontWeight: 700 },
  transcriptText: { fontSize: 9, color: "#4B6373" },
  footer: { marginTop: 20, fontSize: 8, color: "#8098A8", textAlign: "center" },
  disclaimer: { fontSize: 8, color: "#8098A8", marginTop: 8, fontStyle: "italic" },
});

interface CriterionCardProps {
  title: string;
  data: AiCriterionScore;
}

function CriterionCard({ title, data }: CriterionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardScore}>{data.score}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{data.justification}</Text>
      {data.examples.map((example, i) => (
        <Text key={i} style={styles.quote}>
          &ldquo;{example}&rdquo;
        </Text>
      ))}
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>Tip: {data.tip}</Text>
      </View>
    </View>
  );
}

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

export function AiTestReportPdf({
  studentName,
  testDate,
  fluencyCoherence,
  lexicalResource,
  grammaticalRange,
  pronunciation,
  overallBand,
  overallFeedback,
  transcript,
}: AiTestReportData) {
  const partLabel = (part: 1 | 2 | 3) => `Part ${part}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          Speak<Text style={styles.headerAccent}>Mock</Text> — IELTS Speaking Mock Test Report
        </Text>
        <Text style={styles.subheader}>
          {studentName} · {testDate}
        </Text>

        <View style={styles.overallBox}>
          <Text style={styles.overallLabel}>Overall Band Score</Text>
          <Text style={styles.overallScore}>{overallBand}</Text>
        </View>

        <Text style={styles.cardText}>{overallFeedback}</Text>

        <View style={styles.grid}>
          <CriterionCard title="Fluency & Coherence" data={fluencyCoherence} />
          <CriterionCard title="Lexical Resource" data={lexicalResource} />
          <CriterionCard title="Grammatical Range & Accuracy" data={grammaticalRange} />
          <CriterionCard title="Pronunciation" data={pronunciation} />
        </View>

        <Text style={styles.disclaimer}>
          Pronunciation is estimated from speech transcription clarity, not direct audio
          analysis.
        </Text>

        <Text style={styles.sectionTitle}>Full Transcript</Text>
        {([1, 2, 3] as const).map((part) => {
          const turns = transcript.filter((t) => t.part === part);
          if (turns.length === 0) return null;
          return (
            <View key={part}>
              <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 6, marginBottom: 4 }}>
                {partLabel(part)}
              </Text>
              {turns.map((turn, i) => (
                <View key={i} style={styles.transcriptTurn}>
                  <Text style={styles.transcriptSpeaker}>
                    {turn.speaker === "examiner" ? "Examiner" : studentName}:
                  </Text>
                  <Text style={styles.transcriptText}>{turn.text}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.footer}>
          This is a practice mock test result only. It is not an official IELTS score.
        </Text>
      </Page>
    </Document>
  );
}
