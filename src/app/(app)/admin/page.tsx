"use client";

import { useState } from "react";
import { Copy, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import {
  BUSINESS_PHRASES,
  GRAMMAR,
  INTERVIEW_QUESTIONS,
  KANJI,
  LISTENINGS,
  MOCK_TESTS,
  READINGS,
  VOCABULARY,
} from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";

type Kind = "vocabulary" | "grammar" | "kanji";

const DATA_FILES = [
  { label: "단어", count: VOCABULARY.length, path: "src/data/vocabulary/{level}.json" },
  { label: "문법", count: GRAMMAR.length, path: "src/data/grammar/{level}.json" },
  { label: "한자", count: KANJI.length, path: "src/data/kanji/{level}.json" },
  { label: "독해", count: READINGS.length, path: "src/data/reading/{level}.json" },
  { label: "청해", count: LISTENINGS.length, path: "src/data/listening/all.json" },
  { label: "비즈니스 표현", count: BUSINESS_PHRASES.length, path: "src/data/job/business.json" },
  { label: "면접 질문", count: INTERVIEW_QUESTIONS.length, path: "src/data/job/interview.json" },
  { label: "모의고사", count: MOCK_TESTS.length, path: "src/data/tests/mock.json" },
];

export default function AdminPage() {
  const user = useCurrentUser();
  const accounts = useAppStore((state) => state.accounts);
  const allData = useAppStore((state) => state.data);

  const [kind, setKind] = useState<Kind>("vocabulary");
  const [level, setLevel] = useState<JlptLevel>("N5");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");

  if (!user) return null;

  const FORM: Record<Kind, { key: string; label: string; placeholder: string }[]> = {
    vocabulary: [
      { key: "word", label: "일본어", placeholder: "食べる" },
      { key: "reading", label: "읽기", placeholder: "たべる" },
      { key: "meaning", label: "뜻", placeholder: "먹다" },
      { key: "partOfSpeech", label: "품사", placeholder: "동사(2류)" },
      { key: "example", label: "예문", placeholder: "私は朝ご飯を食べます。" },
      { key: "exampleReading", label: "예문 읽기", placeholder: "わたしはあさごはんをたべます。" },
      { key: "exampleTranslation", label: "예문 해석", placeholder: "나는 아침밥을 먹습니다." },
    ],
    grammar: [
      { key: "title", label: "문법 형태", placeholder: "〜わけではない" },
      { key: "meaning", label: "의미", placeholder: "반드시 ~인 것은 아니다" },
      { key: "connection", label: "접속", placeholder: "보통형 + わけではない" },
      { key: "explanation", label: "설명", placeholder: "부분 부정을 나타냅니다." },
      { key: "examPoint", label: "출제 포인트", placeholder: "わけ 시리즈 구분" },
    ],
    kanji: [
      { key: "character", label: "한자", placeholder: "日" },
      { key: "meaning", label: "뜻", placeholder: "날, 해" },
      { key: "onyomi", label: "음독(쉼표 구분)", placeholder: "ニチ, ジツ" },
      { key: "kunyomi", label: "훈독(쉼표 구분)", placeholder: "ひ, か" },
      { key: "strokes", label: "획수", placeholder: "4" },
    ],
  };

  function generate() {
    const id = `${kind[0]}-${level.toLowerCase()}-${String(Date.now()).slice(-4)}`;
    let payload: Record<string, unknown>;

    if (kind === "vocabulary") {
      payload = {
        id,
        word: fields.word ?? "",
        reading: fields.reading ?? "",
        meaning: fields.meaning ?? "",
        partOfSpeech: fields.partOfSpeech ?? "명사",
        level,
        example: fields.example ?? "",
        exampleReading: fields.exampleReading ?? "",
        exampleTranslation: fields.exampleTranslation ?? "",
        importance: 2,
      };
    } else if (kind === "grammar") {
      payload = {
        id,
        title: fields.title ?? "",
        meaning: fields.meaning ?? "",
        connection: fields.connection ?? "",
        explanation: fields.explanation ?? "",
        level,
        difficulty: 2,
        examples: [{ jp: "", reading: "", ko: "" }],
        related: [],
        examPoint: fields.examPoint ?? "",
      };
    } else {
      payload = {
        id,
        character: fields.character ?? "",
        meaning: fields.meaning ?? "",
        onyomi: (fields.onyomi ?? "").split(",").map((value) => value.trim()).filter(Boolean),
        kunyomi: (fields.kunyomi ?? "").split(",").map((value) => value.trim()).filter(Boolean),
        strokes: Number(fields.strokes) || 1,
        level,
        words: [{ word: "", reading: "", meaning: "" }],
        example: { jp: "", ko: "" },
      };
    }

    setOutput(JSON.stringify(payload, null, 2));
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="콘텐츠 관리"
        description="콘텐츠는 JSON 파일로 관리됩니다. 여기서 항목을 작성하면 붙여 넣을 JSON이 만들어집니다."
      />

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" /> 현재 수록 콘텐츠
        </CardTitle>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {DATA_FILES.map((file) => (
            <li key={file.label} className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
              <span className="text-sm font-semibold">{file.label}</span>
              <span className="flex items-center gap-2">
                <code className="text-[11px] text-muted">{file.path}</code>
                <Badge tone="primary">{file.count}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-3">
        <CardTitle>항목 추가</CardTitle>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tabs
            size="sm"
            value={kind}
            onChange={(value) => {
              setKind(value);
              setFields({});
              setOutput("");
            }}
            options={[
              { value: "vocabulary" as Kind, label: "단어" },
              { value: "grammar" as Kind, label: "문법" },
              { value: "kanji" as Kind, label: "한자" },
            ]}
          />
          <Select
            className="h-9 w-28"
            value={level}
            onChange={(event) => setLevel(event.target.value as JlptLevel)}
            aria-label="레벨"
          >
            {JLPT_LEVELS.map((item) => (
              <option key={item} value={item}>
                {LEVEL_LABEL[item]}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {FORM[kind].map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                placeholder={field.placeholder}
                value={fields[field.key] ?? ""}
                onChange={(event) => setFields((prev) => ({ ...prev, [field.key]: event.target.value }))}
              />
            </div>
          ))}
        </div>

        <Button className="mt-4" onClick={generate}>
          JSON 생성
        </Button>

        {output ? (
          <div className="mt-4">
            <Label htmlFor="output">생성된 JSON</Label>
            <Textarea id="output" rows={12} readOnly value={output} className="font-mono text-xs" />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigator.clipboard?.writeText(output)}
            >
              <Copy className="h-4 w-4" /> 복사하기
            </Button>
            <p className="mt-2 text-xs text-muted">
              이 JSON을 해당 데이터 파일 배열 안에 붙여 넣으면 다음 빌드부터 학습 콘텐츠에 반영됩니다.
            </p>
          </div>
        ) : null}
      </Card>

      <Card className="mt-3">
        <CardTitle>사용자 통계</CardTitle>
        <ul className="mt-3 space-y-2">
          {accounts.map((account) => {
            const stats = allData[account.email];
            return (
              <li key={account.email} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background px-3 py-2">
                <span className="text-sm font-semibold">{account.name}</span>
                <span className="flex flex-wrap gap-2 text-xs text-muted">
                  <Badge>{stats ? LEVEL_LABEL[stats.currentLevel] : "-"}</Badge>
                  <Badge tone="primary">{stats ? `${stats.xp} XP` : "0 XP"}</Badge>
                  <Badge tone="accent">{stats ? `${stats.streak}일 연속` : "0일"}</Badge>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
