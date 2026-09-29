"use client";

import { useEffect, useMemo, useState } from "react";

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

const API_URL = "http://localhost:4000";
const TOKEN_KEY = "betzone_access_token";

function formatMoney(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatBetType(value: string) {
  if (value === "multiple") {
    return "Accumulator";
  }

  if (value === "single") {
    return "Single";
  }

  if (value === "system") {
    return "System";
  }

  return value;
}

function getBetStatus(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "won" ||
    normalized === "win" ||
    normalized === "settled_won"
  ) {
    return {
      label: "Won",
      className:
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }

  if (
    normalized === "lost" ||
    normalized === "lose" ||
    normalized === "settled_lost"
  ) {
    return {
      label: "Lost",
      className:
        "bg-red-500/15 text-red-400 border-red-500/30",
    };
  }

  if (
    normalized === "void" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return {
      label: "Void",
      className:
        "bg-slate-500/15 text-slate-300 border-slate-500/30",
    };
  }

  return {
    label: "Ongoing",
    className:
      "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  };
}

function getSelectionResult(result: string | null) {
  const normalized = (result || "pending").toLowerCase();

  if (
    normalized === "won" ||
    normalized === "win"
  ) {
    return {
      label: "Won",
      className: "text-emerald-400",
    };
  }

  if (
    normalized === "lost" ||
    normalized === "lose"
  ) {
    return {
      label: "Lost",
      className: "text-red-400",
    };
  }

  if (
    normalized === "void" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return {
      label: "Void",
      className: "text-slate-300",
    };
  }

  return {
    label: "Pending",
    className: "text-yellow-300",
  };
}

function isSettledBet(status: string) {
  const normalized = status.toLowerCase();

  return [
    "won",
    "win",
    "lost",
    "lose",
    "settled",
    "settled_won",
    "settled_lost",
    "void",
    "cancelled",
    "canceled",
  ].includes(normalized);
}

function getMatchScore(selection: BetSelection) {
  const homeScore = selection.home_score;
  const awayScore = selection.away_score;

  if (
    homeScore === null ||
    homeScore === undefined ||
    awayScore === null ||
    awayScore === undefined
  ) {
    return null;
  }

  return `${homeScore} - ${awayScore}`;
}

function getMatchResultLabel(
  selection: BetSelection,
) {
  const status =
    selection.match_result_status?.toLowerCase();

  if (
    status === "finished" ||
    (selection.home_score !== null &&
      selection.home_score !== undefined &&
      selection.away_score !== null &&
      selection.away_score !== undefined)
  ) {
    return "FT";
  }

  if (status === "postponed") {
    return "Postponed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "abandoned") {
    return "Abandoned";
  }

  return "Result";
}

export default function MyBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [activeTab, setActiveTab] = useState<
    "ongoing" | "settled"
  >("ongoing");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedBet, setExpandedBet] = useState<string | null>(
    null,
  );

  const loadBets = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        setError(
          "You are not logged in. Please log in to view your bets.",
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/bets/my-bets`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load your bets.",
        );
      }

      if (!data?.success) {
        throw new Error(
          "Unable to load your bets.",
        );
      }

      setBets(
        Array.isArray(data.data)
          ? data.data
          : [],
      );
    } catch (err) {
      console.error(
        "Failed to load customer bets:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your bets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBets();
  }, []);

  const ongoingBets = useMemo(
    () =>
      bets.filter(
        (bet) => !isSettledBet(bet.status),
      ),
    [bets],
  );

  const settledBets = useMemo(
    () =>
      bets.filter((bet) =>
        isSettledBet(bet.status),
      ),
    [bets],
  );

  const displayedBets =
    activeTab === "ongoing"
      ? ongoingBets
      : settledBets;

  const totalStake = useMemo(
    () =>
      displayedBets.reduce(
        (total, bet) =>
          total + Number(bet.stake || 0),
        0,
      ),
    [displayedBets],
  );

  return (
    <main className="min-h-screen bg-[#071b34] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071b34]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-black tracking-wide text-[#f5b400]">
              BETZONE
            </h1>

            <p className="mt-0.5 text-xs text-slate-400">
              My Bets
            </p>
          </div>

          <button
            type="button"
            onClick={loadBets}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            My Bets
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            View your ongoing and settled bets.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#0b2545] p-4">
            <p className="text-xs text-slate-400">
              Total Bets
            </p>

            <p className="mt-2 text-2xl font-bold">
              {bets.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b2545] p-4">
            <p className="text-xs text-slate-400">
              Ongoing
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-300">
              {ongoingBets.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b2545] p-4">
            <p className="text-xs text-slate-400">
              Settled
            </p>

            <p className="mt-2 text-2xl font-bold">
              {settledBets.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b2545] p-4">
            <p className="text-xs text-slate-400">
              Displayed Stake
            </p>

            <p className="mt-2 text-2xl font-bold text-[#f5b400]">
              GHS {formatMoney(totalStake)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex overflow-hidden rounded-xl border border-white/10 bg-[#0b2545]">
          <button
            type="button"
            onClick={() =>
              setActiveTab("ongoing")
            }
            className={`flex-1 px-5 py-3 text-sm font-bold transition ${
              activeTab === "ongoing"
                ? "bg-[#f5b400] text-[#071b34]"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            Ongoing Bets ({ongoingBets.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("settled")
            }
            className={`flex-1 px-5 py-3 text-sm font-bold transition ${
              activeTab === "settled"
                ? "bg-[#f5b400] text-[#071b34]"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            Settled Bets ({settledBets.length})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-white/10 bg-[#0b2545] p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#f5b400]" />

            <p className="text-sm text-slate-400">
              Loading your bets...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          displayedBets.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0b2545] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">
                🎟️
              </div>

              <h3 className="text-lg font-bold">
                {activeTab === "ongoing"
                  ? "No ongoing bets"
                  : "No settled bets"}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {activeTab === "ongoing"
                  ? "Your active bets will appear here."
                  : "Your completed bets will appear here."}
              </p>
            </div>
          )}

        {/* Bets */}
        {!loading &&
          !error &&
          displayedBets.length > 0 && (
            <div className="space-y-4">
              {displayedBets.map((bet) => {
                const status =
                  getBetStatus(bet.status);

                const isExpanded =
                  expandedBet === bet.id;

                return (
                  <section
                    key={bet.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#0b2545]"
                  >
                    {/* Bet header */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBet(
                          isExpanded
                            ? null
                            : bet.id,
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="border-b border-white/10 p-4 sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-black tracking-wide text-[#f5b400]">
                                {bet.bet_reference}
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                              <span>
                                {formatBetType(
                                  bet.bet_type,
                                )}
                              </span>

                              <span>
                                {formatDate(
                                  bet.created_at,
                                )}
                              </span>

                              <span>
                                {bet.selections?.length ||
                                  0}{" "}
                                selection
                                {(bet.selections
                                  ?.length || 0) !== 1
                                  ? "s"
                                  : ""}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-right">
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                Stake
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                GHS{" "}
                                {formatMoney(
                                  bet.stake,
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                Odds
                              </p>

                              <p className="mt-1 text-sm font-bold text-[#f5b400]">
                                {Number(
                                  bet.total_odds,
                                ).toFixed(2)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                Potential
                              </p>

                              <p className="mt-1 text-sm font-bold text-emerald-400">
                                GHS{" "}
                                {formatMoney(
                                  bet.potential_return,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                          <span className="text-xs text-slate-500">
                            {isExpanded
                              ? "Hide selections"
                              : "View selections"}
                          </span>

                          <span className="text-slate-400">
                            {isExpanded
                              ? "▲"
                              : "▼"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Selections */}
                    {isExpanded && (
                      <div className="bg-[#081f3b] p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-bold">
                            Selections
                          </h3>

                          <span className="text-xs text-slate-500">
                            {bet.selections?.length ||
                              0}{" "}
                            selection
                            {(bet.selections
                              ?.length || 0) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {bet.selections?.map(
                            (selection, index) => {
                              const result =
                                getSelectionResult(
                                  selection.result,
                                );

                              const score =
                                getMatchScore(
                                  selection,
                                );

                              const matchResultLabel =
                                getMatchResultLabel(
                                  selection,
                                );

                              return (
                                <div
                                  key={
                                    selection.id ||
                                    `${bet.id}-${index}`
                                  }
                                  className="rounded-lg border border-white/10 bg-[#0b2545] p-4"
                                >
                                  {/* Match */}
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold">
                                        {
                                          selection.home_team
                                        }

                                        <span className="mx-2 text-slate-500">
                                          vs
                                        </span>

                                        {
                                          selection.away_team
                                        }
                                      </div>

                                      <div className="mt-1 text-xs text-slate-500">
                                        {selection.league ||
                                          "Unknown league"}

                                        {selection.country
                                          ? ` • ${selection.country}`
                                          : ""}
                                      </div>
                                    </div>

                                    <span
                                      className={`text-xs font-bold ${result.className}`}
                                    >
                                      {result.label}
                                    </span>
                                  </div>

                                  {/* Actual match result */}
                                  <div className="mt-4 rounded-lg border border-white/10 bg-[#071b34] px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                          Match Result
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-white">
                                          {matchResultLabel}
                                        </p>
                                      </div>

                                      {score ? (
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Final Score
                                          </p>

                                          <p className="mt-1 text-xl font-black text-[#f5b400]">
                                            {score}
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Final Score
                                          </p>

                                          <p className="mt-1 text-sm font-semibold text-slate-500">
                                            Not available
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Selection details */}
                                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                        Market
                                      </p>

                                      <p className="mt-1 text-xs font-semibold text-slate-200">
                                        {
                                          selection.market
                                        }
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                        Pick
                                      </p>

                                      <p className="mt-1 text-xs font-semibold text-slate-200">
                                        {
                                          selection.selection
                                        }
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                        Odds
                                      </p>

                                      <p className="mt-1 text-xs font-bold text-[#f5b400]">
                                        {Number(
                                          selection.odds,
                                        ).toFixed(2)}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                        Kickoff
                                      </p>

                                      <p className="mt-1 text-xs font-semibold text-slate-200">
                                        {formatDate(
                                          selection.kickoff_at,
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Outcome */}
                                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Outcome
                                    </span>

                                    <span
                                      className={`text-sm font-black ${result.className}`}
                                    >
                                      {result.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}