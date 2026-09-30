"use client";

import { useEffect, useMemo, useState } from "react";

type Sport = {
  id: string;
  sport_key: string;
  sport_name: string;
  is_active: boolean;
  sort_order: number;
};

type League = {
  id: string;
  name: string;
  country: string;
  sport: string;
  is_active: boolean;
};

type Match = {
  id: string;
  league_id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
  is_active: boolean;
  provider: string | null;
  provider_match_id: string | null;
};

type Odd = {
  id: string;
  match_id: string;
  market: string;
  selection: string;
  odds: string | number;
  line: string | number | null;
  market_group: string;
  sort_order: number;
  market_id: string | null;
  provider: string | null;
  provider_odd_id: string | null;
  is_active: boolean;
  sports_markets?: {
    id: string;
    market_key: string;
    market_name: string;
    market_group: string;
    sort_order: number;
    is_active: boolean;
  } | null;
};

type BetSelection = {
  oddId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  odds: number;
  market: string;
};

type BetRecord = {
  id?: string | number;
  bet_reference?: string;
  bet_type?: string;
  status?: string;
  created_at?: string;
  placed_at?: string;
  updated_at?: string;
  stake?: string | number;
  total_odds?: string | number;
  odds?: string | number;
  potential_payout?: string | number;
  potential_win?: string | number;
  payout?: string | number;
  winnings?: string | number;
  match_id?: string | number;
  matchId?: string | number;
  odd_id?: string | number;
  oddId?: string | number;
  home_team?: string;
  homeTeam?: string;
  away_team?: string;
  awayTeam?: string;
  selection?: string;
  outcome?: string;
  result?: string;
  price?: string | number;
  market?: string;
  selections?: BetRecord[];
  bet_selections?: BetRecord[];
  [key: string]: unknown;
};

type CurrentUser = {
  id: string;
  email: string;
  role: string;
};

type Wallet = {
  id: string | null;
  balance: string | number;
};

type BetSubmission = {
  bet_reference: string;
  stake: string | number;
  total_odds: string | number;
  potential_return: string | number;
};

const API_URL = "http://localhost:4000";
const TOKEN_KEY = "betzone_access_token";
const USER_KEY = "betzone_user";

