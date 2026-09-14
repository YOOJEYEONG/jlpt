"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };
type Stroke = Point[];
type GuideLevel = "full" | "faint" | "none";

const SIZE = 300;
const PEN_WIDTH = 12;

const GUIDE_OPTIONS: { value: GuideLevel; label: string }[] = [
  { value: "full", label: "진하게" },
  { value: "faint", label: "흐리게" },
  { value: "none", label: "없이" },
];

const GUIDE_ALPHA: Record<GuideLevel, number> = { full: 0.28, faint: 0.12, none: 0 };

/**
 * 마우스·터치로 글자를 따라 쓰는 연습판.
 * 배경에 흐린 글자와 사각 보조선을 그리고, 그 위에 사용자의 획을 얹습니다.
 */
export function KanaTracer({
  character,
  romaji,
  onWrote,
}: {
  character: string;
  romaji: string;
  onWrote?: (strokeCount: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [guide, setGuide] = useState<GuideLevel>("full");

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 보조선(田자 격자)
    ctx.strokeStyle = "#e6e8ec";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(SIZE / 2, 0);
    ctx.lineTo(SIZE / 2, SIZE);
    ctx.moveTo(0, SIZE / 2);
    ctx.lineTo(SIZE, SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 따라 쓸 글자
    const alpha = GUIDE_ALPHA[guide];
    if (alpha > 0) {
      ctx.fillStyle = `rgba(20, 22, 26, ${alpha})`;
      ctx.font = `${SIZE * 0.72}px "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(character, SIZE / 2, SIZE / 2 + SIZE * 0.03);
    }

    // 사용자가 그린 획
    ctx.strokeStyle = "#2f5bd8";
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const point of stroke.slice(1)) ctx.lineTo(point.x, point.y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
      ctx.stroke();
    }
  }, [character, guide]);

  // 글자가 바뀌면 부모가 key로 다시 마운트하므로, 여기서는 다시 그리기만 하면 됩니다.
  useEffect(() => {
    paint();
  }, [paint]);

  function toPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokesRef.current = [...strokesRef.current, [toPoint(event)]];
    paint();
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const strokes = strokesRef.current;
    strokes[strokes.length - 1].push(toPoint(event));
    paint();
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const count = strokesRef.current.length;
    setStrokeCount(count);
    onWrote?.(count);
  }

  function clear() {
    strokesRef.current = [];
    setStrokeCount(0);
    paint();
  }

  function undo() {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    paint();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs size="sm" value={guide} onChange={setGuide} options={GUIDE_OPTIONS} />
        <span className="text-xs text-muted">쓴 획 {strokeCount}</span>
      </div>

      <div className="mt-3 flex justify-center">
        <canvas
          ref={canvasRef}
          aria-label={`${character} 따라쓰기 연습판`}
          role="img"
          style={{ width: SIZE, height: SIZE, touchAction: "none" }}
          className={cn("max-w-full cursor-crosshair rounded-2xl border border-line bg-surface")}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={undo} disabled={strokeCount === 0}>
          <Undo2 className="h-4 w-4" /> 한 획 지우기
        </Button>
        <Button variant="outline" size="sm" onClick={clear} disabled={strokeCount === 0}>
          <Eraser className="h-4 w-4" /> 전부 지우기
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        {guide === "none"
          ? `보조선만 보고 ${romaji} 소리가 나는 글자를 직접 써 보세요.`
          : "흐린 글자를 따라 그은 뒤, 안내를 '없이'로 바꿔 스스로 써 보세요."}
      </p>
    </div>
  );
}
