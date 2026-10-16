"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BetSelection = {
  id: string;
  bet_id: string;
  match_id: string;
  odd_id: string;
  league: string | null;
  country: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  market: string;
  selection: string;
  odds: string | number;
  result: string | null;
  home_score: number | null;
  away_score: number | null;
  match_status: string | null;
  match_result_status: string | null;
};

type Bet = {
  id: string;
  user_id: string;
  bet_reference: string;
  bet_type: string;
  stake: string | number;
  total_odds: string | number;
  potential_return: string | number;
  status: string;
  created_at: string;
  updated_at: string;
  selections: BetSelection[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://betzone-api-jmck.onrender.com";
const TOKEN_KEY = "betzone_access_token";

function formatMoney(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not available";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBetType(value: string) {
  const normalized = value?.toLowerCase();
  if (normalized === "multiple" || normalized === "accumulator") return "Accumulator";
  if (normalized === "single") return "Single";
  if (normalized === "system") return "System bet";
  return value || "Bet";
}

function getBetStatus(status: string) {
  const normalized = (status || "").toLowerCase();
  if (["won", "win", "settled_won"].includes(normalized)) {
    return { label: "WON", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" };
  }
  if (["lost", "lose", "settled_lost"].includes(normalized)) {
    return { label: "LOST", className: "border-red-400/30 bg-red-400/10 text-red-300" };
  }
  if (["void", "cancelled", "canceled"].includes(normalized)) {
    return { label: "VOID", className: "border-slate-400/30 bg-slate-400/10 text-slate-300" };
  }
  return { label: "OPEN", className: "border-amber-400/30 bg-amber-400/10 text-amber-200" };
}

function getSelectionResult(result: string | null) {
  const normalized = (result || "pending").toLowerCase();
  if (["won", "win"].includes(normalized)) return { label: "Won", className: "text-emerald-300" };
  if (["lost", "lose"].includes(normalized)) return { label: "Lost", className: "text-red-300" };
  if (["void", "cancelled", "canceled"].includes(normalized)) return { label: "Void", className: "text-slate-300" };
  return { label: "Pending", className: "text-amber-200" };
}

function isSettledBet(status: string) {
  return [
    "won", "win", "lost", "lose", "settled", "settled_won",
    "settled_lost", "void", "cancelled", "canceled",
  ].includes((status || "").toLowerCase());
}

function getMatchScore(selection: BetSelection) {
  if (
    selection.home_score === null ||
    selection.home_score === undefined ||
    selection.away_score === null ||
    selection.away_score === undefined
  ) return null;
  return `${selection.home_score} - ${selection.away_score}`;
}

function getMatchResultLabel(selection: BetSelection) {
  const status = selection.match_result_status?.toLowerCase();
  if (
    status === "finished" ||
    (selection.home_score !== null &&
      selection.home_score !== undefined &&
      selection.away_score !== null &&
      selection.away_score !== undefined)
  ) return "Full time";
  if (status === "postponed") return "Postponed";
  if (status === "cancelled") return "Cancelled";
  if (status === "abandoned") return "Abandoned";
  return "Match result";
}

export default function MyBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [activeTab, setActiveTab] = useState<"ongoing" | "settled">("ongoing");
  const [filter, setFilter] = useState<"all" | "singles" | "multiples">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedBet, setExpandedBet] = useState<string | null>(null);

  const loadBets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setError("You are not logged in. Please log in to view your bets.");
        return;
      }

      const response = await fetch(`${API_URL}/bets/my-bets`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load your bets.");
      }
      if (!data?.success) {
        throw new Error(data?.message || "Unable to load your bets.");
      }
      setBets(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load customer bets:", err);
      setError(err instanceof Error ? err.message : "Unable to load your bets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBets();
  }, [loadBets]);

  const ongoingBets = useMemo(
    () => bets.filter((bet) => !isSettledBet(bet.status)),
    [bets],
  );
  const settledBets = useMemo(
    () => bets.filter((bet) => isSettledBet(bet.status)),
    [bets],
  );
  const baseBets = activeTab === "ongoing" ? ongoingBets : settledBets;
  const displayedBets = useMemo(() => {
    if (filter === "singles") {
      return baseBets.filter((bet) => (bet.bet_type || "").toLowerCase() === "single");
    }
    if (filter === "multiples") {
      return baseBets.filter((bet) =>
        ["multiple", "accumulator"].includes((bet.bet_type || "").toLowerCase()),
      );
    }
    return baseBets;
  }, [baseBets, filter]);

  const totalStake = useMemo(
    () => displayedBets.reduce((total, bet) => total + Number(bet.stake || 0), 0),
    [displayedBets],
  );

  return (
    <main className="min-h-screen bg-[#06172b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06172b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="group inline-flex items-center gap-3" aria-label="BETZONE home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4b400] text-lg font-black text-[#07182d] shadow-lg shadow-amber-500/10">B</span>
            <span>
              <span className="block text-xl font-black tracking-wide text-[#f4b400]">BETZONE</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">My betting account</span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => void loadBets()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:bg-white/[0.08] disabled:opacity-50"
          >
            <span aria-hidden="true" className={loading ? "animate-spin" : ""}>↻</span>
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-[#f4b400]">Your account</p>
            <h1 className="text-2xl font-black sm:text-3xl">My Bets</h1>
            <p className="mt-1 text-sm text-slate-400">Track your tickets, selections and results in one place.</p>
          </div>
          <div className="text-sm text-slate-400">
            <span className="font-bold text-white">{bets.length}</span> total tickets
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#102b49] to-[#0a2038] p-4">
            <p className="text-xs font-medium text-slate-400">All tickets</p>
            <p className="mt-2 text-2xl font-black">{bets.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Your bet history</p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-gradient-to-br from-[#302911] to-[#10243b] p-4">
            <p className="text-xs font-medium text-slate-400">Open bets</p>
            <p className="mt-2 text-2xl font-black text-amber-200">{ongoingBets.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Awaiting outcomes</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-[#10382f] to-[#0a2038] p-4">
            <p className="text-xs font-medium text-slate-400">Bet history</p>
            <p className="mt-2 text-2xl font-black text-emerald-200">{settledBets.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Settled tickets</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#102b49] to-[#0a2038] p-4">
            <p className="text-xs font-medium text-slate-400">Displayed stake</p>
            <p className="mt-2 text-xl font-black text-[#f4b400]">GHS {formatMoney(totalStake)}</p>
            <p className="mt-1 text-[11px] text-slate-500">For current selection</p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-white/[0.08] bg-[#0b223c] p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveTab("ongoing"); setExpandedBet(null); }}
              className={`rounded-xl px-3 py-3 text-sm font-extrabold transition ${
                activeTab === "ongoing"
                  ? "bg-[#f4b400] text-[#07182d] shadow-lg shadow-amber-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Open Bets <span className="ml-1 opacity-75">({ongoingBets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("settled"); setExpandedBet(null); }}
              className={`rounded-xl px-3 py-3 text-sm font-extrabold transition ${
                activeTab === "settled"
                  ? "bg-[#f4b400] text-[#07182d] shadow-lg shadow-amber-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Bet History <span className="ml-1 opacity-75">({settledBets.length})</span>
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All bets"],
              ["singles", "Singles"],
              ["multiples", "Accumulators"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                  filter === value
                    ? "border-[#f4b400] bg-[#f4b400]/10 text-[#ffd45c]"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">{displayedBets.length} ticket{displayedBets.length === 1 ? "" : "s"} shown</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
            <p className="font-bold">We couldn&apos;t load your bets</p>
            <p className="mt-1 text-red-200/80">{error}</p>
            <button type="button" onClick={() => void loadBets()} className="mt-3 rounded-lg border border-red-300/30 px-3 py-1.5 font-bold hover:bg-red-300/10">Try again</button>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b223c] px-5 py-14 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#f4b400]" />
            <p className="font-bold">Loading your tickets</p>
            <p className="mt-1 text-sm text-slate-500">Fetching your latest bet information…</p>
          </div>
        )}

        {!loading && !error && displayedBets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#0b223c]/70 px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-2xl">🎟️</div>
            <h2 className="mt-4 text-lg font-extrabold">{filter !== "all" ? "No matching tickets" : activeTab === "ongoing" ? "No open bets yet" : "No bet history yet"}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {filter !== "all"
                ? "Try another filter to see your tickets."
                : activeTab === "ongoing"
                  ? "When you place a bet, your open ticket will appear here."
                  : "Once a bet is settled, it will appear here."}
            </p>
            {filter !== "all" && (
              <button type="button" onClick={() => setFilter("all")} className="mt-4 rounded-lg bg-[#f4b400] px-4 py-2 text-sm font-extrabold text-[#07182d]">Show all bets</button>
            )}
          </div>
        )}

        {!loading && !error && displayedBets.length > 0 && (
          <div className="space-y-4">
            {displayedBets.map((bet) => {
              const status = getBetStatus(bet.status);
              const isExpanded = expandedBet === bet.id;
              const selections = Array.isArray(bet.selections) ? bet.selections : [];
              return (
                <article key={bet.id} className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b223c] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedBet(isExpanded ? null : bet.id)}
                    className="block w-full text-left transition hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-200">{formatBetType(bet.bet_type)}</span>
                        <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black tracking-wider ${status.className}`}>{status.label}</span>
                        <span className="text-xs text-slate-500">{formatDate(bet.created_at)}</span>
                      </div>
                      <span className="shrink-0 text-slate-400" aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Stake</p>
                        <p className="mt-1.5 text-sm font-extrabold text-white sm:text-base">GHS {formatMoney(bet.stake)}</p>
                      </div>
                      <div className="border-x border-white/[0.07] px-3 sm:px-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Total odds</p>
                        <p className="mt-1.5 text-sm font-black text-[#f4b400] sm:text-base">{Number(bet.total_odds || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Potential return</p>
                        <p className="mt-1.5 text-sm font-extrabold text-emerald-300 sm:text-base">GHS {formatMoney(bet.potential_return)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-black/10 px-4 py-2.5 sm:px-5">
                      <span className="text-xs text-slate-400">{selections.length} selection{selections.length === 1 ? "" : "s"}</span>
                      <span className="text-xs font-bold text-[#f4b400]">{isExpanded ? "Hide selections" : "View ticket details"} <span className="ml-1">{isExpanded ? "↑" : "↓"}</span></span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 bg-[#071a2e] p-3 sm:p-5">
                      <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-extrabold">Your selections</h2>
                        <span className="text-xs text-slate-500">{selections.length} pick{selections.length === 1 ? "" : "s"}</span>
                      </div>

                      {selections.length === 0 && (
                        <p className="rounded-xl border border-white/10 bg-[#0b223c] p-4 text-sm text-slate-400">Selection details are not available for this ticket.</p>
                      )}

                      {selections.map((selection, index) => {
                        const result = getSelectionResult(selection.result);
                        const score = getMatchScore(selection);
                        const matchResultLabel = getMatchResultLabel(selection);
                        return (
                          <section key={selection.id || `${bet.id}-${index}`} className="overflow-hidden rounded-xl border border-white/[0.09] bg-[#0b223c]">
                            <div className="flex items-start gap-3 p-3.5 sm:p-4">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-black text-slate-300">{index + 1}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <h3 className="break-words text-sm font-extrabold leading-5 sm:text-base">{selection.home_team} <span className="font-medium text-slate-500">vs</span> {selection.away_team}</h3>
                                    <p className="mt-1 text-xs text-slate-500">{selection.league || "Unknown league"}{selection.country ? ` · ${selection.country}` : ""}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">{formatDate(selection.kickoff_at)}</p>
                                  </div>
                                  <span className={`w-fit rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-black uppercase tracking-wider ${result.className}`}>{result.label}</span>
                                </div>

                                <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-white/[0.07] bg-[#06172b] p-3">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your pick</p>
                                    <p className="mt-1 break-words text-sm font-bold text-white">{selection.selection}</p>
                                    <p className="mt-1 text-xs text-slate-400">{selection.market}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Odds</p>
                                    <p className="mt-1 text-lg font-black text-[#f4b400]">{Number(selection.odds || 0).toFixed(2)}</p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/[0.025] px-3 py-2.5">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{matchResultLabel}</p>
                                    <p className="mt-1 text-sm font-extrabold">{score || "Score not available"}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selection outcome</p>
                                    <p className={`mt-1 text-sm font-extrabold ${result.className}`}>{result.label}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        );
                      })}

                      <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.08] bg-[#0b223c] p-4">
                        <div>
                          <p className="text-xs text-slate-500">Total stake</p>
                          <p className="mt-1 text-sm font-extrabold">GHS {formatMoney(bet.stake)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Potential return</p>
                          <p className="mt-1 text-sm font-extrabold text-emerald-300">GHS {formatMoney(bet.potential_return)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] leading-5 text-slate-600">
          Bet outcomes and returns are shown using the latest information available from BETZONE.
        </p>
      </div>
    </main>
  );
}
