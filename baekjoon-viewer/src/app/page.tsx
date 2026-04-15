"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Problem {
  problem_id: number;
  title: string;
  tier: number;
  tier_name: string;
  tags: string[];
}

interface TierStat {
  tier: number;
  tier_name: string;
  count: number;
}

const TIER_COLORS: Record<string, string> = {
  Unrated: "#666",
  "Bronze V": "#ad5600", "Bronze IV": "#ad5600", "Bronze III": "#ad5600", "Bronze II": "#ad5600", "Bronze I": "#ad5600",
  "Silver V": "#435f7a", "Silver IV": "#435f7a", "Silver III": "#435f7a", "Silver II": "#435f7a", "Silver I": "#435f7a",
  "Gold V": "#ec9a00", "Gold IV": "#ec9a00", "Gold III": "#ec9a00", "Gold II": "#ec9a00", "Gold I": "#ec9a00",
  "Platinum V": "#27e2a4", "Platinum IV": "#27e2a4", "Platinum III": "#27e2a4", "Platinum II": "#27e2a4", "Platinum I": "#27e2a4",
  "Diamond V": "#00b4fc", "Diamond IV": "#00b4fc", "Diamond III": "#00b4fc", "Diamond II": "#00b4fc", "Diamond I": "#00b4fc",
  "Ruby V": "#ff0062", "Ruby IV": "#ff0062", "Ruby III": "#ff0062", "Ruby II": "#ff0062", "Ruby I": "#ff0062",
};

function getTierColor(tierName: string) {
  return TIER_COLORS[tierName] || "#666";
}

