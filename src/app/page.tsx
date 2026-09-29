/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
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

type CurrentUser = {
  id: string;
  email: string;
  role: string;
};

type Wallet = {
  id: string | null;
  balance: string | number;
};

const API_URL = "http://localhost:4000";
const TOKEN_KEY = "betzone_access_token";
const USER_KEY = "betzone_user";

export default function Home() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState("football");

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");

  const [matches, setMatches] = useState<Match[]>([]);
  const [odds, setOdds] = useState<Odd[]>([]);

  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  const [betType, setBetType] = useState<
    "single" | "accumulator"
  >("single");
  const [stake, setStake] = useState("");

  const [loadingSports, setLoadingSports] = useState(true);
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
    useState<any | null>(null);
  const [loadBetError, setLoadBetError] =
    useState("");
  const [loadBetSuccess, setLoadBetSuccess] =
    useState("");

  // AUTH
  const [user, setUser] =
    useState<CurrentUser | null>(null);
  const [wallet, setWallet] =
    useState<Wallet | null>(null);
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
        setLoadingSports(true);
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
        setLoadingSports(false);
      }
    }

    loadSports();
  }, []);

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

  const playableMatches = useMemo(
    () => {
      return matches.filter(
        (match) => {
          const matchOdds =
            get1X2Odds(match);

          return (
            matchOdds.home !==
              null ||
            matchOdds.draw !==
              null ||
            matchOdds.away !==
              null
          );
        },
      );
    },
    [matches, oddsByMatch],
  );

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
        market:
          odd.sports_markets
            ?.market_key ??
          odd.market,
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

    const token =
      localStorage.getItem(
        TOKEN_KEY,
      );

    if (!token) {
      setAuthError("");
      setAuthMode("login");
      return;
    }

    setBetSubmitting(true);

    try {
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
              selections:
                betSlip.map(
                  (selection) => ({
                    odd_id:
                      selection.oddId,
                    match_id:
                      selection.matchId,
                    market:
                      selection.market,
                    selection:
                      selection.selection,
                  }),
                ),
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

      setBetSuccess(
        data?.bet_reference
          ? `Bet ${data.bet_reference} placed successfully.`
          : "Your bet was placed successfully.",
      );

      setBetSlip([]);
      setStake("");
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

  function addLoadedBetToBetslip(betToLoad: any = loadedBet): boolean {
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
          currentOdd?.sports_markets?.market_key ??
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
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
          {loadingSports ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Loading sports...
            </div>
          ) : (
            sports.map(
              (sport) => (
                <button
                  key={sport.id}
                  onClick={() =>
                    setSelectedSport(
                      sport.sport_key,
                    )
                  }
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${
                    selectedSport ===
                    sport.sport_key
                      ? "border-[#071b34] bg-[#071b34] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {sport.sport_name}
                </button>
              ),
            )
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
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

              {leagues.length > 0 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {leagues.map(
                    (league) => (
                      <button
                        key={league.id}
                        onClick={() =>
                          setSelectedLeague(
                            league.id,
                          )
                        }
                        className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition ${
                          selectedLeague ===
                          league.id
                            ? "bg-[#071b34] text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {league.name}
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  No leagues available yet.
                </p>
              )}
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
        <aside className="h-fit rounded-2xl bg-white shadow-sm lg:sticky lg:top-20">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  Bet Slip
                </h2>

                <p className="text-xs text-gray-500">
                  {betSlip.length}{" "}
                  {betSlip.length ===
                  1
                    ? "selection"
                    : "selections"}
                </p>
              </div>

              {betSlip.length >
                0 && (
                <button
                  onClick={
                    clearBetSlip
                  }
                  disabled={
                    betSubmitting
                  }
                  className="text-xs font-bold text-red-500 transition hover:text-red-700 disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            {betSlip.length ===
            0 ? (
              <div>
                {betSuccess && (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-bold text-green-700">
                      {betSuccess}
                    </p>
                  </div>
                )}

                {betError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">
                      {betError}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-400">
                    +
                  </div>

                  <p className="mt-3 text-sm font-bold text-gray-500">
                    Your bet slip is empty
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Select an odd to add it to your bet slip.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {betError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">
                      {betError}
                    </p>
                  </div>
                )}

                {betSuccess && (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-bold text-green-700">
                      {betSuccess}
                    </p>
                  </div>
                )}

                <div className="mb-4 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => {
                      setBetType(
                        "single",
                      );
                      setBetError("");
                      setBetSuccess("");
                    }}
                    disabled={
                      betSubmitting
                    }
                    className={`rounded-lg py-2.5 text-xs font-black transition ${
                      betType ===
                      "single"
                        ? "bg-white text-[#071b34] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    } disabled:opacity-50`}
                  >
                    Singles
                  </button>

                  <button
                    onClick={() => {
                      setBetType(
                        "accumulator",
                      );
                      setBetError("");
                      setBetSuccess("");
                    }}
                    disabled={
                      betSubmitting
                    }
                    className={`rounded-lg py-2.5 text-xs font-black transition ${
                      betType ===
                      "accumulator"
                        ? "bg-white text-[#071b34] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    } disabled:opacity-50`}
                  >
                    Accumulator
                  </button>
                </div>

                {betType ===
                  "accumulator" &&
                  betSlip.length <
                    2 && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-700">
                      Add at least two selections to create an accumulator.
                    </div>
                  )}

                <div className="space-y-3">
                  {betSlip.map(
                    (
                      selection,
                      index,
                    ) => (
                      <div
                        key={
                          selection.oddId
                        }
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#071b34] text-[9px] font-black text-white">
                                {index +
                                  1}
                              </span>

                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                Selection
                              </span>
                            </div>

                            <p className="truncate text-xs font-black text-gray-900">
                              {
                                selection.homeTeam
                              }
                            </p>

                            <p className="truncate text-xs font-black text-gray-900">
                              {
                                selection.awayTeam
                              }
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-gray-600 shadow-sm">
                                {
                                  selection.selection
                                }
                              </span>

                              <span className="text-xs text-gray-400">
                                {selection.odds.toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              removeBet(
                                selection.oddId,
                              )
                            }
                            disabled={
                              betSubmitting
                            }
                            className="shrink-0 text-lg leading-none text-gray-400 transition hover:text-red-500 disabled:opacity-50"
                            aria-label="Remove selection"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="stake"
                    className="mb-2 block text-xs font-black uppercase tracking-wide text-gray-500"
                  >
                    Stake
                  </label>

                  <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-[#071b34]">
                    <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-500">
                      GHS
                    </span>

                    <input
                      id="stake"
                      type="number"
                      min="0"
                      step="0.01"
                      value={stake}
                      onChange={(
                        event,
                      ) => {
                        setStake(
                          event.target
                            .value,
                        );
                        setBetError("");
                        setBetSuccess("");
                      }}
                      placeholder="0.00"
                      disabled={
                        betSubmitting
                      }
                      className="min-w-0 flex-1 px-3 py-3 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-300 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Bet type
                    </span>

                    <span className="font-bold capitalize text-gray-900">
                      {betType}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Total odds
                    </span>

                    <span className="font-black text-gray-900">
                      {combinedOdds >
                      0
                        ? combinedOdds.toFixed(
                            2,
                          )
                        : "0.00"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
                    <span className="font-semibold text-gray-600">
                      Potential payout
                    </span>

                    <span className="font-black text-[#071b34]">
                      GHS{" "}
                      {potentialPayout >
                      0
                        ? potentialPayout.toFixed(
                            2,
                          )
                        : "0.00"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handlePlaceBet
                  }
                  disabled={
                    betSubmitting ||
                    betSlip.length ===
                      0 ||
                    (betType ===
                      "accumulator" &&
                      betSlip.length <
                        2) ||
                    !Number.isFinite(
                      numericStake,
                    ) ||
                    numericStake <= 0
                  }
                  className="mt-4 w-full rounded-xl bg-[#f5b400] py-3.5 text-sm font-black text-[#071b34] transition hover:bg-[#ffc62b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {betSubmitting
                    ? "Placing bet..."
                    : "Continue"}
                </button>

                <p className="mt-3 text-center text-[10px] leading-4 text-gray-400">
                  Final odds and payout will be validated by the BETZONE server before a bet is placed.
                </p>
              </>
            )}
          </div>
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
                    Enter a bet reference to load another customer's selections into your betslip.
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
                        (item: any, index: number) => {
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
                    onClick={addLoadedBetToBetslip}
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