export default function Home() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState("football");
  const [sportsMenuOpen, setSportsMenuOpen] = useState(false);

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");

  const [matches, setMatches] = useState<Match[]>([]);
  const [odds, setOdds] = useState<Odd[]>([]);
  const [footballQuickMatches, setFootballQuickMatches] = useState<Match[]>([]);
  const [footballQuickOdds, setFootballQuickOdds] = useState<Odd[]>([]);
  const [footballQuickLoading, setFootballQuickLoading] = useState(false);

  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  const [betSlipTab, setBetSlipTab] = useState<"betslip" | "cashout">("betslip");
  const [myBetFilter, setMyBetFilter] = useState<"open" | "settled">("open");
  const [myBets, setMyBets] = useState<BetRecord[]>([]);
  const [myBetsLoading, setMyBetsLoading] = useState(false);
  const [myBetsError, setMyBetsError] = useState("");
  const [selectedMyBet, setSelectedMyBet] = useState<BetRecord | null>(null);
  const [betSlipMode, setBetSlipMode] = useState<"real" | "sim">("real");
  const [betType, setBetType] = useState<
    "single" | "accumulator"
  >("single");
  const [stake, setStake] = useState("");

  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");

  const [selectedMatch, setSelectedMatch] =
    useState<Match | null>(null);

  // LOAD BET
  const [loadBetOpen, setLoadBetOpen] =
    useState(false);
  const [loadBetReference, setLoadBetReference] =
    useState("");
  const [loadBetLoading, setLoadBetLoading] =
    useState(false);
  const [loadedBet, setLoadedBet] =
    useState<BetRecord | null>(null);
  const [loadBetError, setLoadBetError] =
    useState("");
  const [loadBetSuccess, setLoadBetSuccess] =
    useState("");

  // AUTH
  const [user, setUser] =
    useState<CurrentUser | null>(null);
  const [wallet, setWallet] =
    useState<Wallet | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedReference = params.get("loadBet")?.trim().toUpperCase();

    if (!sharedReference) return;

    setLoadBetReference(sharedReference);
    setLoadBetError("");
    setLoadBetSuccess("");
    setLoadedBet(null);
    setLoadBetOpen(true);

    params.delete("loadBet");
    const cleanQuery = params.toString();
    const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }, []);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [authMode, setAuthMode] =
    useState<"login" | "register" | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [authError, setAuthError] =
    useState("");
  const [authSubmitting, setAuthSubmitting] =
    useState(false);

  const [accountOpen, setAccountOpen] =
    useState(false);

  // TRANSACTIONS
  const [transactionMode, setTransactionMode] =
    useState<"deposit" | "withdrawal" | null>(
      null,
    );

  const [transactionAmount, setTransactionAmount] =
    useState("");

  const [
    transactionPaymentMethod,
    setTransactionPaymentMethod,
  ] = useState("MTN Mobile Money");

  const [
    transactionPhoneNumber,
    setTransactionPhoneNumber,
  ] = useState("");

  const [
    transactionAccountName,
    setTransactionAccountName,
  ] = useState("");

  const [
    transactionReference,
    setTransactionReference,
  ] = useState("");

  const [transactionNote, setTransactionNote] =
    useState("");

  const [
    transactionSubmitting,
    setTransactionSubmitting,
  ] = useState(false);

  const [transactionError, setTransactionError] =
    useState("");

  const [
    transactionSuccess,
    setTransactionSuccess,
  ] = useState("");

  // BETTING
  const [betSubmitting, setBetSubmitting] =
    useState(false);

  const [betError, setBetError] =
    useState("");

  const [betSuccess, setBetSuccess] =
    useState("");

  const [betSubmission, setBetSubmission] =
    useState<BetSubmission | null>(null);

  const [betSubmissionCopied, setBetSubmissionCopied] =
    useState(false);

  const [betSubmissionShared, setBetSubmissionShared] =
    useState(false);

  async function copyBetBookingCode() {
    if (!betSubmission?.bet_reference) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        betSubmission.bet_reference,
      );
      setBetSubmissionCopied(true);
      window.setTimeout(() => {
        setBetSubmissionCopied(false);
      }, 1800);
    } catch (err) {
      console.error("Failed to copy booking code", err);
    }
  }

  function getBetzonePublicUrl() {
    const configuredUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

    if (configuredUrl) {
      return configuredUrl;
    }

    return window.location.origin;
  }

  function getLoadBetUrl(reference: string) {
    return `${getBetzonePublicUrl()}/?loadBet=${encodeURIComponent(reference)}`;
  }

  async function shareBetBookingCode() {
    if (!betSubmission?.bet_reference) return;

    const reference = betSubmission.bet_reference;
    const loadBetUrl = getLoadBetUrl(reference);
    const shareText = `BETZONE Booking Code: ${reference}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BETZONE Bet",
          text: shareText,
          url: loadBetUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `${shareText}\nLoad this bet in BETZONE: ${loadBetUrl}`,
        );
      }
      setBetSubmissionShared(true);
      window.setTimeout(() => {
        setBetSubmissionShared(false);
      }, 1800);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Failed to share booking code", err);
    }
  }
  async function loadCurrentUser(token: string) {
    try {
      const response = await fetch(
        `${API_URL}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setWallet(null);
        return;
      }

      const data = await response.json();

      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
      });

      setWallet({
        id: data.wallet?.id ?? null,
        balance: data.wallet?.balance ?? 0,
      });

      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          id: data.id,
          email: data.email,
          role: data.role,
        }),
      );
    } catch (err) {
      console.error(
        "Failed to load current user",
        err,
      );
    }
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const token =
          localStorage.getItem(TOKEN_KEY);

        if (token) {
          await loadCurrentUser(token);
        }
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function handleAuthSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setAuthError("");
    setAuthSubmitting(true);

    try {
      const endpoint =
        authMode === "register"
          ? "/auth/register"
          : "/auth/login";

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Authentication failed.",
        );
      }

      const token =
        data?.session?.access_token;

      if (!token) {
        throw new Error(
          authMode === "register"
            ? "Registration succeeded, but no login session was returned. Please log in."
            : "Login succeeded, but no access token was returned.",
        );
      }

      localStorage.setItem(
        TOKEN_KEY,
        token,
      );

      await loadCurrentUser(token);

      setEmail("");
      setPassword("");
      setAuthMode(null);
    } catch (err) {
      console.error(err);

      setAuthError(
        err instanceof Error
          ? err.message
          : "Authentication failed.",
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);
    setWallet(null);
    setAccountOpen(false);
    setAuthMode(null);

    setBetSlip([]);
    setStake("");
    setBetError("");
    setBetSuccess("");

    setTransactionMode(null);
    setTransactionAmount("");
    setTransactionPhoneNumber("");
    setTransactionAccountName("");
    setTransactionReference("");
    setTransactionNote("");
    setTransactionError("");
    setTransactionSuccess("");
  }

  function formatMoney(value: number | string | null | undefined) {
    const amount = Number(value ?? 0);

    return amount.toFixed(2);
  }

  function formatBalance(
    balance: string | number,
  ) {
    const value = Number(balance);

    if (!Number.isFinite(value)) {
      return "0.00";
    }

    return value.toFixed(2);
  }

  function openTransaction(
    mode: "deposit" | "withdrawal",
  ) {
    setAccountOpen(false);
    setTransactionMode(mode);

    setTransactionAmount("");
    setTransactionPhoneNumber("");
    setTransactionAccountName("");
    setTransactionReference("");
    setTransactionNote("");

    setTransactionError("");
    setTransactionSuccess("");
  }

  function closeTransaction() {
    if (transactionSubmitting) {
      return;
    }

    setTransactionMode(null);
    setTransactionError("");
    setTransactionSuccess("");
  }

  async function handleTransactionSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setTransactionError("");
    setTransactionSuccess("");

    const token =
      localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setTransactionMode(null);
      setAuthError("");
      setAuthMode("login");
      return;
    }

    const amount =
      Number(transactionAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setTransactionError(
        "Please enter a valid amount.",
      );
      return;
    }

    if (
      transactionMode === "withdrawal" &&
      !transactionPhoneNumber.trim()
    ) {
      setTransactionError(
        "Phone number is required.",
      );
      return;
    }

    setTransactionSubmitting(true);

    try {
      let response: Response;

      if (
        transactionMode === "deposit"
      ) {
        response = await fetch(
          `${API_URL}/transactions/deposit`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              paymentMethod:
                transactionPaymentMethod,
              amount,
              reference:
                transactionReference.trim() ||
                undefined,
            }),
          },
        );
      } else {
        response = await fetch(
          `${API_URL}/transactions/withdrawal`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              paymentMethod:
                transactionPaymentMethod,
              phoneNumber:
                transactionPhoneNumber.trim(),
              amount,
              accountName:
                transactionAccountName.trim() ||
                undefined,
              note:
                transactionNote.trim() ||
                undefined,
            }),
          },
        );
      }

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Transaction request failed.";

        throw new Error(
          Array.isArray(message)
            ? message.join(", ")
            : message,
        );
      }

      if (
        transactionMode === "deposit"
      ) {
        setTransactionSuccess(
          data?.reference
            ? `Deposit request ${data.reference} submitted successfully.`
            : "Deposit request submitted successfully.",
        );
      } else {
        setTransactionSuccess(
          "Withdrawal request submitted successfully.",
        );
      }

      setTransactionAmount("");
      setTransactionPhoneNumber("");
      setTransactionAccountName("");
      setTransactionReference("");
      setTransactionNote("");

      await loadCurrentUser(token);
    } catch (err) {
      console.error(
        "Transaction request failed",
        err,
      );

      setTransactionError(
        err instanceof Error
          ? err.message
          : "Transaction request failed.",
      );
    } finally {
      setTransactionSubmitting(false);
    }
  }

  useEffect(() => {
    async function loadSports() {
      try {
        setError("");

        const response = await fetch(
          `${API_URL}/sports`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load sports",
          );
        }

        const data: Sport[] =
          await response.json();

        setSports(data);

        if (data.length > 0) {
          const football =
            data.find(
              (sport) =>
                sport.sport_key ===
                "football",
            );

          setSelectedSport(
            football?.sport_key ??
              data[0].sport_key,
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          "Unable to connect to BETZONE API.",
        );
      } finally {
      }
    }

    loadSports();
    loadFootballQuickMatches();

    const footballQuickTimer = window.setInterval(
      loadFootballQuickMatches,
      60_000,
    );

    return () => window.clearInterval(footballQuickTimer);
  }, []);

  useEffect(() => {
    if (betSlipTab === "cashout") {
      loadMyBets();
    }
  }, [betSlipTab]);

  useEffect(() => {
    async function loadLeagues() {
      if (!selectedSport) {
        return;
      }

      try {
        setLoadingMatches(true);
        setError("");

        const response = await fetch(
          `${API_URL}/sports/${selectedSport}/leagues`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load leagues",
          );
        }

        const data: League[] =
          await response.json();

        setLeagues(data);

        if (data.length > 0) {
          const premierLeague =
            data.find(
              (league) =>
                league.name ===
                "Premier League",
            );

          setSelectedLeague(
            premierLeague?.id ??
              data[0].id,
          );
        } else {
          setSelectedLeague("");
          setMatches([]);
          setOdds([]);
        }
      } catch (err) {
        console.error(err);

        setLeagues([]);
        setSelectedLeague("");
        setMatches([]);
        setOdds([]);

        setError(
          `No leagues are currently available for ${selectedSport}.`,
        );
      } finally {
        setLoadingMatches(false);
      }
    }

    loadLeagues();
  }, [selectedSport]);

  useEffect(() => {
    async function loadMatches() {
      if (
        !selectedSport ||
        !selectedLeague
      ) {
        setMatches([]);
        setOdds([]);
        return;
      }

      try {
        setLoadingMatches(true);
        setError("");

        const response = await fetch(
          `${API_URL}/sports/${selectedSport}/leagues/${selectedLeague}/matches`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load matches",
          );
        }

        const data: Match[] =
          await response.json();

        setMatches(data);

        const allOdds: Odd[] = [];

        for (const match of data) {
          try {
            const oddsResponse =
              await fetch(
                `${API_URL}/sports/${selectedSport}/leagues/${selectedLeague}/matches/${match.id}/markets`,
              );

            if (!oddsResponse.ok) {
              continue;
            }

            const matchOdds: Odd[] =
              await oddsResponse.json();

            allOdds.push(...matchOdds);
          } catch (err) {
            console.error(
              `Failed to load odds for match ${match.id}`,
              err,
            );
          }
        }

        setOdds(allOdds);
      } catch (err) {
        console.error(err);

        setMatches([]);
        setOdds([]);

        setError(
          "Unable to load matches.",
        );
      } finally {
        setLoadingMatches(false);
      }
    }

    loadMatches();
  }, [
    selectedSport,
    selectedLeague,
  ]);

  const oddsByMatch = useMemo(() => {
    const grouped: Record<
      string,
      Odd[]
    > = {};

    for (const odd of odds) {
      if (!grouped[odd.match_id]) {
        grouped[odd.match_id] = [];
      }

      grouped[odd.match_id].push(
        odd,
      );
    }

    return grouped;
  }, [odds]);

  async function loadFootballQuickMatches() {
    try {
      setFootballQuickLoading(true);

      const leaguesResponse = await fetch(
        `${API_URL}/sports/football/leagues`,
      );

      if (!leaguesResponse.ok) {
        throw new Error("Unable to load football leagues.");
      }

      const footballLeagues: League[] = await leaguesResponse.json();
      const leagueResults = await Promise.all(
        footballLeagues.map(async (league) => {
          try {
            const response = await fetch(
              `${API_URL}/sports/football/leagues/${league.id}/matches`,
            );
            if (!response.ok) return [];
            return (await response.json()) as Match[];
          } catch {
            return [];
          }
        }),
      );

      const now = Date.now();
      const threeHours = 3 * 60 * 60 * 1000;
      const relevantMatches = leagueResults
        .flat()
        .filter((match) => {
          const kickoff = new Date(match.kickoff_at).getTime();
          if (!Number.isFinite(kickoff)) return false;
          const status = String(match.status || "").toLowerCase();
          const liveStatus = [
            "live",
            "in_play",
            "in-play",
            "inplay",
            "started",
          ].includes(status);
          return liveStatus || (kickoff >= now && kickoff <= now + threeHours);
        })
        .sort((a, b) => {
          const aLive = ["live", "in_play", "in-play", "inplay", "started"].includes(String(a.status || "").toLowerCase());
          const bLive = ["live", "in_play", "in-play", "inplay", "started"].includes(String(b.status || "").toLowerCase());
          if (aLive !== bLive) return aLive ? -1 : 1;
          return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime();
        });

      const uniqueMatches = Array.from(
        new Map(relevantMatches.map((match) => [match.id, match])).values(),
      );

      const oddsResults = await Promise.all(
        uniqueMatches.map(async (match) => {
          const league = footballLeagues.find((item) => item.id === match.league_id);
          if (!league) return [];
          try {
            const response = await fetch(
              `${API_URL}/sports/football/leagues/${league.id}/matches/${match.id}/markets`,
            );
            if (!response.ok) return [];
            return (await response.json()) as Odd[];
          } catch {
            return [];
          }
        }),
      );

      setFootballQuickMatches(uniqueMatches);
      setFootballQuickOdds(oddsResults.flat());
    } catch (err) {
      console.error("Failed to load football quick matches", err);
      setFootballQuickMatches([]);
      setFootballQuickOdds([]);
    } finally {
      setFootballQuickLoading(false);
    }
  }

  async function loadMyBets() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setMyBets([]);
      setMyBetsError("Log in to view your bets.");
      return;
    }

    setMyBetsLoading(true);
    setMyBetsError("");

    try {
      const response = await fetch(`${API_URL}/bets/my-bets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Unable to load your bets.";
        throw new Error(Array.isArray(message) ? message.join(", ") : message);
      }

      const loaded = Array.isArray(data)
        ? data
        : Array.isArray(data?.bets)
          ? data.bets
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setMyBets(loaded);
    } catch (err) {
      console.error("Failed to load my bets", err);
      setMyBets([]);
      setMyBetsError(
        err instanceof Error ? err.message : "Unable to load your bets.",
      );
    } finally {
      setMyBetsLoading(false);
    }
  }

  const myOpenBets = useMemo(
    () =>
      myBets.filter((bet) => {
        const status = String(bet.status || "").toLowerCase();
        return ["open", "pending", "active", "unsettled"].includes(status);
      }),
    [myBets],
  );

  const mySettledBets = useMemo(
    () =>
      myBets.filter((bet) => {
        const status = String(bet.status || "").toLowerCase();
        return !["open", "pending", "active", "unsettled"].includes(status);
      }),
    [myBets],
  );

  function formatMyBetDate(value: unknown) {
    if (!value) return "-";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
  }

  async function copyMyBetBookingCode(reference: string) {
    if (!reference) return;

    try {
      await navigator.clipboard.writeText(reference);
    } catch (err) {
      console.error("Failed to copy My Bet booking code", err);
    }
  }

  async function shareMyBetBookingCode(reference: string) {
    if (!reference) return;

    const loadBetUrl = getLoadBetUrl(reference);
    const shareText = `BETZONE Booking Code: ${reference}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BETZONE Bet",
          text: shareText,
          url: loadBetUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `${shareText}\nLoad this bet in BETZONE: ${loadBetUrl}`,
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Failed to share My Bet booking code", err);
    }
  }

  function get1X2Odds(match: Match) {
    const matchOdds =
      oddsByMatch[match.id] ?? [];

    const oneXTwo =
      matchOdds.filter(
        (odd) =>
          odd.is_active &&
          (odd.sports_markets
            ?.market_key ===
            "1x2" ||
            odd.market === "1x2" ||
            odd.market === "h2h"),
      );

    const result: {
      home: Odd | null;
      draw: Odd | null;
      away: Odd | null;
    } = {
      home: null,
      draw: null,
      away: null,
    };

    for (const odd of oneXTwo) {
      const selection =
        odd.selection
          .trim()
          .toLowerCase();

      const currentOdds =
        Number(odd.odds);

      if (!Number.isFinite(currentOdds)) {
        continue;
      }

      const isHome =
        selection === "1" ||
        selection === "home" ||
        selection ===
          match.home_team
            .trim()
            .toLowerCase();

      const isDraw =
        selection === "x" ||
        selection === "draw";

      const isAway =
        selection === "2" ||
        selection === "away" ||
        selection ===
          match.away_team
            .trim()
            .toLowerCase();

      if (isHome) {
        if (
          !result.home ||
          currentOdds >
            Number(result.home.odds)
        ) {
          result.home = odd;
        }

        continue;
      }

      if (isDraw) {
        if (
          !result.draw ||
          currentOdds >
            Number(result.draw.odds)
        ) {
          result.draw = odd;
        }

        continue;
      }

      if (isAway) {
        if (
          !result.away ||
          currentOdds >
            Number(result.away.odds)
        ) {
          result.away = odd;
        }
      }
    }

    return result;
  }

  const playableMatches = matches.filter((match) => {
    const matchOdds = get1X2Odds(match);

    return (
      matchOdds.home !== null ||
      matchOdds.draw !== null ||
      matchOdds.away !== null
    );
  });

  function toggleBet(
    match: Match,
    odd: Odd,
  ) {
    const numericOdds =
      Number(odd.odds);

    if (!Number.isFinite(numericOdds)) {
      return;
    }

    const alreadySelected =
      betSlip.some(
        (selection) =>
          selection.oddId === odd.id,
      );

    if (alreadySelected) {
      setBetSlip((current) =>
        current.filter(
          (selection) =>
            selection.oddId !==
            odd.id,
        ),
      );

      return;
    }

    setBetError("");
    setBetSuccess("");

    setBetSlip((current) => [
      ...current.filter(
        (selection) =>
          selection.matchId !==
          match.id,
      ),
      {
        oddId: odd.id,
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        selection: odd.selection,
        odds: numericOdds,
        // The betting API validates against sports_odds.market exactly.
        // Do not replace it with sports_markets.market_key.
        market: odd.market,
      },
    ]);
  }

  function isSelected(
    oddId: string,
  ) {
    return betSlip.some(
      (selection) =>
        selection.oddId === oddId,
    );
  }

  function removeBet(
    oddId: string,
  ) {
    setBetSlip((current) =>
      current.filter(
        (selection) =>
          selection.oddId !==
          oddId,
      ),
    );

    setBetError("");
    setBetSuccess("");
  }

  function clearBetSlip() {
    setBetSlip([]);
    setStake("");
    setBetError("");
    setBetSuccess("");
  }

  function formatDate(
    date: string,
  ) {
    return new Date(
      date,
    ).toLocaleDateString([], {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }

  function formatTime(
    date: string,
  ) {
    return new Date(
      date,
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function isLive(
    status: string,
  ) {
    const normalized =
      status.trim().toLowerCase();

    return (
      normalized === "live" ||
      normalized === "in_play" ||
      normalized === "in-play"
    );
  }

  function getMarketTitle() {
    if (
      selectedSport === "football"
    ) {
      return "1X2";
    }

    return "Moneyline";
  }

  function getMarketDisplayName(
    odd: Odd,
  ) {
    if (
      odd.sports_markets
        ?.market_name
    ) {
      return odd.sports_markets
        .market_name;
    }

    switch (odd.market) {
      case "h2h":
      case "1x2":
        return "1X2";

      case "double-chance":
        return "Double Chance";

      case "draw-no-bet":
        return "Draw No Bet";

      case "ou":
        return "Over / Under";

      case "gg-ng":
        return "Both Teams To Score";

      default:
        return odd.market;
    }
  }

  function getMatchMarkets(
    match: Match,
  ) {
    const matchOdds =
      oddsByMatch[match.id] ?? [];

    const activeOdds =
      matchOdds.filter(
        (odd) => odd.is_active,
      );

    const grouped: Record<
      string,
      Odd[]
    > = {};

    for (const odd of activeOdds) {
      const marketKey =
        odd.sports_markets
          ?.market_key ??
        odd.market ??
        "other";

      if (!grouped[marketKey]) {
        grouped[marketKey] = [];
      }

      grouped[marketKey].push(
        odd,
      );
    }

    return Object.entries(
      grouped,
    ).sort(
      ([, oddsA], [, oddsB]) => {
        const orderA =
          oddsA[0]
            ?.sports_markets
            ?.sort_order ??
          oddsA[0]
            ?.sort_order ??
          999;

        const orderB =
          oddsB[0]
            ?.sports_markets
            ?.sort_order ??
          oddsB[0]
            ?.sort_order ??
          999;

        return (
          orderA - orderB
        );
      },
    );
  }

  function openMatchDetails(
    match: Match,
  ) {
    setSelectedMatch(match);
  }

  function closeMatchDetails() {
    setSelectedMatch(null);
  }

  const combinedOdds = useMemo(
    () => {
      if (betSlip.length === 0) {
        return 0;
      }

      return betSlip.reduce(
        (total, selection) =>
          total * selection.odds,
        1,
      );
    },
    [betSlip],
  );

  const numericStake =
    Number(stake);

  const potentialPayout =
    Number.isFinite(
      numericStake,
    ) &&
    numericStake > 0 &&
    betSlip.length > 0
      ? numericStake *
        combinedOdds
      : 0;

  async function handlePlaceBet() {
    setBetError("");
    setBetSuccess("");

    if (betSlip.length === 0) {
      setBetError(
        "Your bet slip is empty.",
      );
      return;
    }

    if (
      betType === "accumulator" &&
      betSlip.length < 2
    ) {
      setBetError(
        "An accumulator requires at least two selections.",
      );
      return;
    }

    if (
      !Number.isFinite(
        numericStake,
      ) ||
      numericStake <= 0
    ) {
      setBetError(
        "Please enter a valid stake.",
      );
      return;
    }

    if (authLoading) {
      setBetError("Please wait while BETZONE checks your account.");
      return;
    }

    const token =
      localStorage.getItem(
        TOKEN_KEY,
      );

    if (!token || !user) {
      setAuthError("Please log in or register before placing a bet.");
      setAuthMode("login");
      return;
    }

    setBetSubmitting(true);

    try {
      // Build the payload from the exact active odd currently held by the
      // frontend. The database place_bet function requires odd_id, match_id,
      // market and selection to match the sports_odds row exactly.
      const currentOdds = [
        ...odds,
        ...footballQuickOdds,
      ];

      const betSelections = betSlip.map((selected) => {
        const currentOdd = currentOdds.find(
          (odd) => odd.id === selected.oddId,
        );

        if (!currentOdd) {
          throw new Error(
            "One of your selected odds is no longer available. Please refresh the page and select the odds again.",
          );
        }

        if (!currentOdd.is_active) {
          throw new Error(
            "One of your selected odds is no longer available. Please refresh the page and select the odds again.",
          );
        }

        return {
          odd_id: currentOdd.id,
          match_id: currentOdd.match_id,
          market: currentOdd.market,
          selection: currentOdd.selection,
        };
      });

      const response =
        await fetch(
          `${API_URL}/bets`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              betType,
              stake: numericStake,
              selections: betSelections,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Unable to place your bet.";

        throw new Error(
          Array.isArray(message)
            ? message.join(", ")
            : message,
        );
      }

      if (
        data?.new_balance !==
        undefined
      ) {
        setWallet(
          (current) => ({
            id:
              current?.id ??
              null,
            balance:
              data.new_balance,
          }),
        );
      } else {
        await loadCurrentUser(
          token,
        );
      }

      const submission = data?.data ?? data ?? {};

      const bookingCode =
        submission?.bet_reference ??
        submission?.booking_code ??
        "";

      const submittedStake =
        submission?.stake ??
        numericStake;

      const submittedTotalOdds =
        submission?.total_odds ??
        combinedOdds;

      const submittedPotentialReturn =
        submission?.potential_return ??
        submission?.potential_win ??
        potentialPayout;

      if (bookingCode) {
        setBetSubmission({
          bet_reference: String(bookingCode),
          stake: submittedStake,
          total_odds: submittedTotalOdds,
          potential_return: submittedPotentialReturn,
        });
      }

      setBetSuccess(
        bookingCode
          ? `Bet ${bookingCode} placed successfully.`
          : "Your bet was placed successfully.",
      );

      setBetSlip([]);
      setStake("");
      void loadMyBets();
    } catch (err) {
      console.error(
        "Failed to place bet",
        err,
      );

      setBetError(
        err instanceof Error
          ? err.message
          : "Unable to place your bet.",
      );
    } finally {
      setBetSubmitting(false);
    }
  }

  async function handleLoadBet() {
    setLoadBetError("");
    setLoadBetSuccess("");
    setLoadedBet(null);

    const reference =
      loadBetReference.trim().toUpperCase();

    if (!reference) {
      setLoadBetError("Enter a bet reference.");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoadBetOpen(false);
      setAuthError("");
      setAuthMode("login");
      return;
    }

    setLoadBetLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/bets/load?reference=${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Unable to load bet.";

        throw new Error(
          Array.isArray(message)
            ? message.join(", ")
            : message,
        );
      }

      const loadedData = data?.data ?? null;

      setLoadedBet(loadedData);

      const loadedIntoBetslip = addLoadedBetToBetslip(loadedData);

      if (!loadedIntoBetslip) {
        return;
      }

      setLoadBetSuccess(
        `${loadedData?.selections?.length ?? 0} selection${
          (loadedData?.selections?.length ?? 0) === 1 ? "" : "s"
        } added to your betslip.`,
      );
      setLoadBetOpen(false);
    } catch (err) {
      console.error("Load bet failed", err);
      setLoadBetError(
        err instanceof Error
          ? err.message
          : "Unable to load bet.",
      );
    } finally {
      setLoadBetLoading(false);
    }
  }

  function addLoadedBetToBetslip(betToLoad: BetRecord | null = loadedBet): boolean {
    if (!betToLoad?.selections?.length) {
      setLoadBetError("This bet has no selections to load.");
      return false;
    }

    const selections: BetSelection[] = [];

    for (const item of betToLoad.selections) {
      const match = matches.find(
        (currentMatch) =>
          currentMatch.id === String(item.match_id ?? item.matchId),
      );

      const currentOdd = odds.find(
        (odd) =>
          odd.id === String(item.odd_id ?? item.oddId),
      );

      const numericOdds = Number(
        item.odds ?? currentOdd?.odds,
      );

      if (!Number.isFinite(numericOdds)) {
        continue;
      }

      const matchId = String(
        item.match_id ?? item.matchId ?? match?.id ?? "",
      );

      if (!matchId) {
        continue;
      }

      selections.push({
        oddId: String(
          item.odd_id ?? item.oddId ?? currentOdd?.id ?? "",
        ),
        matchId,
        homeTeam:
          item.home_team ??
          item.homeTeam ??
          match?.home_team ??
          "Home",
        awayTeam:
          item.away_team ??
          item.awayTeam ??
          match?.away_team ??
          "Away",
        selection: String(
          item.selection ?? "",
        ),
        odds: numericOdds,
        market: String(
          item.market ??
          currentOdd?.market ??
          "h2h",
        ),
      });
    }

    if (selections.length === 0) {
      setLoadBetError(
        "The loaded bet selections could not be added to the current betslip.",
      );
      return false;
    }

    setBetSlip(selections);
    setBetType(
      betToLoad.bet_type === "multiple" ||
      betToLoad.bet_type === "accumulator"
        ? "accumulator"
        : "single",
    );
    setStake("");
    setBetError("");
    setBetSuccess("");
    return true;
  }

  function closeLoadBet() {
    if (loadBetLoading) {
      return;
    }

    setLoadBetOpen(false);
    setLoadBetReference("");
    setLoadedBet(null);
    setLoadBetError("");
    setLoadBetSuccess("");
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#071b34] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-2xl font-black tracking-tight">
              BETZONE
            </div>

            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/50">
              Sports Betting
            </p>
          </div>

          <div className="relative flex items-center gap-2">
            {authLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
            ) : user ? (
              <>
                <button
                  onClick={() => {
                    setLoadBetError("");
                    setLoadBetSuccess("");
                    setLoadedBet(null);
                    setLoadBetReference("");
                    setLoadBetOpen(true);
                    setAccountOpen(false);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10 sm:px-4"
                >
                  Load Bet
                </button>

                <button
                  onClick={() =>
                    setAccountOpen(
                      (current) =>
                        !current,
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 sm:px-4"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5b400] text-xs font-black text-[#071b34]">
                    A
                  </div>

                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">
                      Account
                    </p>

                    <p className="text-sm font-black text-white">
                      GHS{" "}
                      {formatBalance(
                        wallet?.balance ??
                          0,
                      )}
                    </p>
                  </div>

                  <span className="ml-1 text-xs text-white/50">
                    {accountOpen
                      ? "▲"
                      : "▼"}
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl">
                    <div className="border-b border-gray-100 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                        Account
                      </p>

                      <p className="mt-1 truncate text-sm font-bold">
                        {user.email}
                      </p>

                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          Balance
                        </p>

                        <p className="mt-1 text-xl font-black text-[#071b34]">
                          GHS{" "}
                          {formatBalance(
                            wallet?.balance ??
                              0,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3">
                      <button
                        onClick={() =>
                          openTransaction(
                            "deposit",
                          )
                        }
                        className="rounded-lg bg-[#071b34] px-3 py-3 text-xs font-black text-white transition hover:bg-[#102c50]"
                      >
                        Deposit
                      </button>

                      <button
                        onClick={() =>
                          openTransaction(
                            "withdrawal",
                          )
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-black text-[#071b34] transition hover:bg-gray-100"
                      >
                        Withdraw
                      </button>
                    </div>

                    <button
                      onClick={
                        handleLogout
                      }
                      className="w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthError("");
                    setAuthMode(
                      "login",
                    );
                  }}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 sm:px-4 sm:text-sm"
                >
                  Login
                </button>

                <button
                  onClick={() => {
                    setAuthError("");
                    setAuthMode(
                      "register",
                    );
                  }}
                  className="rounded-lg bg-[#f5b400] px-3 py-2 text-xs font-bold text-[#071b34] transition hover:bg-[#ffc62b] sm:px-4 sm:text-sm"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SPORTS */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSportsMenuOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left shadow-sm transition hover:border-[#071b34] sm:w-auto sm:min-w-[240px]"
            >
              <span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  All Sports
                </span>
                <span className="mt-0.5 block text-sm font-black text-[#071b34]">
                  {sports.find((sport) => sport.sport_key === selectedSport)?.sport_name || "Football"}
                </span>
              </span>
              <span className="ml-4 text-lg text-gray-500">{sportsMenuOpen ? "⌃" : "⌄"}</span>
            </button>

            {sportsMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl sm:w-[520px]">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => {
                        setSelectedSport(sport.sport_key);
                        setSportsMenuOpen(false);
                      }}
                      className={`rounded-xl px-3 py-3 text-left text-xs font-black transition ${
                        selectedSport === sport.sport_key
                          ? "bg-[#071b34] text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {sport.sport_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTBALL LIVE + NEXT 3 HOURS */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between bg-[#071b34] px-4 py-3 text-white sm:px-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <h2 className="text-sm font-black">Football · Live & Next 3 Hours</h2>
                </div>
                <p className="mt-1 text-[10px] text-white/60">Today’s quickest football matches to watch and bet.</p>
              </div>
              <button
                type="button"
                onClick={loadFootballQuickMatches}
                disabled={footballQuickLoading}
                className="rounded-lg border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {footballQuickLoading ? "Loading" : "Refresh"}
              </button>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {footballQuickMatches.slice(0, 6).map((match) => {
                const matchOdds = footballQuickOdds.filter((odd) => odd.match_id === match.id && odd.is_active);
                const oneXTwo = matchOdds.filter((odd) =>
                  odd.sports_markets?.market_key === "1x2" || odd.market === "1x2" || odd.market === "h2h",
                );
                const homeOdd = oneXTwo.find((odd) => odd.selection === "1" || odd.selection === match.home_team);
                const drawOdd = oneXTwo.find((odd) => odd.selection === "X" || odd.selection === "Draw");
                const awayOdd = oneXTwo.find((odd) => odd.selection === "2" || odd.selection === match.away_team);
                const status = String(match.status || "").toLowerCase();
                const live = ["live", "in_play", "in-play", "inplay", "started"].includes(status);

                return (
                  <div key={match.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-wide ${live ? "text-red-600" : "text-gray-400"}`}>
                        {live ? "LIVE" : new Date(match.kickoff_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="truncate text-[9px] font-bold text-gray-400">Football</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openMatchDetails(match)}
                      className="mt-2 w-full text-left"
                    >
                      <div className="text-xs font-black text-gray-900">{match.home_team}</div>
                      <div className="mt-1 text-xs font-black text-gray-900">{match.away_team}</div>
                    </button>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {[
                        ["1", homeOdd],
                        ["X", drawOdd],
                        ["2", awayOdd],
                      ].map((item) => {
                        const label = item[0] as string;
                        const odd = item[1] as Odd | null;

                        return (
                        <button
                          key={label as string}
                          type="button"
                          disabled={!odd}
                          onClick={() => odd && toggleBet(match, odd as Odd)}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-center transition hover:border-[#071b34] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="block text-[9px] font-bold text-gray-400">{label}</span>
                          <span className="mt-0.5 block text-xs font-black text-[#071b34]">{odd ? Number((odd as Odd).odds).toFixed(2) : "-"}</span>
                        </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!footballQuickLoading && footballQuickMatches.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 px-4 py-6 text-center text-xs font-semibold text-gray-500">
                  No football matches are live or starting within the next 3 hours.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)_380px]">
        {/* LEAGUES */}
        <aside className="h-fit overflow-hidden rounded-2xl bg-white shadow-sm lg:sticky lg:top-20">
          <div className="border-b border-gray-200 bg-[#071b34] px-4 py-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-white">
              Popular
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {leagues.length > 0 ? (
              leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={`flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left text-sm font-bold transition ${
                    selectedLeague === league.id
                      ? "bg-[#071b34] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="min-w-0 truncate">{league.name}</span>
                  <span className={`ml-2 shrink-0 text-lg leading-none ${selectedLeague === league.id ? "text-[#f5b400]" : "text-gray-400"}`}>
                    ›
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-gray-500">
                No leagues available yet.
              </p>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0">
          <div className="mb-5 overflow-hidden rounded-2xl bg-[#071b34] p-6 text-white shadow-sm sm:p-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b400]">
              Welcome to BETZONE
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Bet on the action.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              Live sports, competitive odds and a fast,
              simple betting experience.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                Live Odds
              </span>

              <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                Fast Bets
              </span>

              <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                Multiple Sports
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {sports.find(
                      (sport) =>
                        sport.sport_key ===
                        selectedSport,
                    )?.sport_name ??
                      "Sports"}
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Select a league to view available matches
                  </p>
                </div>

                <div className="hidden rounded-lg bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 sm:block">
                  {playableMatches.length}{" "}
                  {playableMatches.length ===
                  1
                    ? "match"
                    : "matches"}
                </div>
              </div>


              </div>

            {error && (
              <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:m-5">
                {error}
              </div>
            )}

            {loadingMatches && (
              <div className="p-10 text-center">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#071b34]" />

                <p className="text-sm font-medium text-gray-500">
                  Loading matches...
                </p>
              </div>
            )}

            {!loadingMatches &&
              !error &&
              playableMatches.length ===
                0 && (
                <div className="p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-400">
                    —
                  </div>

                  <p className="mt-4 text-sm font-bold text-gray-600">
                    No matches available.
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Matches with available betting odds will appear here.
                  </p>
                </div>
              )}

            {!loadingMatches &&
              !error &&
              playableMatches.map(
                (match) => {
                  const matchOdds =
                    get1X2Odds(match);

                  const live =
                    isLive(
                      match.status,
                    );

                  const marketCount =
                    getMatchMarkets(
                      match,
                    ).length;

                  return (
                    <article
                      key={match.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-2.5 sm:px-5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5b400]" />

                          <span className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                            {leagues.find(
                              (league) =>
                                league.id ===
                                selectedLeague,
                            )?.name ??
                              "League"}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {live ? (
                            <span className="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-red-600">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                              Live
                            </span>
                          ) : (
                            <span className="rounded-md bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wide text-gray-500">
                              Scheduled
                            </span>
                          )}

                          <span className="text-[10px] font-bold text-gray-400">
                            {formatDate(
                              match.kickoff_at,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="grid gap-4 lg:grid-cols-[minmax(210px,1fr)_minmax(360px,1.6fr)_auto] lg:items-center">
                          <button
                            onClick={() =>
                              openMatchDetails(
                                match,
                              )
                            }
                            className="min-w-0 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-400">
                                H
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-gray-900">
                                  {
                                    match.home_team
                                  }
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  Home
                                </p>
                              </div>
                            </div>

                            <div className="my-2 ml-3.5 h-3 border-l border-dashed border-gray-300" />

                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-400">
                                A
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-gray-900">
                                  {
                                    match.away_team
                                  }
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  Away
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                              <span>
                                {formatTime(
                                  match.kickoff_at,
                                )}
                              </span>

                              <span>
                                •
                              </span>

                              <span className="capitalize">
                                {
                                  match.status
                                }
                              </span>
                            </div>
                          </button>

                          <div className="min-w-0">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                                {getMarketTitle()}
                              </span>

                              <span className="text-[9px] font-bold uppercase tracking-wide text-gray-300">
                                Select odds
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                {
                                  odd: matchOdds.home,
                                  label: "Home",
                                  code: "1",
                                },
                                {
                                  odd: matchOdds.draw,
                                  label: "Draw",
                                  code: "X",
                                },
                                {
                                  odd: matchOdds.away,
                                  label: "Away",
                                  code: "2",
                                },
                              ].map(
                                (
                                  item,
                                ) => (
                                  <button
                                    key={
                                      item.code
                                    }
                                    disabled={
                                      !item.odd
                                    }
                                    onClick={() =>
                                      item.odd &&
                                      toggleBet(
                                        match,
                                        item.odd,
                                      )
                                    }
                                    className={`group min-w-0 rounded-xl border p-3 text-left transition ${
                                      item.odd &&
                                      isSelected(
                                        item
                                          .odd
                                          .id,
                                      )
                                        ? "border-[#f5b400] bg-[#fff8dc]"
                                        : item.odd
                                          ? "border-gray-200 bg-white hover:border-[#071b34] hover:shadow-sm"
                                          : "border-gray-100 bg-gray-50 opacity-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate text-[10px] font-bold text-gray-500">
                                        {
                                          item.label
                                        }
                                      </span>

                                      <span className="text-[9px] font-black text-gray-300">
                                        {
                                          item.code
                                        }
                                      </span>
                                    </div>

                                    <span className="mt-2 block text-lg font-black text-gray-900">
                                      {item.odd
                                        ? Number(
                                            item
                                              .odd
                                              .odds,
                                          ).toFixed(
                                            2,
                                          )
                                        : "-"}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              openMatchDetails(
                                match,
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-[#071b34] transition hover:border-[#071b34] hover:bg-[#071b34] hover:text-white lg:min-w-[100px] lg:flex-col lg:gap-1"
                          >
                            <span className="text-lg leading-none">
                              +
                            </span>

                            <span>
                              {marketCount >
                              0
                                ? `${marketCount} ${
                                    marketCount ===
                                    1
                                      ? "Market"
                                      : "Markets"
                                  }`
                                : "Markets"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
          </div>
        </section>

        {/* BET SLIP */}
        <aside className="h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg lg:sticky lg:top-20">
          {/* BETSLIP / CASHOUT TABS */}
          <div className="border-b border-gray-200 bg-[#071b34] px-3 pt-2">
            <div className="grid grid-cols-2">
              <button
                type="button"
                onClick={() => setBetSlipTab("betslip")}
                className={`relative px-3 py-3 text-sm font-black transition ${
                  betSlipTab === "betslip"
                    ? "text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Betslip
                {betSlip.length > 0 && (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#f5b400] px-1.5 py-0.5 text-[10px] font-black text-[#071b34]">
                    {betSlip.length}
                  </span>
                )}
                {betSlipTab === "betslip" && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#f5b400]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setBetSlipTab("cashout")}
                className={`relative px-3 py-3 text-sm font-black transition ${
                  betSlipTab === "cashout"
                    ? "text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                My Bet
                {betSlipTab === "cashout" && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#f5b400]" />
                )}
              </button>
            </div>
          </div>

          {/* REAL / SIM */}
          {betSlipTab === "betslip" && (
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <div className="inline-flex overflow-hidden rounded-full border border-gray-300 bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setBetSlipMode("real")}
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide transition ${
                  betSlipMode === "real"
                    ? "bg-[#1b9b52] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Real
              </button>
              <button
                type="button"
                onClick={() => setBetSlipMode("sim")}
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide transition ${
                  betSlipMode === "sim"
                    ? "bg-[#071b34] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sim
              </button>
            </div>
          </div>
          )}

          {betSlipTab === "cashout" ? (
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">My Bet</h3>
                  <p className="mt-1 text-[10px] text-gray-400">Your open and settled bets.</p>
                </div>
                <button
                  type="button"
                  onClick={loadMyBets}
                  disabled={myBetsLoading}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-[10px] font-black text-[#071b34] disabled:opacity-50"
                >
                  {myBetsLoading ? "Loading" : "Refresh"}
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setMyBetFilter("open")}
                  className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wide ${myBetFilter === "open" ? "bg-white text-[#071b34] shadow-sm" : "text-gray-500"}`}
                >
                  Open ({myOpenBets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMyBetFilter("settled")}
                  className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wide ${myBetFilter === "settled" ? "bg-white text-[#071b34] shadow-sm" : "text-gray-500"}`}
                >
                  Settled ({mySettledBets.length})
                </button>
              </div>

              {myBetsError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-semibold text-red-700">
                  {myBetsError}
                </div>
              )}

              {myBetsLoading ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-xs font-semibold text-gray-500">
                  Loading your bets...
                </div>
              ) : (myBetFilter === "open" ? myOpenBets : mySettledBets).length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center">
                  <div className="text-2xl text-gray-300">▱</div>
                  <p className="mt-2 text-xs font-black text-gray-600">
                    {myBetFilter === "open" ? "No open bets" : "No settled bets"}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-gray-400">
                    Your {myBetFilter} bets will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(myBetFilter === "open" ? myOpenBets : mySettledBets).map((bet) => {
                    const status = String(bet.status || "open").toUpperCase();
                    const totalOdds = Number(bet.total_odds ?? bet.odds ?? 0);
                    const stakeValue = Number(bet.stake ?? 0);
                    const potentialWin = Number(
                      bet.potential_return ??
                        bet.potential_win ??
                        bet.potential_payout ??
                        0,
                    );
                    const betId = String(bet.id ?? bet.bet_reference ?? "bet");
                    const bookingCode = String(bet.bet_reference ?? "");

                    return (
                      <div
                        key={betId}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-[#071b34]">
                              {bookingCode || betId}
                            </div>
                            <div className="mt-1 text-[10px] text-gray-400">
                              {bet.bet_type || "Bet"} · {formatMyBetDate(bet.created_at || bet.placed_at || bet.updated_at)}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                              status === "WON"
                                ? "bg-green-100 text-green-700"
                                : status === "LOST"
                                  ? "bg-red-100 text-red-700"
                                  : status === "OPEN" || status === "PENDING"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 border-y border-gray-100 py-3">
                          <div>
                            <div className="text-[9px] uppercase tracking-wide text-gray-400">Stake</div>
                            <div className="mt-1 text-xs font-black">GHS {stakeValue.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase tracking-wide text-gray-400">Odds</div>
                            <div className="mt-1 text-xs font-black">{totalOdds > 0 ? totalOdds.toFixed(2) : "-"}</div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase tracking-wide text-gray-400">Pot. Win</div>
                            <div className="mt-1 text-xs font-black text-[#1b9b52]">GHS {potentialWin > 0 ? potentialWin.toFixed(2) : "0.00"}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMyBet(bet);
                          }}
                          className="mt-3 w-full rounded-lg bg-[#071b34] px-3 py-2.5 text-[10px] font-black text-white transition hover:bg-[#102c50]"
                        >
                          View Ticket Details
                        </button>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              {betSlipMode === "sim" && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-[11px] font-semibold leading-5 text-blue-700">
                  Simulation mode is for testing selections and payouts. Real bets are not placed from this mode.
                </div>
              )}

              {betError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-bold leading-5 text-red-700">
                    {betError}
                  </p>
                </div>
              )}

              {betSuccess && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-bold leading-5 text-green-700">
                    {betSuccess}
                  </p>
                </div>
              )}

              {betSlip.length === 0 ? (
                <div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl font-light text-gray-400">
                      +
                    </div>
                    <p className="mt-3 text-sm font-black text-gray-700">
                      Your betslip is empty
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      To place a bet, click on the odds or load a booking code.
                    </p>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="emptySlipBookingCode"
                      className="sr-only"
                    >
                      Booking Code
                    </label>
                    <input
                      id="emptySlipBookingCode"
                      value={loadBetReference}
                      onChange={(event) =>
                        setLoadBetReference(event.target.value.toUpperCase())
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleLoadBet();
                        }
                      }}
                      placeholder="Booking Code"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-xs font-bold uppercase tracking-wide text-gray-900 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#071b34] focus:ring-2 focus:ring-[#071b34]/10"
                      disabled={loadBetLoading}
                    />
                    <button
                      type="button"
                      onClick={handleLoadBet}
                      disabled={loadBetLoading || !loadBetReference.trim()}
                      className="mt-2.5 w-full rounded-lg bg-[#071b34] py-3 text-xs font-black text-white transition hover:bg-[#102c50] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {loadBetLoading ? "Loading..." : "Load"}
                    </button>
                  </div>

                  <p className="mt-3 text-[10px] leading-4 text-gray-400">
                    A booking code enables you to transfer a betslip between different devices.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                        {betSlip.length} {betSlip.length === 1 ? "Selection" : "Selections"}
                      </p>
                      <p className="mt-0.5 text-sm font-black text-gray-900">
                        {betType === "accumulator" ? "Accumulator" : "Singles"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearBetSlip}
                      disabled={betSubmitting}
                      className="text-[10px] font-black uppercase tracking-wide text-red-500 transition hover:text-red-700 disabled:opacity-50"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="mb-4 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBetType("single");
                        setBetError("");
                        setBetSuccess("");
                      }}
                      disabled={betSubmitting}
                      className={`rounded-md py-2 text-[11px] font-black transition ${
                        betType === "single"
                          ? "bg-white text-[#071b34] shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      } disabled:opacity-50`}
                    >
                      Singles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBetType("accumulator");
                        setBetError("");
                        setBetSuccess("");
                      }}
                      disabled={betSubmitting}
                      className={`rounded-md py-2 text-[11px] font-black transition ${
                        betType === "accumulator"
                          ? "bg-white text-[#071b34] shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      } disabled:opacity-50`}
                    >
                      Accumulator
                    </button>
                  </div>

                  {betType === "accumulator" && betSlip.length < 2 && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-700">
                      Add at least two selections to create an accumulator.
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {betSlip.map((selection, index) => (
                      <div
                        key={selection.oddId}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#071b34] text-[9px] font-black text-white">
                                {index + 1}
                              </span>
                              <span className="truncate text-[10px] font-black uppercase tracking-wide text-gray-400">
                                {selection.market || "Market"}
                              </span>
                            </div>

                            <p className="mt-2 truncate text-xs font-black text-gray-900">
                              {selection.homeTeam}
                              <span className="mx-1 text-gray-300">vs</span>
                              {selection.awayTeam}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate rounded-md bg-white px-2 py-1 text-[10px] font-black text-gray-600 shadow-sm">
                                {selection.selection}
                              </span>
                              <span className="shrink-0 rounded-md bg-[#fff5c9] px-2 py-1 text-[11px] font-black text-[#071b34]">
                                {selection.odds.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeBet(selection.oddId)}
                            disabled={betSubmitting}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            aria-label="Remove selection"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="stake"
                      className="mb-2 block text-[10px] font-black uppercase tracking-wide text-gray-500"
                    >
                      Stake
                    </label>
                    <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-[#071b34] focus-within:ring-2 focus-within:ring-[#071b34]/10">
                      <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-xs font-black text-gray-500">
                        GHS
                      </span>
                      <input
                        id="stake"
                        type="number"
                        min="0"
                        step="0.01"
                        value={stake}
                        onChange={(event) => {
                          setStake(event.target.value);
                          setBetError("");
                          setBetSuccess("");
                        }}
                        placeholder="0.00"
                        disabled={betSubmitting}
                        className="min-w-0 flex-1 px-3 py-3 text-sm font-black text-gray-900 outline-none placeholder:text-gray-300 disabled:bg-gray-50"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {[10, 20, 50, 100].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setStake(String(amount))}
                          disabled={betSubmitting}
                          className="rounded-md border border-gray-200 bg-gray-50 py-1.5 text-[10px] font-black text-gray-600 transition hover:border-[#071b34] hover:bg-white hover:text-[#071b34] disabled:opacity-50"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Total odds</span>
                      <span className="font-black text-gray-900">
                        {combinedOdds > 0 ? combinedOdds.toFixed(2) : "0.00"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                      <span className="font-bold text-gray-600">Potential payout</span>
                      <span className="font-black text-[#071b34]">
                        GHS {potentialPayout > 0 ? potentialPayout.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlaceBet}
                    disabled={
                      betSubmitting ||
                      betSlipMode === "sim" ||
                      betSlip.length === 0 ||
                      (betType === "accumulator" && betSlip.length < 2) ||
                      !Number.isFinite(numericStake) ||
                      numericStake <= 0
                    }
                    className="mt-4 w-full rounded-lg bg-[#f5b400] py-3.5 text-sm font-black text-[#071b34] transition hover:bg-[#ffc62b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {betSubmitting
                      ? "Placing bet..."
                      : betSlipMode === "sim"
                        ? "Simulation Mode"
                        : "Place Bet"}
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-4 text-gray-400">
                    {betSlipMode === "sim"
                      ? "Simulation mode is currently for preview only."
                      : "Final odds and payout will be validated by the BETZONE server before a bet is placed."}
                  </p>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* LOAD BET */}
      {loadBetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={closeLoadBet}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-[#071b34] px-5 py-5 text-white sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5b400]">
                    BETZONE
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Load Bet
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-white/60">
                    Enter a bet reference to load another customer&apos;s selections into your betslip.
                  </p>
                </div>

                <button
                  onClick={closeLoadBet}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label="Close load bet"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <label
                htmlFor="loadBetReference"
                className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500"
              >
                Bet reference
              </label>

              <div className="flex gap-2">
                <input
                  id="loadBetReference"
                  value={loadBetReference}
                  onChange={(event) =>
                    setLoadBetReference(event.target.value.toUpperCase())
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleLoadBet();
                    }
                  }}
                  placeholder="e.g. BZ6B3867383C"
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-gray-900 outline-none transition focus:border-[#071b34] focus:bg-white"
                  disabled={loadBetLoading}
                />

                <button
                  type="button"
                  onClick={handleLoadBet}
                  disabled={loadBetLoading}
                  className="rounded-xl bg-[#f5b400] px-4 py-3 text-xs font-black text-[#071b34] transition hover:bg-[#ffc62b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadBetLoading ? "Loading..." : "Load"}
                </button>
              </div>

              {loadBetError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {loadBetError}
                </div>
              )}

              {loadBetSuccess && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                  {loadBetSuccess}
                </div>
              )}

              {loadedBet && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                        Bet reference
                      </p>
                      <p className="mt-1 text-sm font-black text-[#071b34]">
                        {loadedBet.bet_reference}
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-gray-500 shadow-sm">
                      {loadedBet.bet_type === "multiple"
                        ? "Accumulator"
                        : loadedBet.bet_type}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Stake
                      </p>
                      <p className="mt-1 text-sm font-black text-gray-900">
                        GHS {Number(loadedBet.stake).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Odds
                      </p>
                      <p className="mt-1 text-sm font-black text-gray-900">
                        {Number(loadedBet.total_odds).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-black capitalize text-gray-900">
                        {loadedBet.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-gray-400">
                      Selections
                    </p>

                    <div className="space-y-2">
                      {(loadedBet.selections ?? []).map(
                        (item: BetRecord, index: number) => {
                          const match = matches.find(
                            (currentMatch) =>
                              currentMatch.id ===
                              String(item.match_id ?? item.matchId),
                          );

                          return (
                            <div
                              key={`${item.odd_id ?? item.oddId ?? index}-${index}`}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <p className="text-xs font-black text-gray-900">
                                {item.home_team ?? item.homeTeam ?? match?.home_team ?? "Home"}
                                <span className="mx-1 text-gray-300">vs</span>
                                {item.away_team ?? item.awayTeam ?? match?.away_team ?? "Away"}
                              </p>
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-600">
                                  {item.selection}
                                </span>
                                <span className="text-xs font-black text-[#071b34]">
                                  {Number(item.odds).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addLoadedBetToBetslip()}
                    className="mt-4 w-full rounded-xl bg-[#071b34] py-3.5 text-sm font-black text-white transition hover:bg-[#102c50]"
                  >
                    Load into my Betslip
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-4 text-gray-400">
                    Loading a bet copies its selections only. The original bet remains with its original customer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MATCH DETAILS */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={
            closeMatchDetails
          }
        >
          <div
            className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-t-3xl bg-[#f4f6f8] shadow-2xl sm:rounded-3xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="bg-[#071b34] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/70">
                      {selectedSport.replace(
                        /_/g,
                        " ",
                      )}
                    </span>

                    {isLive(
                      selectedMatch.status,
                    ) ? (
                      <span className="flex items-center gap-1.5 rounded-md bg-red-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                        Live
                      </span>
                    ) : (
                      <span className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/60">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
                    <div className="min-w-0 text-right">
                      <h2 className="truncate text-lg font-black sm:text-2xl">
                        {
                          selectedMatch.home_team
                        }
                      </h2>

                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/40">
                        Home
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-black text-white/50">
                      VS
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black sm:text-2xl">
                        {
                          selectedMatch.away_team
                        }
                      </h2>

                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/40">
                        Away
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-white/55">
                    <span>
                      {formatDate(
                        selectedMatch.kickoff_at,
                      )}
                    </span>

                    <span>
                      •
                    </span>

                    <span>
                      {formatTime(
                        selectedMatch.kickoff_at,
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={
                    closeMatchDetails
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label="Close match details"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[calc(94vh-205px)] overflow-y-auto p-3 sm:p-6">
              {getMatchMarkets(
                selectedMatch,
              ).length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                  <p className="text-sm font-bold text-gray-600">
                    No markets available
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Betting markets are currently unavailable for this match.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {getMatchMarkets(
                    selectedMatch,
                  ).map(
                    ([
                      marketKey,
                      marketOdds,
                    ]) => {
                      const firstOdd =
                        marketOdds[0];

                      const marketName =
                        firstOdd
                          ?.sports_markets
                          ?.market_name ||
                        getMarketDisplayName(
                          firstOdd,
                        );

                      const sortedOdds = [
                        ...marketOdds,
                      ].sort(
                        (a, b) => {
                          const orderDifference =
                            a.sort_order -
                            b.sort_order;

                          if (
                            orderDifference !==
                            0
                          ) {
                            return orderDifference;
                          }

                          return a.selection.localeCompare(
                            b.selection,
                          );
                        },
                      );

                      const marketGroup =
                        firstOdd
                          ?.sports_markets
                          ?.market_group ||
                        firstOdd?.market_group;

                      const hasLines =
                        sortedOdds.some(
                          (odd) =>
                            odd.line !==
                              null &&
                            odd.line !==
                              undefined,
                        );

                      return (
                        <section
                          key={
                            marketKey
                          }
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#f5b400]" />

                                <h3 className="truncate text-sm font-black text-gray-900 sm:text-base">
                                  {
                                    marketName
                                  }
                                </h3>
                              </div>

                              {marketGroup && (
                                <p className="mt-1 pl-4 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                  {
                                    marketGroup
                                  }
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-gray-500">
                              {
                                sortedOdds.length
                              }{" "}
                              {sortedOdds.length ===
                              1
                                ? "Selection"
                                : "Selections"}
                            </span>
                          </div>

                          {marketKey ===
                            "1x2" ||
                          marketKey ===
                            "h2h" ? (
                            <div className="grid grid-cols-3 gap-2 p-3 sm:p-4">
                              {sortedOdds.map(
                                (
                                  odd,
                                ) => {
                                  const numericOdds =
                                    Number(
                                      odd.odds,
                                    );

                                  const selected =
                                    isSelected(
                                      odd.id,
                                    );

                                  const selection =
                                    odd.selection
                                      .trim()
                                      .toLowerCase();

                                  let label =
                                    odd.selection;

                                  if (
                                    selection ===
                                      "1" ||
                                    selection ===
                                      "home" ||
                                    selection ===
                                      selectedMatch.home_team
                                        .trim()
                                        .toLowerCase()
                                  ) {
                                    label =
                                      "Home";
                                  } else if (
                                    selection ===
                                      "x" ||
                                    selection ===
                                      "draw"
                                  ) {
                                    label =
                                      "Draw";
                                  } else if (
                                    selection ===
                                      "2" ||
                                    selection ===
                                      "away" ||
                                    selection ===
                                      selectedMatch.away_team
                                        .trim()
                                        .toLowerCase()
                                  ) {
                                    label =
                                      "Away";
                                  }

                                  return (
                                    <button
                                      key={
                                        odd.id
                                      }
                                      disabled={
                                        !Number.isFinite(
                                          numericOdds,
                                        )
                                      }
                                      onClick={() =>
                                        toggleBet(
                                          selectedMatch,
                                          odd,
                                        )
                                      }
                                      className={`rounded-xl border p-3 text-left transition sm:p-4 ${
                                        selected
                                          ? "border-[#f5b400] bg-[#fff8dc]"
                                          : "border-gray-200 bg-white hover:border-[#071b34] hover:shadow-sm"
                                      }`}
                                    >
                                      <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                        {
                                          label
                                        }
                                      </span>

                                      <span
                                        className={`mt-2 block text-lg font-black ${
                                          selected
                                            ? "text-[#071b34]"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        {Number.isFinite(
                                          numericOdds,
                                        )
                                          ? numericOdds.toFixed(
                                              2,
                                            )
                                          : "-"}
                                      </span>
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          ) : hasLines ? (
                            <>
                              <div className="grid grid-cols-[70px_1fr_1fr] border-b border-gray-100 bg-gray-50 px-3 py-2 text-[9px] font-black uppercase tracking-wide text-gray-400 sm:grid-cols-[90px_1fr_1fr] sm:px-4">
                                <span>
                                  Line
                                </span>

                                <span className="text-center">
                                  Over
                                </span>

                                <span className="text-center">
                                  Under
                                </span>
                              </div>

                              <div className="divide-y divide-gray-100">
                                {Array.from(
                                  new Set(
                                    sortedOdds.map(
                                      (odd) =>
                                        String(
                                          odd.line ??
                                            "",
                                        ),
                                    ),
                                  ),
                                ).map(
                                  (line) => {
                                    const lineOdds =
                                      sortedOdds.filter(
                                        (odd) =>
                                          String(
                                            odd.line ??
                                              "",
                                          ) ===
                                          line,
                                      );

                                    const over =
                                      lineOdds.find(
                                        (odd) =>
                                          odd.selection
                                            .trim()
                                            .toLowerCase()
                                            .includes(
                                              "over",
                                            ),
                                      );

                                    const under =
                                      lineOdds.find(
                                        (odd) =>
                                          odd.selection
                                            .trim()
                                            .toLowerCase()
                                            .includes(
                                              "under",
                                            ),
                                      );

                                    const renderLineOdd =
                                      (
                                        odd:
                                          | Odd
                                          | undefined,
                                      ) => {
                                        if (
                                          !odd
                                        ) {
                                          return (
                                            <div className="p-3 text-center text-sm text-gray-300">
                                              —
                                            </div>
                                          );
                                        }

                                        const numericOdds =
                                          Number(
                                            odd.odds,
                                          );

                                        const selected =
                                          isSelected(
                                            odd.id,
                                          );

                                        return (
                                          <button
                                            onClick={() =>
                                              toggleBet(
                                                selectedMatch,
                                                odd,
                                              )
                                            }
                                            className={`m-2 rounded-lg px-3 py-2 text-center text-sm font-black transition ${
                                              selected
                                                ? "bg-[#f5b400] text-[#071b34]"
                                                : "bg-gray-100 text-gray-900 hover:bg-[#071b34] hover:text-white"
                                            }`}
                                          >
                                            {Number.isFinite(
                                              numericOdds,
                                            )
                                              ? numericOdds.toFixed(
                                                  2,
                                                )
                                              : "-"}
                                          </button>
                                        );
                                      };

                                    return (
                                      <div
                                        key={
                                          line
                                        }
                                        className="grid grid-cols-[70px_1fr_1fr] items-center sm:grid-cols-[90px_1fr_1fr]"
                                      >
                                        <div className="px-3 py-3 text-center text-xs font-black text-gray-600">
                                          {
                                            line
                                          }
                                        </div>

                                        {renderLineOdd(
                                          over,
                                        )}

                                        {renderLineOdd(
                                          under,
                                        )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4">
                              {sortedOdds.map(
                                (
                                  odd,
                                ) => {
                                  const numericOdds =
                                    Number(
                                      odd.odds,
                                    );

                                  const selected =
                                    isSelected(
                                      odd.id,
                                    );

                                  return (
                                    <button
                                      key={
                                        odd.id
                                      }
                                      disabled={
                                        !Number.isFinite(
                                          numericOdds,
                                        )
                                      }
                                      onClick={() =>
                                        toggleBet(
                                          selectedMatch,
                                          odd,
                                        )
                                      }
                                      className={`rounded-xl border p-3 text-left transition ${
                                        selected
                                          ? "border-[#f5b400] bg-[#fff8dc]"
                                          : "border-gray-200 bg-white hover:border-[#071b34]"
                                      }`}
                                    >
                                      <span className="block truncate text-[10px] font-bold text-gray-500">
                                        {
                                          odd.selection
                                        }
                                      </span>

                                      <span className="mt-2 block text-lg font-black text-gray-900">
                                        {Number.isFinite(
                                          numericOdds,
                                        )
                                          ? numericOdds.toFixed(
                                              2,
                                            )
                                          : "-"}
                                      </span>
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          )}
                        </section>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION MODAL */}
      {transactionMode && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={
            closeTransaction
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="bg-[#071b34] px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5b400]">
                    BETZONE
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {transactionMode ===
                    "deposit"
                      ? "Deposit Funds"
                      : "Withdraw Funds"}
                  </h2>

                  <p className="mt-1 text-xs text-white/50">
                    {transactionMode ===
                    "deposit"
                      ? "Manual deposit"
                      : "Manual withdrawal request"}
                  </p>
                </div>

                <button
                  disabled={
                    transactionSubmitting
                  }
                  onClick={
                    closeTransaction
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/70 transition hover:bg-white/20 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={
                handleTransactionSubmit
              }
              className="p-6"
            >
              {transactionError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {transactionError}
                </div>
              )}

              {transactionSuccess && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                  {transactionSuccess}
                </div>
              )}

              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                Payment Method
              </label>

              <select
                value={
                  transactionPaymentMethod
                }
                onChange={(event) =>
                  setTransactionPaymentMethod(
                    event.target.value,
                  )
                }
                disabled={
                  transactionSubmitting
                }
                className="mb-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-[#071b34]"
              >
                <option value="MTN Mobile Money">
                  MTN Mobile Money
                </option>

                <option value="Telecel">
                  Telecel
                </option>
              </select>

              {transactionMode ===
                "deposit" && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-[#f5b400]/40 bg-[#fff9df]">
                  <div className="border-b border-[#f5b400]/30 bg-[#f5b400]/10 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8a6500]">
                      Manual Payment
                    </p>

                    <p className="mt-1 text-sm font-black text-[#071b34]">
                      Send the money manually before submitting your request.
                    </p>
                  </div>

                  <div className="p-4">
                    {transactionPaymentMethod ===
                    "MTN Mobile Money" ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Send to MTN Mobile Money
                        </p>

                        <p className="mt-2 text-2xl font-black tracking-wide text-[#071b34]">
                          0543587828
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-700">
                          Elliot Kutsoke
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Send to Telecel
                        </p>

                        <p className="mt-2 text-2xl font-black tracking-wide text-[#071b34]">
                          0507724654
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-700">
                          Offei Wonder
                        </p>
                      </>
                    )}

                    <div className="mt-4 rounded-xl bg-white/70 p-3">
                      <p className="text-xs leading-5 text-gray-600">
                        After sending the money, enter the exact amount and your payment/reference number below. Your wallet will remain unchanged until BETZONE manually verifies and approves the deposit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                Amount
              </label>

              <div className="mb-4 flex overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-[#071b34]">
                <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-500">
                  GHS
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    transactionAmount
                  }
                  onChange={(event) =>
                    setTransactionAmount(
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  required
                  disabled={
                    transactionSubmitting
                  }
                  className="min-w-0 flex-1 px-3 py-3 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-300"
                />
              </div>

              {transactionMode ===
              "deposit" ? (
                <>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                    Payment / Reference Number
                  </label>

                  <input
                    type="text"
                    value={
                      transactionReference
                    }
                    onChange={(event) =>
                      setTransactionReference(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Enter the payment reference"
                    required
                    disabled={
                      transactionSubmitting
                    }
                    className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[#071b34]"
                  />

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-700">
                    <p className="font-black">
                      Manual verification
                    </p>

                    <p className="mt-1">
                      Your deposit request will be saved as pending. BETZONE will manually verify your payment before any money is added to your wallet.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={
                      transactionPhoneNumber
                    }
                    onChange={(event) =>
                      setTransactionPhoneNumber(
                        event.target
                          .value,
                      )
                    }
                    placeholder="0240000000"
                    required
                    disabled={
                      transactionSubmitting
                    }
                    className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[#071b34]"
                  />

                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                    Account Name
                    <span className="ml-1 font-normal normal-case text-gray-400">
                      Optional
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      transactionAccountName
                    }
                    onChange={(event) =>
                      setTransactionAccountName(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Account holder name"
                    disabled={
                      transactionSubmitting
                    }
                    className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[#071b34]"
                  />

                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                    Note
                    <span className="ml-1 font-normal normal-case text-gray-400">
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={
                      transactionNote
                    }
                    onChange={(event) =>
                      setTransactionNote(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Additional withdrawal information"
                    rows={3}
                    disabled={
                      transactionSubmitting
                    }
                    className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[#071b34]"
                  />
                </>
              )}

              <button
                type="submit"
                disabled={
                  transactionSubmitting
                }
                className="mt-5 w-full rounded-xl bg-[#f5b400] py-3.5 text-sm font-black text-[#071b34] transition hover:bg-[#ffc62b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {transactionSubmitting
                  ? "Submitting..."
                  : transactionMode ===
                      "deposit"
                    ? "Submit Deposit Request"
                    : "Submit Withdrawal"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MY BET TICKET DETAILS */}
      {selectedMyBet && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4"
          onClick={() => setSelectedMyBet(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const ticketStatus = String(selectedMyBet.status || "open").toUpperCase();
              const ticketSelections = Array.isArray(selectedMyBet.bet_selections)
                ? selectedMyBet.bet_selections
                : Array.isArray(selectedMyBet.selections)
                  ? selectedMyBet.selections
                  : [];
              const ticketStake = Number(selectedMyBet.stake ?? 0);
              const ticketOdds = Number(selectedMyBet.total_odds ?? selectedMyBet.odds ?? 0);
              const ticketPotentialWin = Number(
                selectedMyBet.potential_return ??
                  selectedMyBet.potential_win ??
                  selectedMyBet.potential_payout ??
                  0,
              );
              const ticketReturn = Number(
                selectedMyBet.payout ?? selectedMyBet.winnings ?? 0,
              );
              const ticketReference = String(selectedMyBet.bet_reference ?? "");
              const ticketIsSettled = !["open", "pending", "active", "unsettled"].includes(
                ticketStatus.toLowerCase(),
              );
              const ticketResult = ticketStatus === "WON"
                ? "WON"
                : ticketStatus === "LOST"
                  ? "LOST"
                  : ticketStatus === "VOID" || ticketStatus === "CANCELLED"
                    ? "VOID"
                    : ticketStatus;

              return (
                <>
                  <div className="bg-[#071b34] px-5 py-5 text-white sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5b400]">
                          BETZONE
                        </p>
                        <h2 className="mt-1 text-xl font-black">Ticket Details</h2>
                        <p className="mt-1 text-[10px] text-slate-400">
                          ID: {String(selectedMyBet.id ?? ticketReference ?? "-")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMyBet(null)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white hover:bg-white/15"
                        aria-label="Close ticket details"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400">
                          {formatMyBetDate(selectedMyBet.created_at || selectedMyBet.placed_at || selectedMyBet.updated_at)}
                        </p>
                        <p className="mt-1 text-xs font-black uppercase text-[#071b34]">
                          {selectedMyBet.bet_type || "Bet"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                        ticketStatus === "WON"
                          ? "bg-green-100 text-green-700"
                          : ticketStatus === "LOST"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      }`}>
                        {ticketStatus}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        ["Total Stake", `GHS ${ticketStake.toFixed(2)}`],
                        ["Total Odds", ticketOdds > 0 ? ticketOdds.toFixed(2) : "-"],
                        ["Pot. Win", `GHS ${ticketPotentialWin.toFixed(2)}`],
                        ["Total Return", ticketIsSettled ? `GHS ${ticketReturn.toFixed(2)}` : "--"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-gray-50 p-3.5">
                          <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">{label}</p>
                          <p className="mt-1 text-sm font-black text-[#071b34]">{value}</p>
                        </div>
                      ))}
                    </div>

                    {ticketIsSettled && (
                      <div className={`mt-4 rounded-2xl border p-4 ${
                        ticketResult === "WON"
                          ? "border-green-200 bg-green-50"
                          : ticketResult === "LOST"
                            ? "border-red-200 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-500">Settlement Result</p>
                            <p className={`mt-1 text-lg font-black ${
                              ticketResult === "WON" ? "text-green-700" : ticketResult === "LOST" ? "text-red-700" : "text-gray-700"
                            }`}>
                              {ticketResult}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">Return</p>
                            <p className="mt-1 text-sm font-black text-[#071b34]">GHS {ticketReturn.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl border border-[#f5b400]/40 bg-[#fffaf0] p-4">
                      <p className="text-center text-[9px] font-black uppercase tracking-[0.18em] text-gray-500">Booking Code</p>
                      <p className="mt-2 break-all text-center text-xl font-black tracking-[0.12em] text-[#071b34]">
                        {ticketReference || "-"}
                      </p>
                      {ticketReference && (
                        <div className="mt-3 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void copyMyBetBookingCode(ticketReference)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black text-[#071b34]"
                          >
                            ⧉ Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => void shareMyBetBookingCode(ticketReference)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black text-[#071b34]"
                          >
                            ↗ Share
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#071b34]">Selections</h3>
                        <span className="text-[10px] font-bold text-gray-400">
                          {ticketSelections.length} selection{ticketSelections.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-3">
                        {ticketSelections.length > 0 ? ticketSelections.map((selection: BetRecord, index: number) => (
                          <div key={String(selection.id ?? index)} className="rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">Game ID</p>
                                <p className="mt-1 break-all text-[10px] font-bold text-gray-600">{String(selection.match_id ?? selection.matchId ?? "-")}</p>
                              </div>
                              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[9px] font-black text-gray-600">
                                {String(selection.result || "pending").toUpperCase()}
                              </span>
                            </div>

                            <p className="mt-3 text-xs font-black text-[#071b34]">
                              {selection.home_team || selection.homeTeam || "Home"}
                              <span className="px-1.5 text-gray-400">vs</span>
                              {selection.away_team || selection.awayTeam || "Away"}
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-gray-100 pt-3">
                              <div>
                                <p className="text-[9px] uppercase tracking-wide text-gray-400">Pick</p>
                                <p className="mt-1 text-[10px] font-black text-gray-800">{selection.selection || selection.outcome || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-wide text-gray-400">Market</p>
                                <p className="mt-1 text-[10px] font-black text-gray-800">{selection.market || "-"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-wide text-gray-400">Odds</p>
                                <p className="mt-1 text-[10px] font-black text-gray-800">{Number(selection.odds ?? selection.price ?? 0) > 0 ? Number(selection.odds ?? selection.price).toFixed(2) : "-"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-wide text-gray-400">Result</p>
                                <p className={`mt-1 text-[10px] font-black ${
                                  ticketIsSettled && String(selection.match_result_status || selection.result || "pending").toLowerCase() === "won"
                                    ? "text-green-600"
                                    : ticketIsSettled && String(selection.match_result_status || selection.result || "pending").toLowerCase() === "lost"
                                      ? "text-red-600"
                                      : "text-gray-700"
                                }`}>
                                  {ticketIsSettled
                                    ? String(selection.match_result_status || selection.result || "pending").toUpperCase()
                                    : "PENDING"}
                                </p>
                              </div>
                            </div>

                            {ticketIsSettled && (selection.match_status || selection.home_score != null || selection.away_score != null) && (
                              <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-[10px] font-semibold text-gray-500">
                                Match status: {String(selection.match_status || "finished")}
                                {selection.home_score != null || selection.away_score != null
                                  ? ` · Final score ${selection.home_score ?? "-"}-${selection.away_score ?? "-"}`
                                  : ""}
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="rounded-xl bg-gray-50 p-4 text-center text-[10px] text-gray-500">
                            Selection details are not available for this ticket.
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMyBet(null)}
                      className="mt-5 w-full rounded-xl bg-[#f5b400] py-3 text-xs font-black text-[#071b34]"
                    >
                      Close Ticket
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* BET SUBMISSION SUCCESS */}
      {betSubmission && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 p-4"
          onClick={() => setBetSubmission(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-[#071b34] px-6 py-7 text-white sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5b400] text-2xl font-black text-[#071b34]">
                ✓
              </div>

              <h2 className="mt-4 text-center text-2xl font-black">
                Submission Successful
              </h2>

              <p className="mt-2 text-center text-xs font-medium leading-5 text-slate-300">
                Your bet has been accepted and your booking code is ready.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Total Stake
                  </p>
                  <p className="mt-1 text-xl font-black text-[#071b34]">
                    {formatMoney(betSubmission.stake)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Potential Win
                  </p>
                  <p className="mt-1 text-xl font-black text-[#071b34]">
                    {formatMoney(betSubmission.potential_return)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#f5b400]/40 bg-[#fffaf0] p-5">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Booking Code
                </p>

                <p className="mt-2 text-center text-2xl font-black tracking-[0.16em] text-[#071b34]">
                  {betSubmission.bet_reference}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={copyBetBookingCode}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-[#071b34] shadow-sm transition hover:bg-slate-50"
                  >
                    <span aria-hidden="true">⧉</span>
                    {betSubmissionCopied ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={shareBetBookingCode}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-[#071b34] shadow-sm transition hover:bg-slate-50"
                  >
                    <span aria-hidden="true">↗</span>
                    {betSubmissionShared ? "Shared" : "Share"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBetSubmission(null)}
                className="mt-5 w-full rounded-xl bg-[#f5b400] py-3.5 text-sm font-black text-[#071b34] transition hover:bg-[#ffc62b]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN / REGISTER MODAL */}
      {authMode && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!authSubmitting) {
              setAuthMode(null);
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="bg-[#071b34] px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5b400]">
                    BETZONE
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {authMode ===
                    "login"
                      ? "Welcome back"
                      : "Create your account"}
                  </h2>
                </div>

                <button
                  disabled={
                    authSubmitting
                  }
                  onClick={() =>
                    setAuthMode(null)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/70 transition hover:bg-white/20 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={
                handleAuthSubmit
              }
              className="p-6"
            >
              {authError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {authError}
                </div>
              )}

              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={
                  authSubmitting
                }
                className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-[#071b34]"
              />

              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your password"
                autoComplete={
                  authMode ===
                  "login"
                    ? "current-password"
                    : "new-password"
                }
                required
                minLength={6}
                disabled={
                  authSubmitting
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-[#071b34]"
              />

              <button
                type="submit"
                disabled={
                  authSubmitting
                }
                className="mt-5 w-full rounded-xl bg-[#f5b400] py-3.5 text-sm font-black text-[#071b34] transition hover:bg-[#ffc62b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {authSubmitting
                  ? "Please wait..."
                  : authMode ===
                      "login"
                    ? "Login"
                    : "Create Account"}
              </button>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  disabled={
                    authSubmitting
                  }
                  onClick={() => {
                    setAuthError("");

                    setAuthMode(
                      authMode ===
                        "login"
                        ? "register"
                        : "login",
                    );
                  }}
                  className="text-xs font-bold text-gray-500 transition hover:text-[#071b34]"
                >
                  {authMode ===
                  "login"
                    ? "Don't have an account? Register"
                    : "Already have an account? Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
