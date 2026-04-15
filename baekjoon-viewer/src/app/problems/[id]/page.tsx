"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Problem {
  problem_id: number;
  title: string;
  tier: number;
  tier_name: string;
  time_limit: string;
  memory_limit: string;
  tags: string[];
  samples: { input: string; output: string }[];
  html: string;
}

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/problems/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProblem(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#999" }}>
        로딩 중...
      </div>
    );
  }

  if (!problem || problem.problem_id === undefined) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <h2>문제를 찾을 수 없습니다</h2>
        <button onClick={() => router.push("/")} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // problem.html의 이미지 경로를 API 경로로 치환
  const processedHtml = problem.html
    .replace(/src="\.\.\/\_tiers\/(\d+)\.svg"/g, `src="/api/tiers/$1"`)
    .replace(/src="images\/([^"]+)"/g, `src="/api/problems/${problem.problem_id}/images/$1"`);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px", fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "6px 14px", background: "#f0f0f0", border: "none",
            borderRadius: 6, cursor: "pointer", fontSize: 13,
          }}
        >
          ← 목록
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={`/api/tiers/${problem.tier}`} alt={problem.tier_name} style={{ height: 24 }} />
          <h1 style={{ margin: 0, fontSize: 22, color: "#0076c0" }}>
            {problem.problem_id}번: {problem.title}
          </h1>
          <span style={{ fontSize: 14, color: "#888" }}>{problem.tier_name}</span>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        background: "#f5f5f5", padding: "10px 14px", borderRadius: 6, marginBottom: 20,
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 14,
      }}>
        <span><strong>시간 제한:</strong> {problem.time_limit}</span>
        <span><strong>메모리 제한:</strong> {problem.memory_limit}</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {problem.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => router.push(`/?tag=${encodeURIComponent(tag)}`)}
              style={{
                background: "#e8f4f8", color: "#0076c0", padding: "2px 8px",
                borderRadius: 12, fontSize: 12, cursor: "pointer",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Problem HTML Content */}
      <div
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        style={{
          background: "#fff", padding: 24, borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)", lineHeight: 1.7,
        }}
      />

      {/* External link */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <a
          href={`https://www.acmicpc.net/problem/${problem.problem_id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#0076c0", fontSize: 14 }}
        >
          백준에서 보기 →
        </a>
      </div>
    </div>
  );
}