export default function Home() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState("");
  const [tiers, setTiers] = useState<TierStat[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/problems?type=tiers").then((r) => r.json()).then(setTiers);
    fetch("/api/problems?type=tags").then((r) => r.json()).then(setTags);
  }, []);

  const fetchProblems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (selectedTier !== undefined) params.set("tier", String(selectedTier));
    if (selectedTag) params.set("tag", selectedTag);
    if (search) params.set("search", search);

    fetch(`/api/problems?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProblems(data.problems);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
      });
  }, [page, selectedTier, selectedTag, search]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleSync = async () => {
    setSyncing(true);
    await fetch("/api/sync", { method: "POST" });
    setSyncing(false);
    fetchProblems();
    fetch("/api/problems?type=tiers").then((r) => r.json()).then(setTiers);
    fetch("/api/problems?type=tags").then((r) => r.json()).then(setTags);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const tierGroups = [
    { label: "Bronze", tiers: tiers.filter((t) => t.tier >= 1 && t.tier <= 5), color: "#ad5600" },
    { label: "Silver", tiers: tiers.filter((t) => t.tier >= 6 && t.tier <= 10), color: "#435f7a" },
    { label: "Gold", tiers: tiers.filter((t) => t.tier >= 11 && t.tier <= 15), color: "#ec9a00" },
    { label: "Platinum", tiers: tiers.filter((t) => t.tier >= 16 && t.tier <= 20), color: "#27e2a4" },
    { label: "Diamond", tiers: tiers.filter((t) => t.tier >= 21 && t.tier <= 25), color: "#00b4fc" },
    { label: "Ruby", tiers: tiers.filter((t) => t.tier >= 26 && t.tier <= 30), color: "#ff0062" },
  ];

  const unrated = tiers.find((t) => t.tier === 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Sidebar */}
      <aside style={{
        width: 280, background: "#fff", borderRight: "1px solid #e0e0e0",
        padding: 20, overflowY: "auto", flexShrink: 0,
      }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, color: "#0076c0" }}>Baekjoon Viewer</h2>

        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            width: "100%", padding: "8px 12px", background: syncing ? "#ccc" : "#0076c0",
            color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, marginBottom: 20,
          }}
        >
          {syncing ? "동기화 중..." : "문제 동기화"}
        </button>

        {/* Tier Filter */}
        <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "#333" }}>티어 필터</h3>
        <div
          onClick={() => { setSelectedTier(undefined); setPage(1); }}
          style={{
            padding: "4px 8px", cursor: "pointer", borderRadius: 4, fontSize: 13,
            background: selectedTier === undefined ? "#e8f4f8" : "transparent",
            marginBottom: 2,
          }}
        >
          전체 ({tiers.reduce((s, t) => s + t.count, 0)})
        </div>
        {unrated && (
          <div
            onClick={() => { setSelectedTier(0); setPage(1); }}
            style={{
              padding: "4px 8px", cursor: "pointer", borderRadius: 4, fontSize: 13,
              background: selectedTier === 0 ? "#e8f4f8" : "transparent",
              color: "#666", marginBottom: 4,
            }}
          >
            Unrated ({unrated.count})
          </div>
        )}
        {tierGroups.map((group) =>
          group.tiers.length > 0 ? (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: group.color, padding: "2px 8px" }}>
                {group.label} ({group.tiers.reduce((s, t) => s + t.count, 0)})
              </div>
              {group.tiers.map((t) => (
                <div
                  key={t.tier}
                  onClick={() => { setSelectedTier(t.tier); setPage(1); }}
                  style={{
                    padding: "2px 8px 2px 16px", cursor: "pointer", borderRadius: 4, fontSize: 12,
                    background: selectedTier === t.tier ? "#e8f4f8" : "transparent",
                  }}
                >
                  <img src={`/api/tiers/${t.tier}`} alt="" style={{ height: 14, verticalAlign: "middle", marginRight: 4 }} />
                  {t.tier_name} ({t.count})
                </div>
              ))}
            </div>
          ) : null
        )}

        {/* Tag Filter */}
        <h3 style={{ fontSize: 14, margin: "16px 0 8px", color: "#333" }}>태그 필터</h3>
        <div
          onClick={() => { setSelectedTag(""); setPage(1); }}
          style={{
            padding: "4px 8px", cursor: "pointer", borderRadius: 4, fontSize: 13,
            background: !selectedTag ? "#e8f4f8" : "transparent", marginBottom: 2,
          }}
        >
          전체
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {tags.map((t) => (
            <div
              key={t.tag}
              onClick={() => { setSelectedTag(t.tag); setPage(1); }}
              style={{
                padding: "2px 8px", cursor: "pointer", borderRadius: 4, fontSize: 12,
                background: selectedTag === t.tag ? "#e8f4f8" : "transparent",
              }}
            >
              {t.tag} ({t.count})
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 24 }}>
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="문제 번호 또는 제목 검색..."
            style={{
              flex: 1, padding: "10px 14px", border: "1px solid #ddd",
              borderRadius: 8, fontSize: 14, outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 20px", background: "#0076c0", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14,
            }}
          >
            검색
          </button>
        </form>

        {/* Stats */}
        <div style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
          총 {total.toLocaleString()}개 문제
          {selectedTier !== undefined && ` | 티어: ${tiers.find((t) => t.tier === selectedTier)?.tier_name || "Unrated"}`}
          {selectedTag && ` | 태그: ${selectedTag}`}
          {search && ` | 검색: "${search}"`}
        </div>

        {/* Problem List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>로딩 중...</div>
        ) : problems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            문제가 없습니다. 동기화를 먼저 실행해주세요.
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", width: 80 }}>#</th>
                  <th style={{ padding: "10px 14px", width: 40 }}>티어</th>
                  <th style={{ padding: "10px 14px" }}>제목</th>
                  <th style={{ padding: "10px 14px" }}>태그</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr
                    key={p.problem_id}
                    onClick={() => router.push(`/problems/${p.problem_id}`)}
                    style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f8f9ff")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{p.problem_id}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <img src={`/api/tiers/${p.tier}`} alt={p.tier_name} title={p.tier_name} style={{ height: 18 }} />
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: getTierColor(p.tier_name), fontWeight: 500 }}>{p.title}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); setPage(1); }}
                          style={{
                            display: "inline-block", background: "#e8f4f8", color: "#0076c0",
                            padding: "1px 6px", borderRadius: 10, fontSize: 11, marginRight: 4,
                            cursor: "pointer",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {p.tags.length > 3 && (
                        <span style={{ fontSize: 11, color: "#999" }}>+{p.tags.length - 3}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 20 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "6px 12px", border: "1px solid #ddd", borderRadius: 4,
                background: "#fff", cursor: page <= 1 ? "default" : "pointer", fontSize: 13,
              }}
            >
              이전
            </button>
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 5, totalPages - 9));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: "6px 10px", border: "1px solid #ddd", borderRadius: 4,
                    background: p === page ? "#0076c0" : "#fff",
                    color: p === page ? "#fff" : "#333",
                    cursor: "pointer", fontSize: 13,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "6px 12px", border: "1px solid #ddd", borderRadius: 4,
                background: "#fff", cursor: page >= totalPages ? "default" : "pointer", fontSize: 13,
              }}
            >
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
