"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */

import { Fragment, useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type AdminSection =
  | "dashboard"
  | "bets"
  | "settlement"
  | "matches"
  | "match-management"
  | "deposits"
  | "withdrawals"
  | "users"
  | "wallet"
  | "platform-settings"
  | "admin-security";

type BetSelection = {
  id: string;
  match_id?: string;
  selection?: string;
  odds?: number | string;
  market?: string;
  line?: number | string | null;
  result?: string | null;
  status?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  kickoff_at?: string | null;
  match_status?: string | null;
  result_status?: string | null;
  matches?: {
    home_team?: string | null;
    away_team?: string | null;
    kickoff_at?: string | null;
    status?: string | null;
    result_status?: string | null;
  } | null;
  match?: {
    home_team?: string | null;
    away_team?: string | null;
    kickoff_at?: string | null;
    status?: string | null;
    result_status?: string | null;
  } | null;
};

type Bet = {
  id: string;
  user_id?: string;
  bet_reference?: string | null;
  bet_type?: string | null;
  stake?: number | string | null;
  total_odds?: number | string | null;
  potential_win?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  bet_selections?: BetSelection[];
};

type AdminMatch = {
  id: string;
  sport_key?: string | null;
  league_id?: string | null;
  home_team: string;
  away_team: string;
  kickoff_at?: string | null;
  status?: string | null;
  result_status?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  sports_leagues?: {
    id?: string | null;
    name?: string | null;
    country?: string | null;
    sport?: string | null;
  } | null;
};

type Sport = {
  id?: string;
  sport_key: string;
  sport_name: string;
  is_active?: boolean;
  sort_order?: number;
};

type League = {
  id: string;
  name: string;
  country?: string | null;
  sport?: string | null;
  is_active?: boolean;
};

type Market = {
  id?: string;
  market_key: string;
  market_name: string;
  market_group?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

type OddForm = {
  id: string;
  selection: string;
  odds: string;
  line: string;
};

type MarketForm = {
  market: Market;
  selections: OddForm[];
};

type EditableMatchOdd = {
  id: string;
  market_key: string;
  selection: string;
  odds: string;
  line: string;
  sort_order: number;
};

type SettlementResult = "won" | "lost" | "void";

type AdminDeposit = {
  id: string;
  user_id?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
  reference?: string | null;
  status?: string | null;
  created_at?: string | null;
  users?: {
    email?: string | null;
    profiles?: {
      full_name?: string | null;
      phone?: string | null;
      account_type?: string | null;
      status?: string | null;
      created_at?: string | null;
    } | null;
  } | null;
  profiles?: {
    full_name?: string | null;
    phone?: string | null;
  } | null;
};

type AdminWithdrawal = {
  id: string;
  user_id?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
  phone_number?: string | null;
  account_name?: string | null;
  status?: string | null;
  created_at?: string | null;
  users?: {
    email?: string | null;
    profiles?: {
      full_name?: string | null;
      phone?: string | null;
      account_type?: string | null;
      status?: string | null;
      created_at?: string | null;
    } | null;
  } | null;
};

type AdminUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  full_name?: string | null;
  account_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  profiles?: {
    full_name?: string | null;
    phone?: string | null;
    account_type?: string | null;
    status?: string | null;
    created_at?: string | null;
  } | null;
};

type AdminWallet = {
  id: string;
  user_id: string;
  balance?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  users?: {
    email?: string | null;
    profiles?: {
      full_name?: string | null;
      phone?: string | null;
      account_type?: string | null;
      status?: string | null;
    } | null;
  } | null;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const directKeys = [
    "access_token",
    "accessToken",
    "supabase_access_token",
    "betzone_access_token",
  ];

  for (const key of directKeys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);

    if (
      !key ||
      !key.startsWith("sb-") ||
      !key.endsWith("-auth-token")
    ) {
      continue;
    }

    try {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (parsed?.access_token) {
        return parsed.access_token;
      }

      if (parsed?.currentSession?.access_token) {
        return parsed.currentSession.access_token;
      }
    } catch {}
  }

  return null;
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

function formatMoney(value: unknown) {
  const number = Number(value || 0);

  return number.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function getErrorMessage(
  data: any,
  fallback: string,
) {
  return (
    data?.message ||
    data?.error ||
    fallback
  );
}

function getDefaultSelections(
  marketKey: string,
  homeTeam: string,
  awayTeam: string,
): string[] {
  const key = marketKey.toLowerCase();

  if (
    key === "1x2" ||
    key === "h2h"
  ) {
    return [
      homeTeam || "Home",
      "Draw",
      awayTeam || "Away",
    ];
  }

  if (key === "double-chance") {
    return [
      "1X",
      "12",
      "X2",
    ];
  }

  if (key === "draw-no-bet") {
    return [
      homeTeam || "Home",
      awayTeam || "Away",
    ];
  }

  if (
    key === "ou" ||
    key === "total-goals" ||
    key === "first-half-ou"
  ) {
    return [
      "Over",
      "Under",
    ];
  }

  if (
    key === "gg-ng" ||
    key === "gg_ng"
  ) {
    return [
      "GG",
      "NG",
    ];
  }

  if (key === "first-half-1x2") {
    return [
      "Home",
      "Draw",
      "Away",
    ];
  }

  if (
    key === "ht-ft" ||
    key === "half-time-full-time"
  ) {
    return [
      "Home/Home",
      "Home/Draw",
      "Home/Away",
      "Draw/Home",
      "Draw/Draw",
      "Draw/Away",
      "Away/Home",
      "Away/Draw",
      "Away/Away",
    ];
  }

  if (
    key.includes("handicap") ||
    key === "ah"
  ) {
    return [
      homeTeam || "Home",
      awayTeam || "Away",
    ];
  }

  if (
    key === "home-ou" ||
    key === "away-ou"
  ) {
    return [
      "Over",
      "Under",
    ];
  }

  if (key === "correct-score") {
    return [
      "0-0",
      "1-0",
      "0-1",
      "1-1",
      "2-0",
      "0-2",
      "2-1",
      "1-2",
      "2-2",
      "3-0",
      "0-3",
      "3-1",
      "1-3",
      "3-2",
      "2-3",
      "3-3",
      "Other",
    ];
  }

  if (
    key === "first-team-score" ||
    key === "last-team-score"
  ) {
    return [
      homeTeam || "Home",
      awayTeam || "Away",
      "Neither",
    ];
  }

  if (key === "odd-even") {
    return [
      "Odd",
      "Even",
    ];
  }

  if (key === "win-to-nil") {
    return [
      `${homeTeam || "Home"} Win to Nil`,
      `${awayTeam || "Away"} Win to Nil`,
      "No",
    ];
  }

  if (key === "clean-sheet") {
    return [
      `${homeTeam || "Home"} Clean Sheet`,
      `${awayTeam || "Away"} Clean Sheet`,
    ];
  }

  if (key === "gg-ng-result") {
    return [
      "GG & Over",
      "GG & Under",
      "NG & Over",
      "NG & Under",
    ];
  }

  if (key === "ou-result") {
    return [
      "Home & Over",
      "Home & Under",
      "Draw & Over",
      "Draw & Under",
      "Away & Over",
      "Away & Under",
    ];
  }

  return [
    "Yes",
    "No",
  ];
}

function marketNeedsLine(
  marketKey: string,
) {
  const key = marketKey.toLowerCase();

  return (
    key.includes("ou") ||
    key.includes("over") ||
    key.includes("under") ||
    key.includes("handicap") ||
    key === "ah" ||
    key === "asian-handicap"
  );
}

function getGroupLabel(
  market: Market,
) {
  return (
    market.market_group ||
    "Other Markets"
  );
}

export default function AdminPage() {
  const [section, setSection] =
    useState<AdminSection>("dashboard");

  // Platform Settings — interface state. Backend persistence and enforcement
  // will be connected after this admin UI is in place.
  const [platformName, setPlatformName] = useState("BETZONE");
  const [platformCurrency, setPlatformCurrency] = useState("GHS");
  const [platformTimezone, setPlatformTimezone] = useState("Africa/Accra");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [minimumStake, setMinimumStake] = useState("1");
  const [maximumStake, setMaximumStake] = useState("10000");
  const [maximumPayout, setMaximumPayout] = useState("100000");
  const [minimumDeposit, setMinimumDeposit] = useState("1");
  const [maximumDeposit, setMaximumDeposit] = useState("10000");
  const [minimumWithdrawal, setMinimumWithdrawal] = useState("1");
  const [maximumWithdrawal, setMaximumWithdrawal] = useState("10000");
  const [bettingEnabled, setBettingEnabled] = useState(true);
  const [singleBetsEnabled, setSingleBetsEnabled] = useState(true);
  const [accumulatorBetsEnabled, setAccumulatorBetsEnabled] = useState(true);
  const [depositsEnabled, setDepositsEnabled] = useState(true);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [manualDepositEnabled, setManualDepositEnabled] = useState(true);
  const [manualDepositProvider, setManualDepositProvider] = useState("MTN Mobile Money");
  const [manualDepositAccountName, setManualDepositAccountName] = useState("BETZONE");
  const [manualDepositPhoneNumber, setManualDepositPhoneNumber] = useState("");
  const [manualDepositInstructions, setManualDepositInstructions] = useState(
    "Send your deposit to the BETZONE Mobile Money number shown above, then enter the exact Mobile Money transaction ID.",
  );

  const [platformSettingsLoading, setPlatformSettingsLoading] =
    useState(false);

  const [savingPlatformSettings, setSavingPlatformSettings] =
    useState(false);

  const [platformSettingsError, setPlatformSettingsError] =
    useState("");

  const [platformSettingsMessage, setPlatformSettingsMessage] =
    useState("");

  const [platformSettingsLastLoaded, setPlatformSettingsLastLoaded] =
    useState<string | null>(null);

  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [securityMessage, setSecurityMessage] = useState("");

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardData, setDashboardData] =
    useState<any>(null);

  const [bets, setBets] =
    useState<Bet[]>([]);

  const [betsLoading, setBetsLoading] =
    useState(true);

  const [betsError, setBetsError] =
    useState("");

  const [betSearch, setBetSearch] =
    useState("");

  const [betStatusFilter, setBetStatusFilter] =
    useState("all");

  const [expandedBet, setExpandedBet] =
    useState<string | null>(null);

  const [selectedBet, setSelectedBet] =
    useState<Bet | null>(null);

  const [settlementResults, setSettlementResults] =
    useState<Record<string, SettlementResult>>({});

  const [settling, setSettling] =
    useState(false);

  const [settlementMessage, setSettlementMessage] =
    useState("");

  const [settlementError, setSettlementError] =
    useState("");

  const [matches, setMatches] =
    useState<AdminMatch[]>([]);

  const [matchesLoading, setMatchesLoading] =
    useState(true);

  const [matchesError, setMatchesError] =
    useState("");

  const [matchSearch, setMatchSearch] =
    useState("");

  const [matchManagementSportFilter, setMatchManagementSportFilter] =
    useState("all");

  const [settlementSportFilter, setSettlementSportFilter] =
    useState("all");

  const [selectedMatch, setSelectedMatch] =
    useState<AdminMatch | null>(null);

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [matchResultStatus, setMatchResultStatus] =
    useState("pending");

  const [savingMatchResult, setSavingMatchResult] =
    useState(false);

  const [deletingMatchId, setDeletingMatchId] =
    useState<string | null>(null);

  const [editingMatch, setEditingMatch] =
    useState<AdminMatch | null>(null);

  const [editingMatchOdds, setEditingMatchOdds] =
    useState<EditableMatchOdd[]>([]);

  const [editingMatchLoading, setEditingMatchLoading] =
    useState(false);

  const [savingMatchEdit, setSavingMatchEdit] =
    useState(false);

  const [editingMatchError, setEditingMatchError] =
    useState("");

  const [editingMatchMessage, setEditingMatchMessage] =
    useState("");

  const [sports, setSports] =
    useState<Sport[]>([]);

  const [leagues, setLeagues] =
    useState<League[]>([]);

  const [markets, setMarkets] =
    useState<Market[]>([]);

  const [selectedSport, setSelectedSport] =
    useState("");

  const [selectedLeague, setSelectedLeague] =
    useState("");

  const [selectedMarkets, setSelectedMarkets] =
    useState<string[]>([]);

  const [marketForms, setMarketForms] =
    useState<Record<string, MarketForm>>({});

  const [homeTeam, setHomeTeam] =
    useState("");

  const [awayTeam, setAwayTeam] =
    useState("");

  const [kickoffDate, setKickoffDate] =
    useState("");

  const [kickoffTime, setKickoffTime] =
    useState("");

  const [matchStep, setMatchStep] =
    useState(1);

  const [loadingSports, setLoadingSports] =
    useState(false);

  const [loadingLeagues, setLoadingLeagues] =
    useState(false);

  const [loadingMarkets, setLoadingMarkets] =
    useState(false);

  const [savingMatch, setSavingMatch] =
    useState(false);

  const [matchFormError, setMatchFormError] =
    useState("");

  const [matchFormSuccess, setMatchFormSuccess] =
    useState("");

  const [deposits, setDeposits] =
    useState<AdminDeposit[]>([]);

  const [depositsLoading, setDepositsLoading] =
    useState(true);

  const [depositsError, setDepositsError] =
    useState("");

  const [depositNote, setDepositNote] =
    useState("");

  const [withdrawals, setWithdrawals] =
    useState<AdminWithdrawal[]>([]);

  const [withdrawalsLoading, setWithdrawalsLoading] =
    useState(true);

  const [withdrawalsError, setWithdrawalsError] =
    useState("");

  const [withdrawalNote, setWithdrawalNote] =
    useState("");

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [usersLoading, setUsersLoading] =
    useState(true);

  const [usersError, setUsersError] =
    useState("");

  const [userSearch, setUserSearch] =
    useState("");

  const [wallets, setWallets] =
    useState<AdminWallet[]>([]);

  const [walletsLoading, setWalletsLoading] =
    useState(true);

  const [walletsError, setWalletsError] =
    useState("");

  const [walletSearch, setWalletSearch] =
    useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminUser | null>(null);

  const [customerDetailsLoading, setCustomerDetailsLoading] =
    useState(false);

  const [customerDetailsError, setCustomerDetailsError] =
    useState("");

  async function openCustomerDetails(
    customer: AdminUser,
  ) {
    const token = getAccessToken();

    if (!token) {
      setCustomerDetailsError(
        "Authentication required.",
      );
      return;
    }

    setSelectedCustomer(customer);
    setCustomerDetailsLoading(true);
    setCustomerDetailsError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        usersResponse,
        betsResponse,
        depositsResponse,
        withdrawalsResponse,
        walletsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers,
        }),
        fetch(`${API_URL}/admin/bets`, {
          headers,
        }),
        fetch(`${API_URL}/admin/deposits`, {
          headers,
        }),
        fetch(`${API_URL}/admin/withdrawals`, {
          headers,
        }),
        fetch(`${API_URL}/admin/wallets`, {
          headers,
        }),
      ]);

      const [
        usersData,
        betsData,
        depositsData,
        withdrawalsData,
        walletsData,
      ] = await Promise.all([
        usersResponse.json().catch(() => null),
        betsResponse.json().catch(() => null),
        depositsResponse.json().catch(() => null),
        withdrawalsResponse.json().catch(() => null),
        walletsResponse.json().catch(() => null),
      ]);

      if (!usersResponse.ok) {
        throw new Error(
          getErrorMessage(
            usersData,
            "Failed to load users.",
          ),
        );
      }

      if (!betsResponse.ok) {
        throw new Error(
          getErrorMessage(
            betsData,
            "Failed to load bets.",
          ),
        );
      }

      if (!depositsResponse.ok) {
        throw new Error(
          getErrorMessage(
            depositsData,
            "Failed to load deposits.",
          ),
        );
      }

      if (!withdrawalsResponse.ok) {
        throw new Error(
          getErrorMessage(
            withdrawalsData,
            "Failed to load withdrawals.",
          ),
        );
      }

      if (!walletsResponse.ok) {
        throw new Error(
          getErrorMessage(
            walletsData,
            "Failed to load wallets.",
          ),
        );
      }

      const usersArray = Array.isArray(usersData)
        ? usersData
        : Array.isArray(usersData?.data)
          ? usersData.data
          : [];

      const betsArray = Array.isArray(betsData)
        ? betsData
        : Array.isArray(betsData?.data)
          ? betsData.data
          : [];

      const depositsArray =
        Array.isArray(depositsData)
          ? depositsData
          : Array.isArray(depositsData?.data)
            ? depositsData.data
            : [];

      const withdrawalsArray =
        Array.isArray(withdrawalsData)
          ? withdrawalsData
          : Array.isArray(withdrawalsData?.data)
            ? withdrawalsData.data
            : [];

      const walletsArray =
        Array.isArray(walletsData)
          ? walletsData
          : Array.isArray(walletsData?.data)
            ? walletsData.data
            : [];

      setUsers(usersArray);
      setBets(betsArray);
      setDeposits(depositsArray);
      setWithdrawals(withdrawalsArray);
      setWallets(walletsArray);

      const refreshedCustomer =
        usersArray.find(
          (item: AdminUser) =>
            item.id === customer.id,
        );

      if (refreshedCustomer) {
        setSelectedCustomer(
          refreshedCustomer,
        );
      }
    } catch (error) {
      setCustomerDetailsError(
        error instanceof Error
          ? error.message
          : "Failed to load customer details.",
      );
    } finally {
      setCustomerDetailsLoading(false);
    }
  }

  function closeCustomerDetails() {
    setSelectedCustomer(null);
    setCustomerDetailsError("");
  }

  async function loadPlatformSettings() {
    const token = getAccessToken();

    if (!token) {
      setPlatformSettingsError(
        "Admin access token not found. Please log in again.",
      );
      return;
    }

    try {
      setPlatformSettingsLoading(true);
      setPlatformSettingsError("");

      const response = await fetch(
        `${API_URL}/admin/platform-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to load platform settings.",
          ),
        );
      }

      const settings = data?.data ?? data;

      if (!settings?.id) {
        throw new Error("Platform settings were not returned by the server.");
      }

      setPlatformName(String(settings.platform_name ?? "BETZONE"));
      setPlatformCurrency(String(settings.currency ?? "GHS"));
      setPlatformTimezone(String(settings.timezone ?? "Africa/Accra"));
      setSupportEmail(String(settings.support_email ?? ""));
      setSupportPhone(String(settings.support_phone ?? ""));
      setMinimumStake(String(settings.minimum_stake ?? "1"));
      setMaximumStake(String(settings.maximum_stake ?? "10000"));
      setMaximumPayout(String(settings.maximum_potential_payout ?? "100000"));
      setSingleBetsEnabled(Boolean(settings.single_bets_enabled));
      setAccumulatorBetsEnabled(Boolean(settings.accumulator_bets_enabled));
      setBettingEnabled(Boolean(settings.betting_enabled));
      setMinimumDeposit(String(settings.minimum_deposit ?? "1"));
      setMaximumDeposit(String(settings.maximum_deposit ?? "10000"));
      setMinimumWithdrawal(String(settings.minimum_withdrawal ?? "1"));
      setMaximumWithdrawal(String(settings.maximum_withdrawal ?? "10000"));
      setDepositsEnabled(Boolean(settings.deposits_enabled));
      setWithdrawalsEnabled(Boolean(settings.withdrawals_enabled));
      setMaintenanceMode(Boolean(settings.maintenance_mode));
      setManualDepositEnabled(Boolean(settings.manual_deposit_enabled));
      setManualDepositProvider(
        String(settings.manual_deposit_provider ?? "MTN Mobile Money"),
      );
      setManualDepositAccountName(
        String(settings.manual_deposit_account_name ?? "BETZONE"),
      );
      setManualDepositPhoneNumber(
        String(settings.manual_deposit_phone_number ?? ""),
      );
      setManualDepositInstructions(
        String(
          settings.manual_deposit_instructions ??
            "Send your deposit to the BETZONE Mobile Money number shown above, then enter the exact Mobile Money transaction ID.",
        ),
      );
      setPlatformSettingsLastLoaded(new Date().toISOString());
    } catch (error) {
      setPlatformSettingsError(
        error instanceof Error
          ? error.message
          : "Unable to load platform settings.",
      );
    } finally {
      setPlatformSettingsLoading(false);
    }
  }

  async function savePlatformSettings() {
    const token = getAccessToken();

    if (!token) {
      setPlatformSettingsError(
        "Admin access token not found. Please log in again.",
      );
      return;
    }

    if (!platformName.trim()) {
      setPlatformSettingsError("Platform name is required.");
      setPlatformSettingsMessage("");
      return;
    }

    if (!platformCurrency.trim()) {
      setPlatformSettingsError("Currency is required.");
      setPlatformSettingsMessage("");
      return;
    }

    if (!platformTimezone.trim()) {
      setPlatformSettingsError("Time zone is required.");
      setPlatformSettingsMessage("");
      return;
    }

    if (supportEmail.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(supportEmail.trim())) {
        setPlatformSettingsError("Support email is not valid.");
        setPlatformSettingsMessage("");
        return;
      }
    }

    const numericValues = [
      ["Minimum Stake", minimumStake],
      ["Maximum Stake", maximumStake],
      ["Maximum Payout", maximumPayout],
      ["Minimum Deposit", minimumDeposit],
      ["Maximum Deposit", maximumDeposit],
      ["Minimum Withdrawal", minimumWithdrawal],
      ["Maximum Withdrawal", maximumWithdrawal],
    ] as Array<[string, string]>;

    for (const [label, value] of numericValues) {
      if (value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
        setPlatformSettingsError(`${label} must be a valid non-negative amount.`);
        setPlatformSettingsMessage("");
        return;
      }
    }

    if (Number(minimumStake) > Number(maximumStake)) {
      setPlatformSettingsError("Minimum stake cannot be greater than maximum stake.");
      setPlatformSettingsMessage("");
      return;
    }

    if (Number(maximumPayout) < Number(maximumStake)) {
      setPlatformSettingsError("Maximum potential payout cannot be less than maximum stake.");
      setPlatformSettingsMessage("");
      return;
    }

    if (Number(minimumDeposit) > Number(maximumDeposit)) {
      setPlatformSettingsError("Minimum deposit cannot be greater than maximum deposit.");
      setPlatformSettingsMessage("");
      return;
    }

    if (Number(minimumWithdrawal) > Number(maximumWithdrawal)) {
      setPlatformSettingsError("Minimum withdrawal cannot be greater than maximum withdrawal.");
      setPlatformSettingsMessage("");
      return;
    }

    if (!manualDepositProvider.trim()) {
      setPlatformSettingsError("Manual deposit provider is required.");
      setPlatformSettingsMessage("");
      return;
    }

    if (!manualDepositAccountName.trim()) {
      setPlatformSettingsError("Manual deposit account name is required.");
      setPlatformSettingsMessage("");
      return;
    }

    if (!manualDepositPhoneNumber.trim()) {
      setPlatformSettingsError("Manual deposit Mobile Money number is required.");
      setPlatformSettingsMessage("");
      return;
    }

    if (!manualDepositInstructions.trim()) {
      setPlatformSettingsError("Manual deposit instructions are required.");
      setPlatformSettingsMessage("");
      return;
    }

    try {
      setSavingPlatformSettings(true);
      setPlatformSettingsError("");
      setPlatformSettingsMessage("");

      const response = await fetch(
        `${API_URL}/admin/platform-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            platform_name: platformName.trim(),
            currency: platformCurrency,
            timezone: platformTimezone,
            support_email: supportEmail.trim() || null,
            support_phone: supportPhone.trim() || null,
            minimum_stake: Number(minimumStake),
            maximum_stake: Number(maximumStake),
            maximum_potential_payout: Number(maximumPayout),
            single_bets_enabled: singleBetsEnabled,
            accumulator_bets_enabled: accumulatorBetsEnabled,
            betting_enabled: bettingEnabled,
            minimum_deposit: Number(minimumDeposit),
            maximum_deposit: Number(maximumDeposit),
            minimum_withdrawal: Number(minimumWithdrawal),
            maximum_withdrawal: Number(maximumWithdrawal),
            deposits_enabled: depositsEnabled,
            withdrawals_enabled: withdrawalsEnabled,
            maintenance_mode: maintenanceMode,
            manual_deposit_enabled: manualDepositEnabled,
            manual_deposit_provider: manualDepositProvider.trim(),
            manual_deposit_account_name: manualDepositAccountName.trim(),
            manual_deposit_phone_number: manualDepositPhoneNumber.trim(),
            manual_deposit_instructions: manualDepositInstructions.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to save platform settings.",
          ),
        );
      }

      const saved = data?.data ?? data;

      if (saved) {
        setPlatformName(String(saved.platform_name ?? platformName));
        setPlatformCurrency(String(saved.currency ?? platformCurrency));
        setPlatformTimezone(String(saved.timezone ?? platformTimezone));
        setSupportEmail(String(saved.support_email ?? ""));
        setSupportPhone(String(saved.support_phone ?? ""));
        setMinimumStake(String(saved.minimum_stake ?? minimumStake));
        setMaximumStake(String(saved.maximum_stake ?? maximumStake));
        setMaximumPayout(String(saved.maximum_potential_payout ?? maximumPayout));
        setSingleBetsEnabled(Boolean(saved.single_bets_enabled));
        setAccumulatorBetsEnabled(Boolean(saved.accumulator_bets_enabled));
        setBettingEnabled(Boolean(saved.betting_enabled));
        setMinimumDeposit(String(saved.minimum_deposit ?? minimumDeposit));
        setMaximumDeposit(String(saved.maximum_deposit ?? maximumDeposit));
        setMinimumWithdrawal(String(saved.minimum_withdrawal ?? minimumWithdrawal));
        setMaximumWithdrawal(String(saved.maximum_withdrawal ?? maximumWithdrawal));
        setDepositsEnabled(Boolean(saved.deposits_enabled));
        setWithdrawalsEnabled(Boolean(saved.withdrawals_enabled));
        setMaintenanceMode(Boolean(saved.maintenance_mode));
      }

      await loadPlatformSettings();
      setPlatformSettingsMessage("Platform settings saved successfully.");
    } catch (error) {
      setPlatformSettingsError(
        error instanceof Error
          ? error.message
          : "Unable to save platform settings.",
      );
    } finally {
      setSavingPlatformSettings(false);
    }
  }

  async function loadDashboard() {
    const token = getAccessToken();

    if (!token) {
      setDashboardLoading(false);
      return;
    }

    try {
      setDashboardLoading(true);

      const response = await fetch(
        `${API_URL}/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load dashboard.",
          ),
        );
      }

      setDashboardData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadBets() {
    const token = getAccessToken();

    if (!token) {
      setBetsError(
        "Authentication required.",
      );
      setBetsLoading(false);
      return;
    }

    try {
      setBetsLoading(true);
      setBetsError("");

      const response = await fetch(
        `${API_URL}/admin/bets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load bets.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setBets(array);
    } catch (error) {
      setBetsError(
        error instanceof Error
          ? error.message
          : "Failed to load bets.",
      );
    } finally {
      setBetsLoading(false);
    }
  }

  async function loadMatches() {
    const token = getAccessToken();

    if (!token) {
      setMatchesError(
        "Authentication required.",
      );
      setMatchesLoading(false);
      return;
    }

    try {
      setMatchesLoading(true);
      setMatchesError("");

      const response = await fetch(
        `${API_URL}/admin/matches`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load matches.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const normalizedMatches = array.map((match: AdminMatch) => ({
        ...match,
        sport_key:
          match.sport_key ||
          match.sports_leagues?.sport ||
          null,
        league_id:
          match.league_id ||
          match.sports_leagues?.id ||
          null,
      }));

      setMatches(normalizedMatches);
    } catch (error) {
      setMatchesError(
        error instanceof Error
          ? error.message
          : "Failed to load matches.",
      );
    } finally {
      setMatchesLoading(false);
    }
  }

  async function loadSports() {
    const token = getAccessToken();

    try {
      setLoadingSports(true);

      const response = await fetch(
        `${API_URL}/sports`,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined,
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load sports.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setSports(array);
    } catch (error) {
      setMatchFormError(
        error instanceof Error
          ? error.message
          : "Failed to load sports.",
      );
    } finally {
      setLoadingSports(false);
    }
  }

  async function loadLeagues(
    sportKey: string,
  ) {
    if (!sportKey) {
      setLeagues([]);
      return;
    }

    try {
      setLoadingLeagues(true);

      const response = await fetch(
        `${API_URL}/sports/${sportKey}/leagues`,
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load leagues.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setLeagues(array);
    } catch (error) {
      setMatchFormError(
        error instanceof Error
          ? error.message
          : "Failed to load leagues.",
      );
    } finally {
      setLoadingLeagues(false);
    }
  }

  async function loadMarkets() {
    try {
      setLoadingMarkets(true);

      const response = await fetch(
        `${API_URL}/sports/markets`,
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load markets.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setMarkets(array);
    } catch (error) {
      setMatchFormError(
        error instanceof Error
          ? error.message
          : "Failed to load markets.",
      );
    } finally {
      setLoadingMarkets(false);
    }
  }

  async function loadDeposits() {
    const token = getAccessToken();

    if (!token) {
      setDepositsError(
        "Authentication required.",
      );
      setDepositsLoading(false);
      return;
    }

    try {
      setDepositsLoading(true);
      setDepositsError("");

      const response = await fetch(
        `${API_URL}/admin/deposits`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load deposits.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setDeposits(array);
    } catch (error) {
      setDepositsError(
        error instanceof Error
          ? error.message
          : "Failed to load deposits.",
      );
    } finally {
      setDepositsLoading(false);
    }
  }

  async function processDeposit(
    id: string,
    action: "approve" | "reject",
  ) {
    const token = getAccessToken();

    if (!token) {
      setDepositsError(
        "Authentication required.",
      );
      return;
    }

    if (
      action === "reject" &&
      !depositNote.trim()
    ) {
      setDepositsError(
        "Admin note is required when rejecting a deposit.",
      );
      return;
    }

    const confirmed = window.confirm(
      `${action === "approve" ? "Approve" : "Reject"} this deposit request?`,
    );

    if (!confirmed) return;

    try {
      setDepositsError("");

      const response = await fetch(
        `${API_URL}/admin/deposits/${id}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: depositNote.trim() || undefined,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Failed to ${action} deposit.`,
          ),
        );
      }

      setDepositNote("");
      await loadDeposits();
    } catch (error) {
      setDepositsError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} deposit.`,
      );
    }
  }

  async function loadWithdrawals() {
    const token = getAccessToken();

    if (!token) {
      setWithdrawalsError(
        "Authentication required.",
      );
      setWithdrawalsLoading(false);
      return;
    }

    try {
      setWithdrawalsLoading(true);
      setWithdrawalsError("");

      const response = await fetch(
        `${API_URL}/admin/withdrawals`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load withdrawals.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setWithdrawals(array);
    } catch (error) {
      setWithdrawalsError(
        error instanceof Error
          ? error.message
          : "Failed to load withdrawals.",
      );
    } finally {
      setWithdrawalsLoading(false);
    }
  }

  async function processWithdrawal(
    id: string,
    action: "approve" | "reject",
  ) {
    const token = getAccessToken();

    if (!token) {
      setWithdrawalsError(
        "Authentication required.",
      );
      return;
    }

    if (
      action === "reject" &&
      !withdrawalNote.trim()
    ) {
      setWithdrawalsError(
        "Admin note is required when rejecting a withdrawal.",
      );
      return;
    }

    const confirmed = window.confirm(
      `${action === "approve" ? "Approve" : "Reject"} this withdrawal request?`,
    );

    if (!confirmed) return;

    try {
      setWithdrawalsError("");

      const response = await fetch(
        `${API_URL}/admin/withdrawals/${id}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: withdrawalNote.trim() || undefined,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Failed to ${action} withdrawal.`,
          ),
        );
      }

      setWithdrawalNote("");
      await loadWithdrawals();
    } catch (error) {
      setWithdrawalsError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} withdrawal.`,
      );
    }
  }

  async function loadUsers() {
    const token = getAccessToken();

    if (!token) {
      setUsersError(
        "Authentication required.",
      );
      setUsersLoading(false);
      return;
    }

    try {
      setUsersLoading(true);
      setUsersError("");

      const response = await fetch(
        `${API_URL}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load users.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setUsers(array);
    } catch (error) {
      setUsersError(
        error instanceof Error
          ? error.message
          : "Failed to load users.",
      );
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadWallets() {
    const token = getAccessToken();

    if (!token) {
      setWalletsError(
        "Authentication required.",
      );
      setWalletsLoading(false);
      return;
    }

    try {
      setWalletsLoading(true);
      setWalletsError("");

      const response = await fetch(
        `${API_URL}/admin/wallets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to load wallets.",
          ),
        );
      }

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setWallets(array);
    } catch (error) {
      setWalletsError(
        error instanceof Error
          ? error.message
          : "Failed to load wallets.",
      );
    } finally {
      setWalletsLoading(false);
    }
  }

  function openSettlement(
    bet: Bet,
  ) {
    const results: Record<
      string,
      SettlementResult
    > = {};

    (bet.bet_selections || []).forEach(
      (selection) => {
        const existing =
          selection.result?.toLowerCase();

        if (
          existing === "won" ||
          existing === "lost" ||
          existing === "void"
        ) {
          results[selection.id] =
            existing;
        }
      },
    );

    setSettlementResults(results);
    setSettlementError("");
    setSettlementMessage("");
    setSelectedBet(bet);
  }

  function closeSettlement() {
    if (settling) return;

    setSelectedBet(null);
    setSettlementResults({});
    setSettlementError("");
  }

  function setSelectionResult(
    selectionId: string,
    result: SettlementResult,
  ) {
    setSettlementResults(
      (current) => ({
        ...current,
        [selectionId]: result,
      }),
    );
  }

  async function settleSelectedBet() {
    if (!selectedBet) return;

    const selections =
      selectedBet.bet_selections || [];

    if (selections.length === 0) {
      setSettlementError(
        "This bet has no selections to settle.",
      );
      return;
    }

    const missing = selections.filter(
      (selection) =>
        !settlementResults[
          selection.id
        ],
    );

    if (missing.length > 0) {
      setSettlementError(
        "Please select won, lost or void for every selection.",
      );
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setSettlementError(
        "Authentication required.",
      );
      return;
    }

    try {
      setSettling(true);
      setSettlementError("");

      const results = selections.map(
        (selection) => ({
          selection_id: selection.id,
          result:
            settlementResults[
              selection.id
            ],
        }),
      );

      const response = await fetch(
        `${API_URL}/admin/bets/${selectedBet.id}/settle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            results,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to settle bet.",
          ),
        );
      }

      setSettlementMessage(
        "Bet settled successfully.",
      );

      setSelectedBet(null);
      setSettlementResults({});

      await loadBets();
    } catch (error) {
      setSettlementError(
        error instanceof Error
          ? error.message
          : "Failed to settle bet.",
      );
    } finally {
      setSettling(false);
    }
  }

  function openMatchResult(
    match: AdminMatch,
  ) {
    setSelectedMatch(match);
    setHomeScore(
      match.home_score == null
        ? ""
        : String(match.home_score),
    );
    setAwayScore(
      match.away_score == null
        ? ""
        : String(match.away_score),
    );
    setMatchResultStatus(
      match.result_status ||
        "pending",
    );
    setMatchesError("");
  }

  function closeMatchResult() {
    if (savingMatchResult) return;

    setSelectedMatch(null);
    setMatchesError("");
  }

  async function saveMatchResult() {
    if (!selectedMatch) return;

    const token = getAccessToken();

    if (!token) {
      setMatchesError(
        "Authentication required.",
      );
      return;
    }

    if (
      homeScore === "" ||
      awayScore === ""
    ) {
      setMatchesError(
        "Both home and away scores are required.",
      );
      return;
    }

    try {
      setSavingMatchResult(true);
      setMatchesError("");

      const response = await fetch(
        `${API_URL}/admin/matches/${selectedMatch.id}/result`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            home_score: Number(homeScore),
            away_score: Number(awayScore),
            result_status:
              matchResultStatus,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to save match result.",
          ),
        );
      }

      setMatches((current) =>
        current.map((match) =>
          match.id ===
          selectedMatch.id
            ? {
                ...match,
                home_score:
                  Number(homeScore),
                away_score:
                  Number(awayScore),
                result_status:
                  matchResultStatus,
                status:
                  matchResultStatus,
              }
            : match,
        ),
      );

      setSelectedMatch(null);
      setSettlementMessage(
        "Match result updated successfully.",
      );

      await loadMatches();
    } catch (error) {
      setMatchesError(
        error instanceof Error
          ? error.message
          : "Failed to save match result.",
      );
    } finally {
      setSavingMatchResult(false);
    }
  }

  function closeMatchEdit() {
    if (savingMatchEdit) return;

    setEditingMatch(null);
    setEditingMatchOdds([]);
    setEditingMatchError("");
    setEditingMatchMessage("");
  }

  async function openMatchEdit(match: AdminMatch) {
    const token = getAccessToken();

    if (!token) {
      setMatchesError("Authentication required.");
      return;
    }

    setEditingMatch(match);
    setEditingMatchOdds([]);
    setEditingMatchError("");
    setEditingMatchMessage("");
    setEditingMatchLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/admin/matches/${match.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to load match details.",
          ),
        );
      }

      const detail =
        data?.data ||
        data?.match ||
        data;

      let rawOdds =
        (Array.isArray(detail?.odds) && detail.odds) ||
        (Array.isArray(detail?.sports_odds) && detail.sports_odds) ||
        (Array.isArray(detail?.odds?.data) && detail.odds.data) ||
        [];

      /*
       * Admin matches return their sport through the
       * related sports_leagues record. Some match rows
       * do not have sport_key directly on the match object.
       * Always resolve the sport from every available source
       * before calling the real sportsbook markets endpoint.
       */
      const sportKey =
        match.sport_key ||
        detail?.sport_key ||
        detail?.sport ||
        detail?.sports_leagues?.sport ||
        match.sports_leagues?.sport ||
        "";

      const leagueId =
        match.league_id ||
        detail?.league_id ||
        detail?.sports_leagues?.id ||
        match.sports_leagues?.id ||
        "";

      if (rawOdds.length === 0 && sportKey && leagueId) {
        const oddsResponse = await fetch(
          `${API_URL}/sports/${encodeURIComponent(
            sportKey,
          )}/leagues/${encodeURIComponent(
            leagueId,
          )}/matches/${encodeURIComponent(
            match.id,
          )}/markets`,
        );

        const oddsData = await oddsResponse
          .json()
          .catch(() => null);

        if (!oddsResponse.ok) {
          throw new Error(
            getErrorMessage(
              oddsData,
              "Unable to load match odds.",
            ),
          );
        }

        rawOdds = Array.isArray(oddsData)
          ? oddsData
          : Array.isArray(oddsData?.data)
            ? oddsData.data
            : Array.isArray(oddsData?.odds)
              ? oddsData.odds
              : [];
      }

      const normalized = rawOdds.map(
        (odd: any, index: number) => ({
          id: String(odd?.id || `${match.id}-${index}`),
          market_key: String(
            odd?.market_key ||
              odd?.market ||
              odd?.market_type ||
              "1x2",
          ),
          selection: String(
            odd?.selection ||
              odd?.selection_name ||
              odd?.selectionName ||
              "",
          ),
          odds: String(
            odd?.odds ??
              odd?.odd ??
              "",
          ),
          line:
            odd?.line == null
              ? ""
              : String(odd.line),
          sort_order: Number(
            odd?.sort_order ?? index,
          ),
        }),
      );

      setEditingMatchOdds(normalized);

      if (normalized.length === 0) {
        setEditingMatchMessage(
          sportKey && leagueId
            ? "No active odds are currently published for this match."
            : "The match was loaded, but its sport or league could not be resolved for the odds request.",
        );
      }
    } catch (error) {
      setEditingMatchError(
        error instanceof Error
          ? error.message
          : "Unable to load match details.",
      );
    } finally {
      setEditingMatchLoading(false);
    }
  }

  function updateEditingOdd(
    index: number,
    field: keyof EditableMatchOdd,
    value: string,
  ) {
    setEditingMatchOdds((current) =>
      current.map((odd, oddIndex) =>
        oddIndex === index
          ? {
              ...odd,
              [field]: value,
            }
          : odd,
      ),
    );
  }

  async function saveMatchEdit() {
    if (!editingMatch) return;

    const token = getAccessToken();

    if (!token) {
      setEditingMatchError("Authentication required.");
      return;
    }

    if (editingMatchOdds.length === 0) {
      setEditingMatchError(
        "This match currently has no odds to save. Add odds from Match & Odds first.",
      );
      return;
    }

    for (const odd of editingMatchOdds) {
      const numericOdds = Number(odd.odds);

      if (!odd.selection.trim()) {
        setEditingMatchError(
          "Every odd must have a selection name.",
        );
        return;
      }

      if (!Number.isFinite(numericOdds) || numericOdds <= 1) {
        setEditingMatchError(
          `Enter valid odds greater than 1 for ${odd.selection || "the selection"}.`,
        );
        return;
      }

      if (odd.line !== "" && !Number.isFinite(Number(odd.line))) {
        setEditingMatchError(
          `Enter a valid line for ${odd.selection}.`,
        );
        return;
      }
    }

    try {
      setSavingMatchEdit(true);
      setEditingMatchError("");
      setEditingMatchMessage("");

      const response = await fetch(
        `${API_URL}/admin/matches/${editingMatch.id}/odds`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            odds: editingMatchOdds.map((odd) => ({
              market_key: odd.market_key,
              selection: odd.selection.trim(),
              odds: Number(odd.odds),
              line:
                odd.line === ""
                  ? null
                  : Number(odd.line),
              sort_order: odd.sort_order,
            })),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Unable to save match odds.",
          ),
        );
      }

      setEditingMatchMessage(
        "Match odds updated successfully.",
      );

      await loadMatches();
    } catch (error) {
      setEditingMatchError(
        error instanceof Error
          ? error.message
          : "Unable to save match odds.",
      );
    } finally {
      setSavingMatchEdit(false);
    }
  }

  async function deleteMatch(
    match: AdminMatch,
  ) {
    const confirmed = window.confirm(
      `Delete "${match.home_team} vs ${match.away_team}"?\n\nThis will permanently delete the match from BETZONE.`,
    );

    if (!confirmed) return;

    const token = getAccessToken();

    if (!token) {
      setMatchesError(
        "Authentication required.",
      );
      return;
    }

    try {
      setDeletingMatchId(match.id);
      setMatchesError("");

      const response = await fetch(
        `${API_URL}/admin/matches/${match.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete match.",
        );
      }

      setMatches((current) =>
        current.filter(
          (item) =>
            item.id !== match.id,
        ),
      );

      if (
        selectedMatch?.id ===
        match.id
      ) {
        closeMatchResult();
      }
    } catch (error) {
      setMatchesError(
        error instanceof Error
          ? error.message
          : "Failed to delete match.",
      );
    } finally {
      setDeletingMatchId(null);
    }
  }

  function clearMatchMessages() {
    setMatchFormError("");
    setMatchFormSuccess("");
  }

  function resetMatchForm() {
    setSelectedSport("");
    setSelectedLeague("");
    setLeagues([]);
    setSelectedMarkets([]);
    setMarketForms({});
    setHomeTeam("");
    setAwayTeam("");
    setKickoffDate("");
    setKickoffTime("");
    setMatchStep(1);
    clearMatchMessages();
  }

  function toggleMarket(
    market: Market,
  ) {
    setSelectedMarkets(
      (current) => {
        if (
          current.includes(
            market.market_key,
          )
        ) {
          return current.filter(
            (key) =>
              key !==
              market.market_key,
          );
        }

        return [
          ...current,
          market.market_key,
        ];
      },
    );

    setMarketForms((current) => {
      if (
        current[market.market_key]
      ) {
        return current;
      }

      const defaults =
        getDefaultSelections(
          market.market_key,
          homeTeam,
          awayTeam,
        );

      return {
        ...current,
        [market.market_key]: {
          market,
          selections:
            defaults.map(
              (selection) => ({
                id: makeId(),
                selection,
                odds: "",
                line: "",
              }),
            ),
        },
      };
    });
  }

  function selectAllMarkets() {
    const keys = markets.map(
      (market) =>
        market.market_key,
    );

    setSelectedMarkets(keys);

    setMarketForms(
      Object.fromEntries(
        markets.map((market) => [
          market.market_key,
          {
            market,
            selections:
              getDefaultSelections(
                market.market_key,
                homeTeam,
                awayTeam,
              ).map(
                (selection) => ({
                  id: makeId(),
                  selection,
                  odds: "",
                  line: "",
                }),
              ),
          },
        ]),
      ),
    );
  }

  function clearAllMarkets() {
    setSelectedMarkets([]);
    setMarketForms({});
  }

  function selectGroupMarkets(
    group: string,
  ) {
    const groupMarkets =
      markets.filter(
        (market) =>
          getGroupLabel(market) ===
          group,
      );

    const allSelected =
      groupMarkets.every(
        (market) =>
          selectedMarkets.includes(
            market.market_key,
          ),
      );

    if (allSelected) {
      setSelectedMarkets(
        (current) =>
          current.filter(
            (key) =>
              !groupMarkets.some(
                (market) =>
                  market.market_key ===
                  key,
              ),
          ),
      );

      setMarketForms(
        (current) => {
          const next = {
            ...current,
          };

          groupMarkets.forEach(
            (market) => {
              delete next[
                market.market_key
              ];
            },
          );

          return next;
        },
      );

      return;
    }

    groupMarkets.forEach(
      (market) => {
        if (
          !selectedMarkets.includes(
            market.market_key,
          )
        ) {
          toggleMarket(market);
        }
      },
    );
  }

  function isGroupSelected(
    group: string,
  ) {
    const groupMarkets =
      markets.filter(
        (market) =>
          getGroupLabel(market) ===
          group,
      );

    return (
      groupMarkets.length > 0 &&
      groupMarkets.every(
        (market) =>
          selectedMarkets.includes(
            market.market_key,
          ),
      )
    );
  }

  function continueToMarkets() {
    clearMatchMessages();

    if (!selectedSport) {
      setMatchFormError(
        "Please select a sport.",
      );
      return;
    }

    if (!selectedLeague) {
      setMatchFormError(
        "Please select a league.",
      );
      return;
    }

    if (!homeTeam.trim()) {
      setMatchFormError(
        "Please enter the home team.",
      );
      return;
    }

    if (!awayTeam.trim()) {
      setMatchFormError(
        "Please enter the away team.",
      );
      return;
    }

    if (!kickoffDate) {
      setMatchFormError(
        "Please select the kickoff date.",
      );
      return;
    }

    if (!kickoffTime) {
      setMatchFormError(
        "Please select the kickoff time.",
      );
      return;
    }

    setMatchStep(2);
  }

  function continueToOdds() {
    clearMatchMessages();

    if (
      selectedMarkets.length ===
      0
    ) {
      setMatchFormError(
        "Please select at least one market.",
      );
      return;
    }

    setMarketForms(
      (current) => {
        const next = {
          ...current,
        };

        selectedMarkets.forEach(
          (marketKey) => {
            if (!next[marketKey]) {
              const market =
                markets.find(
                  (item) =>
                    item.market_key ===
                    marketKey,
                );

              if (!market) return;

              next[marketKey] = {
                market,
                selections:
                  getDefaultSelections(
                    market.market_key,
                    homeTeam,
                    awayTeam,
                  ).map(
                    (selection) => ({
                      id: makeId(),
                      selection,
                      odds: "",
                      line: "",
                    }),
                  ),
              };
            }
          },
        );

        return next;
      },
    );

    setMatchStep(3);
  }

  function updateOdd(
    marketKey: string,
    oddId: string,
    field:
      | "selection"
      | "odds"
      | "line",
    value: string,
  ) {
    setMarketForms(
      (current) => ({
        ...current,
        [marketKey]: {
          ...current[marketKey],
          selections:
            current[
              marketKey
            ].selections.map(
              (odd) =>
                odd.id === oddId
                  ? {
                      ...odd,
                      [field]:
                        value,
                    }
                  : odd,
            ),
        },
      }),
    );
  }

  function addSelection(
    marketKey: string,
  ) {
    setMarketForms(
      (current) => ({
        ...current,
        [marketKey]: {
          ...current[marketKey],
          selections: [
            ...current[
              marketKey
            ].selections,
            {
              id: makeId(),
              selection: "",
              odds: "",
              line: "",
            },
          ],
        },
      }),
    );
  }

  function removeSelection(
    marketKey: string,
    oddId: string,
  ) {
    setMarketForms(
      (current) => ({
        ...current,
        [marketKey]: {
          ...current[marketKey],
          selections:
            current[
              marketKey
            ].selections.filter(
              (odd) =>
                odd.id !== oddId,
            ),
        },
      }),
    );
  }

  function validateOdds() {
    for (const marketKey of selectedMarkets) {
      const form =
        marketForms[marketKey];

      if (!form) {
        return `Market ${marketKey} is not configured.`;
      }

      if (
        form.selections.length === 0
      ) {
        return `Market ${marketKey} needs at least one selection.`;
      }

      for (const odd of form.selections) {
        if (!odd.selection.trim()) {
          return `Every selection must have a name in ${form.market.market_name}.`;
        }

        const odds =
          Number(odd.odds);

        if (
          !Number.isFinite(odds) ||
          odds < 1.01
        ) {
          return `Every odd must be at least 1.01 in ${form.market.market_name}.`;
        }

        if (
          marketNeedsLine(
            form.market.market_key,
          ) &&
          odd.line === ""
        ) {
          return `A line is required for ${form.market.market_name}.`;
        }
      }
    }

    return "";
  }

  async function createMatchAndOdds() {
    clearMatchMessages();

    const validation =
      validateOdds();

    if (validation) {
      setMatchFormError(
        validation,
      );
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setMatchFormError(
        "Authentication required.",
      );
      return;
    }

    try {
      setSavingMatch(true);

      const kickoffAt = new Date(
        `${kickoffDate}T${kickoffTime}`,
      );

      if (
        Number.isNaN(
          kickoffAt.getTime(),
        )
      ) {
        throw new Error(
          "Invalid kickoff date or time.",
        );
      }

      const matchResponse =
        await fetch(
          `${API_URL}/admin/matches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sport_key:
                selectedSport,
              league_id:
                selectedLeague,
              home_team:
                homeTeam.trim(),
              away_team:
                awayTeam.trim(),
              kickoff_at:
                kickoffAt.toISOString(),
              status:
                "scheduled",
            }),
          },
        );

      const matchData =
        await matchResponse
          .json()
          .catch(() => null);

      if (!matchResponse.ok) {
        throw new Error(
          getErrorMessage(
            matchData,
            "Failed to create match.",
          ),
        );
      }

      const createdMatch =
        matchData?.data ||
        matchData?.match ||
        matchData;

      if (!createdMatch?.id) {
        throw new Error(
          "Match was created but no match ID was returned.",
        );
      }

      const odds = selectedMarkets.flatMap(
        (marketKey) => {
          const form =
            marketForms[
              marketKey
            ];

          return form.selections.map(
            (odd) => ({
              market_key:
                form.market.market_key,
              selection:
                odd.selection.trim(),
              odds: Number(
                odd.odds,
              ),
              line:
                odd.line === ""
                  ? null
                  : Number(
                      odd.line,
                    ),
            }),
          );
        },
      );

      const oddsResponse =
        await fetch(
          `${API_URL}/admin/matches/${createdMatch.id}/odds`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              odds,
            }),
          },
        );

      const oddsData =
        await oddsResponse
          .json()
          .catch(() => null);

      if (!oddsResponse.ok) {
        throw new Error(
          getErrorMessage(
            oddsData,
            "Match was created but odds could not be published.",
          ),
        );
      }

      setMatchFormSuccess(
        "Match and odds created successfully.",
      );

      resetMatchForm();

      await loadMatches();
    } catch (error) {
      setMatchFormError(
        error instanceof Error
          ? error.message
          : "Failed to create match and odds.",
      );
    } finally {
      setSavingMatch(false);
    }
  }

  const filteredBets =
    useMemo(() => {
      const query =
        betSearch
          .trim()
          .toLowerCase();

      return bets.filter(
        (bet) => {
          const status =
            String(
              bet.status || "",
            ).toLowerCase();

          const matchesStatus =
            betStatusFilter ===
              "all" ||
            status ===
              betStatusFilter.toLowerCase();

          if (!matchesStatus) {
            return false;
          }

          if (!query) return true;

          return JSON.stringify(
            bet,
          )
            .toLowerCase()
            .includes(query);
        },
      );
    }, [
      bets,
      betSearch,
      betStatusFilter,
    ]);

  const openBets =
    bets.filter(
      (bet) =>
        bet.status?.toLowerCase() ===
        "open",
    ).length;

  const wonBets =
    bets.filter(
      (bet) =>
        bet.status?.toLowerCase() ===
        "won",
    ).length;

  const lostBets =
    bets.filter(
      (bet) =>
        bet.status?.toLowerCase() ===
        "lost",
    ).length;

  const voidBets =
    bets.filter(
      (bet) =>
        bet.status?.toLowerCase() ===
        "void",
    ).length;

  const filteredMatches =
    useMemo(() => {
      const query =
        matchSearch
          .trim()
          .toLowerCase();

      if (!query) return matches;

      return matches.filter(
        (match) =>
          match.home_team
            .toLowerCase()
            .includes(query) ||
          match.away_team
            .toLowerCase()
            .includes(query) ||
          match.sports_leagues?.name
            ?.toLowerCase()
            .includes(query),
      );
    }, [
      matches,
      matchSearch,
    ]);

  const managedMatches =
    useMemo(() => {
      const query =
        matchSearch
          .trim()
          .toLowerCase();

      return matches.filter((match) => {
        const sportMatches =
          matchManagementSportFilter === "all" ||
          String(match.sport_key || "").toLowerCase() ===
            matchManagementSportFilter.toLowerCase();

        if (!sportMatches) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          match.home_team
            .toLowerCase()
            .includes(query) ||
          match.away_team
            .toLowerCase()
            .includes(query) ||
          match.sports_leagues?.name
            ?.toLowerCase()
            .includes(query)
        );
      });
    }, [
      matches,
      matchSearch,
      matchManagementSportFilter,
    ]);

  const settlementMatches =
    useMemo(() => {
      const query =
        matchSearch
          .trim()
          .toLowerCase();

      return matches.filter((match) => {
        const sportMatches =
          settlementSportFilter === "all" ||
          String(match.sport_key || "").toLowerCase() ===
            settlementSportFilter.toLowerCase();

        if (!sportMatches) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          match.home_team
            .toLowerCase()
            .includes(query) ||
          match.away_team
            .toLowerCase()
            .includes(query) ||
          match.sports_leagues?.name
            ?.toLowerCase()
            .includes(query)
        );
      });
    }, [
      matches,
      matchSearch,
      settlementSportFilter,
    ]);

  const managementSports =
    useMemo(() => {
      const ordered = sports
        .filter((sport) => sport.is_active !== false)
        .sort(
          (a, b) =>
            Number(a.sort_order ?? 9999) -
            Number(b.sort_order ?? 9999),
        )
        .map((sport) => ({
          key: sport.sport_key.toLowerCase(),
          name: sport.sport_name,
        }));

      const known = new Set(
        ordered.map((sport) => sport.key),
      );

      matches.forEach((match) => {
        const key = String(
          match.sport_key || "",
        ).toLowerCase();

        if (key && !known.has(key)) {
          ordered.push({
            key,
            name: key
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase(),
              ),
          });

          known.add(key);
        }
      });

      return ordered;
    }, [sports, matches]);

  const marketGroups =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          Market[]
        >();

      markets.forEach(
        (market) => {
          const group =
            getGroupLabel(
              market,
            );

          if (
            !grouped.has(group)
          ) {
            grouped.set(
              group,
              [],
            );
          }

          grouped
            .get(group)!
            .push(market);
        },
      );

      return Array.from(
        grouped.entries(),
      );
    }, [markets]);

  function navigate(
    next: AdminSection,
  ) {
    setSection(next);

    // Every admin section is a page-level view. Always return the
    // viewport to the top when switching sections so a newly selected
    // page is immediately visible instead of opening at the previous
    // page's scroll position.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    if (next === "dashboard") {
      loadDashboard();
    }

    if (next === "bets") {
      loadBets();
    }

    if (next === "settlement") {
      loadBets();
      loadMatches();
    }

    if (next === "matches") {
      loadMatches();
      loadSports();
      loadMarkets();
    }

    if (next === "match-management") {
      loadMatches();
    }

    if (next === "deposits") {
      loadDeposits();
    }

    if (next === "withdrawals") {
      loadWithdrawals();
    }

    if (next === "users") {
      loadUsers();
    }

    if (next === "wallet") {
      loadWallets();
    }

    if (next === "platform-settings") {
      loadPlatformSettings();
    }
  }

  useEffect(() => {
    loadPlatformSettings();
    loadDashboard();
    loadBets();
    loadMatches();
    loadSports();
    loadMarkets();
    loadDeposits();
    loadWithdrawals();
    loadUsers();
    loadWallets();
  }, []);

  useEffect(() => {
    if (selectedSport) {
      loadLeagues(
        selectedSport,
      );
      setSelectedLeague("");
    } else {
      setLeagues([]);
      setSelectedLeague("");
    }
  }, [selectedSport]);

  const sectionTitle =
    section === "dashboard"
      ? "Dashboard"
      : section === "bets"
        ? "All Bets"
        : section === "settlement"
          ? "Settlement"
          : section === "matches"
            ? "Matches & Odds"
            : section === "match-management"
              ? "Matches"
              : section === "deposits"
              ? "Deposits"
              : section === "withdrawals"
                ? "Withdrawals"
                : section === "users"
                  ? "Users"
                  : section === "platform-settings"
                    ? "Platform Settings"
                    : section === "admin-security"
                      ? "Admin Security"
                      : "Wallet";

  const dashboardUsers =
    dashboardData?.users ??
    dashboardData?.total_users ??
    users.length;

  const dashboardWallets =
    dashboardData?.wallets ??
    dashboardData?.total_wallets ??
    wallets.length;

  const dashboardPendingDeposits =
    dashboardData?.pending_deposits ??
    deposits.filter(
      (item) =>
        String(
          item.status,
        ).toLowerCase() ===
        "pending",
    ).length;

  const dashboardPendingWithdrawals =
    dashboardData?.pending_withdrawals ??
    withdrawals.filter(
      (item) =>
        String(
          item.status,
        ).toLowerCase() ===
        "pending",
    ).length;

  const dashboardTotalBets =
    dashboardData?.total_bets ??
    bets.length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <aside className="w-full shrink-0 bg-[#071b34] text-white lg:w-64">
          <div className="sticky top-0 flex max-h-screen flex-col">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-2xl font-black tracking-tight">
                BETZONE
              </div>

              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#f5b400]">
                ADMIN CONTROL
              </div>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {[
                [
                  "dashboard",
                  "Dashboard",
                ],
                [
                  "bets",
                  "All Bets",
                ],
                [
                  "settlement",
                  "Settlement",
                ],
                [
                  "matches",
                  "Matches & Odds",
                ],
                [
                  "match-management",
                  "Matches",
                ],
                [
                  "wallet",
                  "Wallet",
                ],
                [
                  "deposits",
                  "Deposits",
                ],
                [
                  "withdrawals",
                  "Withdrawals",
                ],
                [
                  "users",
                  "Users",
                ],
                [
                  "platform-settings",
                  "Platform Settings",
                ],
                [
                  "admin-security",
                  "Admin Security",
                ],
              ].map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      navigate(
                        key as AdminSection,
                      )
                    }
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-black transition ${
                      section === key
                        ? "bg-[#f5b400] text-[#071b34]"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}

              <a
                href="/admin/audit-history"
                className="block w-full rounded-xl px-4 py-3 text-left text-sm font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Audit History
              </a>
            </nav>

            <div className="border-t border-white/10 p-3">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Database
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

                  <span className="text-sm font-bold text-white">
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b57e00]">
                  BETZONE ADMIN
                </div>

                <h1 className="mt-1 text-2xl font-black text-[#071b34]">
                  {sectionTitle}
                </h1>
              </div>

              <div className="hidden rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-500 sm:block">
                Protected Admin Area
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

            {/* ==================================================
                DASHBOARD
            ================================================== */}

            {section ===
              "dashboard" && (
              <div className="space-y-6">
                <div className="rounded-3xl bg-[#071b34] p-6 text-white sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                    CONTROL CENTER
                  </p>

                  <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                    BETZONE Administration
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Manage customers, bets,
                    settlement, sportsbook
                    matches, deposits,
                    withdrawals and wallet
                    information from one
                    protected administration
                    panel.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    [
                      "Users",
                      dashboardUsers,
                    ],
                    [
                      "Wallets",
                      dashboardWallets,
                    ],
                    [
                      "Pending Deposits",
                      dashboardPendingDeposits,
                    ],
                    [
                      "Pending Withdrawals",
                      dashboardPendingWithdrawals,
                    ],
                    [
                      "Total Bets",
                      dashboardTotalBets,
                    ],
                  ].map(
                    ([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {label}
                        </div>

                        <div className="mt-2 text-3xl font-black text-[#071b34]">
                          {dashboardLoading
                            ? "..."
                            : String(value)}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [
                      "All Bets",
                      "Review customer bets",
                      "bets",
                    ],
                    [
                      "Settlement",
                      "Update results and settle bets",
                      "settlement",
                    ],
                    [
                      "Matches & Odds",
                      "Create sportsbook markets",
                      "matches",
                    ],
                    [
                      "Deposits",
                      "Review deposit requests",
                      "deposits",
                    ],
                    [
                      "Withdrawals",
                      "Review withdrawal requests",
                      "withdrawals",
                    ],
                    [
                      "Users",
                      "Manage customers",
                      "users",
                    ],
                    [
                      "Wallets",
                      "View wallet balances",
                      "wallet",
                    ],
                  ].map(
                    ([
                      title,
                      description,
                      target,
                    ]) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() =>
                          navigate(
                            target as AdminSection,
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#f5b400] hover:shadow-md"
                      >
                        <div className="font-black text-[#071b34]">
                          {title}
                        </div>

                        <div className="mt-2 text-sm leading-5 text-slate-500">
                          {description}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* ==================================================
                ALL BETS
            ================================================== */}

            {section ===
              "bets" && (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [
                      "Open",
                      openBets,
                    ],
                    [
                      "Won",
                      wonBets,
                    ],
                    [
                      "Lost",
                      lostBets,
                    ],
                    [
                      "Void",
                      voidBets,
                    ],
                  ].map(
                    ([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {label}
                        </div>

                        <div className="mt-1 text-3xl font-black text-[#071b34]">
                          {value}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row">
                    <input
                      value={betSearch}
                      onChange={(event) =>
                        setBetSearch(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Search bet ID, reference, user..."
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                    />

                    <select
                      value={
                        betStatusFilter
                      }
                      onChange={(event) =>
                        setBetStatusFilter(
                          event.target
                            .value,
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none"
                    >
                      <option value="all">
                        All Statuses
                      </option>
                      <option value="open">
                        Open
                      </option>
                      <option value="won">
                        Won
                      </option>
                      <option value="lost">
                        Lost
                      </option>
                      <option value="void">
                        Void
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={
                        loadBets
                      }
                      className="rounded-xl bg-[#071b34] px-5 py-3 text-sm font-black text-white"
                    >
                      Refresh
                    </button>
                  </div>

                  {betsError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {betsError}
                    </div>
                  )}

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left">
                      <thead className="bg-[#071b34] text-xs uppercase tracking-wider text-white">
                        <tr>
                          <th className="px-4 py-3">
                            Bet
                          </th>
                          <th className="px-4 py-3">
                            User
                          </th>
                          <th className="px-4 py-3">
                            Type
                          </th>
                          <th className="px-4 py-3">
                            Stake
                          </th>
                          <th className="px-4 py-3">
                            Odds
                          </th>
                          <th className="px-4 py-3">
                            Status
                          </th>
                          <th className="px-4 py-3">
                            Created
                          </th>
                          <th className="px-4 py-3">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredBets.map((bet) => (
                          <Fragment key={bet.id}>
                            <tr
                              key={bet.id}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-4 py-4">
                                <div className="font-bold text-[#071b34]">
                                  {bet.bet_reference ||
                                    bet.id}
                                </div>

                                <div className="mt-1 text-[10px] text-slate-400">
                                  {bet.id}
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {bet.user_id ||
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {bet.bet_type ||
                                  "Bet"}
                              </td>

                              <td className="px-4 py-4 text-sm font-bold">
                                GH₵{" "}
                                {formatMoney(
                                  bet.stake,
                                )}
                              </td>

                              <td className="px-4 py-4 text-sm">
                                {formatMoney(
                                  bet.total_odds,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase">
                                  {bet.status ||
                                    "-"}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-xs text-slate-500">
                                {formatDate(
                                  bet.created_at,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedBet(
                                      expandedBet ===
                                        bet.id
                                        ? null
                                        : bet.id,
                                    )
                                  }
                                  className="rounded-lg bg-[#071b34] px-3 py-2 text-[10px] font-black text-white"
                                >
                                  {expandedBet ===
                                  bet.id
                                    ? "Hide"
                                    : "View"}
                                </button>
                              </td>
                            </tr>
                            {expandedBet === bet.id && (
                              <tr
                                key={`${bet.id}-expanded`}
                                className="bg-slate-50"
                              >
                                <td
                                  colSpan={8}
                                  className="px-4 py-4"
                                >
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="font-black text-[#071b34]">
                                      Bet Selections
                                    </div>

                                    <div className="mt-3 space-y-3">
                                      {(bet.bet_selections || []).map(
                                        (selection) => {
                                          const match =
                                            selection.match ||
                                            selection.matches;
                                          const homeTeam =
                                            selection.home_team ||
                                            match?.home_team ||
                                            "-";
                                          const awayTeam =
                                            selection.away_team ||
                                            match?.away_team ||
                                            "-";
                                          const kickoff =
                                            selection.kickoff_at ||
                                            match?.kickoff_at ||
                                            null;
                                          const matchStatus =
                                            selection.match_status ||
                                            match?.status ||
                                            "";
                                          const resultStatus =
                                            selection.result_status ||
                                            match?.result_status ||
                                            "";

                                          return (
                                            <div
                                              key={selection.id}
                                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                            >
                                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                <div className="xl:col-span-2">
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Match
                                                  </div>
                                                  <div className="mt-1 font-bold text-[#071b34]">
                                                    {homeTeam} vs {awayTeam}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Selection
                                                  </div>
                                                  <div className="mt-1 font-bold text-[#071b34]">
                                                    {selection.selection || "-"}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Market
                                                  </div>
                                                  <div className="mt-1 font-bold text-[#071b34]">
                                                    {selection.market || "-"}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Odds
                                                  </div>
                                                  <div className="mt-1 font-bold text-[#071b34]">
                                                    {formatMoney(selection.odds)}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Line
                                                  </div>
                                                  <div className="mt-1 font-bold text-[#071b34]">
                                                    {selection.line ?? "-"}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Kickoff
                                                  </div>
                                                  <div className="mt-1 text-sm font-bold text-[#071b34]">
                                                    {kickoff
                                                      ? formatDate(kickoff)
                                                      : "-"}
                                                  </div>
                                                </div>

                                                <div className="xl:col-span-2">
                                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    Result / Status
                                                  </div>
                                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                                                      {selection.result || "-"}
                                                    </span>
                                                    {(resultStatus || matchStatus) && (
                                                      <span className="rounded-full bg-[#071b34] px-3 py-1 text-[10px] font-black uppercase text-white">
                                                        {resultStatus || matchStatus}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}                      </tbody>
                    </table>
                  </div>


                  {!betsLoading &&
                    filteredBets.length ===
                      0 && (
                      <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                        No bets found.
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* ==================================================
                SETTLEMENT
            ================================================== */}

            {section ===
              "settlement" && (
              <div className="space-y-6">

                <div className="rounded-2xl bg-[#071b34] p-6 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f5b400]">
                    OFFICIAL SETTLEMENT
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    Match Results & Bet Settlement
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    Update official match results
                    and settle customer bets through
                    the protected server-side workflow.
                  </p>
                </div>

                {settlementMessage && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    {settlementMessage}
                  </div>
                )}

                {settlementError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {settlementError}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071b34]">
                        Match Results
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Record the official result
                        before settling affected bets.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={matchSearch}
                        onChange={(event) =>
                          setMatchSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search teams or league..."
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#f5b400]"
                      />

                      <button
                        type="button"
                        onClick={
                          loadMatches
                        }
                        className="rounded-xl bg-[#071b34] px-4 py-2.5 text-xs font-black text-white"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {matchesError && (
                    <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {matchesError}
                    </div>
                  )}

                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Sport Navigation
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSettlementSportFilter("all")
                        }
                        className={`rounded-full px-4 py-2 text-xs font-black transition ${
                          settlementSportFilter === "all"
                            ? "bg-[#f5b400] text-[#071b34]"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        All Sports
                      </button>

                      {managementSports.map((sport) => (
                        <button
                          key={sport.key}
                          type="button"
                          onClick={() =>
                            setSettlementSportFilter(sport.key)
                          }
                          className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                            settlementSportFilter === sport.key
                              ? "bg-[#f5b400] text-[#071b34] shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-[#f5b400] hover:bg-white"
                          }`}
                        >
                          {sport.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {settlementMatches.map(
                      (match) => (
                        <div
                          key={match.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {match.sports_leagues?.name ||
                                  "League"}
                              </div>

                              <div className="mt-2 text-base font-black text-[#071b34]">
                                {match.home_team}

                                <span className="mx-2 text-slate-300">
                                  vs
                                </span>

                                {match.away_team}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {formatDate(
                                  match.kickoff_at,
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-[10px] font-black uppercase text-slate-400">
                                  Score
                                </div>

                                <div className="mt-1 text-xl font-black text-[#071b34]">
                                  {match.home_score ??
                                    "-"}{" "}
                                  :{" "}
                                  {match.away_score ??
                                    "-"}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  openMatchResult(
                                    match,
                                  )
                                }
                                className="rounded-xl bg-[#071b34] px-4 py-3 text-xs font-black text-white hover:bg-slate-800"
                              >
                                Update Result
                              </button>
                            </div>
                          </div>
                        </div>
                      ),
                    )}

                    {!matchesLoading &&
                      settlementMatches.length ===
                        0 && (
                        <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                          No matches found.
                        </div>
                      )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071b34]">
                        Bet Settlement
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Select the official result
                        for every selection.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        loadBets
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-[#071b34]"
                    >
                      Refresh Bets
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      [
                        "Open",
                        openBets,
                      ],
                      [
                        "Won",
                        wonBets,
                      ],
                      [
                        "Lost",
                        lostBets,
                      ],
                      [
                        "Void",
                        voidBets,
                      ],
                    ].map(
                      ([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-xl bg-slate-50 p-4"
                        >
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {label}
                          </div>

                          <div className="mt-1 text-2xl font-black text-[#071b34]">
                            {value}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    {bets
                      .filter(
                        (bet) =>
                          bet.status?.toLowerCase() ===
                          "open",
                      )
                      .map((bet) => (
                        <div
                          key={bet.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-black text-[#071b34]">
                                {bet.bet_reference ||
                                  bet.id}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {bet.bet_type ||
                                  "Bet"}{" "}
                                · Stake GH₵{" "}
                                {formatMoney(
                                  bet.stake,
                                )}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {(
                                  bet.bet_selections ||
                                  []
                                ).length}{" "}
                                selections
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openSettlement(
                                  bet,
                                )
                              }
                              className="rounded-xl bg-[#f5b400] px-5 py-3 text-xs font-black text-[#071b34]"
                            >
                              Settle Bet
                            </button>
                          </div>
                        </div>
                      ))}

                    {bets.filter(
                      (bet) =>
                        bet.status?.toLowerCase() ===
                        "open",
                    ).length === 0 && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                        No open bets currently
                        require settlement.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================
                MATCHES & ODDS
            ================================================== */}

            {section ===
              "matches" && (
              <div className="space-y-6">

                <div className="rounded-3xl bg-[#071b34] p-6 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                    SPORTSBOOK MANAGEMENT
                  </p>

                  <h3 className="mt-2 text-3xl font-black">
                    Create Match & Odds
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Configure a match, select the markets
                    that should be available, then publish
                    the odds into the BETZONE database.
                  </p>
                </div>

                {matchFormError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {matchFormError}
                  </div>
                )}

                {matchFormSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    {matchFormSuccess}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    [
                      1,
                      "Match Details",
                    ],
                    [
                      2,
                      "Markets",
                    ],
                    [
                      3,
                      "Odds",
                    ],
                  ].map(
                    ([number, label]) => (
                      <div
                        key={String(number)}
                        className={`rounded-xl px-3 py-3 text-center ${
                          matchStep ===
                          number
                            ? "bg-[#f5b400] text-[#071b34]"
                            : "border border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider">
                          Step{" "}
                          {number}
                        </div>

                        <div className="mt-1 text-xs font-black sm:text-sm">
                          {label}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {matchStep ===
                  1 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Sport
                        </label>

                        <select
                          value={
                            selectedSport
                          }
                          onChange={(event) =>
                            setSelectedSport(
                              event.target.value,
                            )
                          }
                          disabled={
                            loadingSports
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                        >
                          <option value="">
                            Select sport
                          </option>

                          {sports.map(
                            (sport) => (
                              <option
                                key={
                                  sport.sport_key
                                }
                                value={
                                  sport.sport_key
                                }
                              >
                                {
                                  sport.sport_name
                                }
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          League
                        </label>

                        <select
                          value={
                            selectedLeague
                          }
                          onChange={(event) =>
                            setSelectedLeague(
                              event.target.value,
                            )
                          }
                          disabled={
                            loadingLeagues ||
                            !selectedSport
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                        >
                          <option value="">
                            {loadingLeagues
                              ? "Loading leagues..."
                              : "Select league"}
                          </option>

                          {leagues.map(
                            (league) => (
                              <option
                                key={
                                  league.id
                                }
                                value={
                                  league.id
                                }
                              >
                                {league.name}
                                {league.country
                                  ? ` — ${league.country}`
                                  : ""}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Home Team
                        </label>

                        <input
                          value={
                            homeTeam
                          }
                          onChange={(event) =>
                            setHomeTeam(
                              event.target.value,
                            )
                          }
                          placeholder="Enter home team"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Away Team
                        </label>

                        <input
                          value={
                            awayTeam
                          }
                          onChange={(event) =>
                            setAwayTeam(
                              event.target.value,
                            )
                          }
                          placeholder="Enter away team"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Kickoff Date
                        </label>

                        <input
                          type="date"
                          value={
                            kickoffDate
                          }
                          onChange={(event) =>
                            setKickoffDate(
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Kickoff Time
                        </label>

                        <input
                          type="time"
                          value={
                            kickoffTime
                          }
                          onChange={(event) =>
                            setKickoffTime(
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={
                          continueToMarkets
                        }
                        className="rounded-xl bg-[#071b34] px-6 py-3 text-sm font-black text-white"
                      >
                        Continue to Markets
                      </button>
                    </div>
                  </div>
                )}

                {matchStep ===
                  2 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#071b34]">
                          Select Markets
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Choose only the markets you want
                          to publish for this match.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={
                            selectAllMarkets
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black"
                        >
                          Select All
                        </button>

                        <button
                          type="button"
                          onClick={
                            clearAllMarkets
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {loadingMarkets ? (
                      <div className="py-12 text-center text-sm font-semibold text-slate-500">
                        Loading markets...
                      </div>
                    ) : (
                      <div className="mt-6 space-y-5">
                        {marketGroups.map(
                          ([
                            group,
                            groupMarkets,
                          ]) => (
                            <div
                              key={
                                group
                              }
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-wider text-[#071b34]">
                                  {group}
                                </h4>

                                <button
                                  type="button"
                                  onClick={() =>
                                    selectGroupMarkets(
                                      group,
                                    )
                                  }
                                  className="text-xs font-black text-[#b57e00]"
                                >
                                  {isGroupSelected(
                                    group,
                                  )
                                    ? "Clear Group"
                                    : "Select Group"}
                                </button>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {groupMarkets.map(
                                  (
                                    market,
                                  ) => {
                                    const selected =
                                      selectedMarkets.includes(
                                        market.market_key,
                                      );

                                    return (
                                      <button
                                        type="button"
                                        key={
                                          market.market_key
                                        }
                                        onClick={() =>
                                          toggleMarket(
                                            market,
                                          )
                                        }
                                        className={`rounded-xl border p-4 text-left transition ${
                                          selected
                                            ? "border-[#f5b400] bg-[#fff8dc]"
                                            : "border-slate-200 bg-white hover:border-slate-400"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-sm font-black text-[#071b34]">
                                            {
                                              market.market_name
                                            }
                                          </span>

                                          <span
                                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black ${
                                              selected
                                                ? "border-[#071b34] bg-[#071b34] text-white"
                                                : "border-slate-300"
                                            }`}
                                          >
                                            {selected
                                              ? "✓"
                                              : ""}
                                          </span>
                                        </div>

                                        <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">
                                          {
                                            market.market_key
                                          }
                                        </div>
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setMatchStep(1)
                        }
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-[#071b34]"
                      >
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={
                          continueToOdds
                        }
                        className="rounded-xl bg-[#071b34] px-6 py-3 text-sm font-black text-white"
                      >
                        Continue to Odds
                      </button>
                    </div>
                  </div>
                )}

                {matchStep ===
                  3 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-[#071b34]">
                            Configure Odds
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {homeTeam} vs{" "}
                            {awayTeam}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                          {
                            selectedMarkets.length
                          }{" "}
                          markets selected
                        </div>
                      </div>
                    </div>

                    {selectedMarkets.map(
                      (marketKey) => {
                        const form =
                          marketForms[
                            marketKey
                          ];

                        if (!form) {
                          return null;
                        }

                        const needsLine =
                          marketNeedsLine(
                            form.market
                              .market_key,
                          );

                        return (
                          <div
                            key={
                              marketKey
                            }
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="text-lg font-black text-[#071b34]">
                                  {
                                    form.market
                                      .market_name
                                  }
                                </h4>

                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {
                                    form.market
                                      .market_key
                                  }
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  addSelection(
                                    marketKey,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black"
                              >
                                + Add Selection
                              </button>
                            </div>

                            <div className="mt-5 space-y-3">
                              {form.selections.map(
                                (
                                  odd,
                                ) => (
                                  <div
                                    key={
                                      odd.id
                                    }
                                    className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_140px_120px_auto]"
                                  >
                                    <input
                                      value={
                                        odd.selection
                                      }
                                      onChange={(event) =>
                                        updateOdd(
                                          marketKey,
                                          odd.id,
                                          "selection",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Selection"
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f5b400]"
                                    />

                                    {needsLine && (
                                      <input
                                        value={
                                          odd.line
                                        }
                                        onChange={(event) =>
                                          updateOdd(
                                            marketKey,
                                            odd.id,
                                            "line",
                                            event.target.value,
                                          )
                                        }
                                        placeholder="Line"
                                        type="number"
                                        step="0.01"
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f5b400]"
                                      />
                                    )}

                                    {!needsLine && (
                                      <div className="hidden sm:block" />
                                    )}

                                    <input
                                      value={
                                        odd.odds
                                      }
                                      onChange={(event) =>
                                        updateOdd(
                                          marketKey,
                                          odd.id,
                                          "odds",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Odds"
                                      type="number"
                                      step="0.01"
                                      min="1.01"
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#f5b400]"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSelection(
                                          marketKey,
                                          odd.id,
                                        )
                                      }
                                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}

                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setMatchStep(2)
                        }
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-[#071b34]"
                      >
                        Back to Markets
                      </button>

                      <button
                        type="button"
                        onClick={
                          createMatchAndOdds
                        }
                        disabled={
                          savingMatch
                        }
                        className="rounded-xl bg-[#f5b400] px-7 py-3 text-sm font-black text-[#071b34] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingMatch
                          ? "Creating Match..."
                          : "Create Match & Publish Odds"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ======================================================
                MATCHES MANAGEMENT
            ====================================================== */}

            {section ===
              "match-management" && (
              <div className="space-y-6">
                <div className="rounded-3xl bg-[#071b34] p-6 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                    MATCH MANAGEMENT
                  </p>

                  <h3 className="mt-2 text-3xl font-black">
                    All Existing Matches
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    View every match currently stored in BETZONE,
                    including football, basketball and other sports.
                    Select a sport below to find the match you want
                    to manage.
                  </p>
                </div>

                {matchesError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {matchesError}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071b34]">
                        Sport Navigation
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Select a sport to see only matches from that sport.
                        Football shows football matches, basketball shows basketball matches, and so on.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadMatches}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-[#071b34] hover:bg-slate-50"
                    >
                      Refresh Matches
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMatchManagementSportFilter("all")
                      }
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        matchManagementSportFilter === "all"
                          ? "bg-[#f5b400] text-[#071b34]"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      All
                    </button>

                    {managementSports.map((sport) => {
                      const sportMatchCount = matches.filter(
                        (match) =>
                          String(match.sport_key || "").toLowerCase() ===
                          sport.key,
                      ).length;

                      return (
                        <button
                          key={sport.key}
                          type="button"
                          onClick={() =>
                            setMatchManagementSportFilter(
                              sport.key,
                            )
                          }
                          className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                            matchManagementSportFilter === sport.key
                              ? "bg-[#f5b400] text-[#071b34] shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-[#f5b400] hover:bg-slate-50"
                          }`}
                        >
                          <span>{sport.name}</span>
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                              matchManagementSportFilter === sport.key
                                ? "bg-white/70 text-[#071b34]"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {sportMatchCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={matchSearch}
                      onChange={(event) =>
                        setMatchSearch(event.target.value)
                      }
                      placeholder="Search team or league..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#071b34]">
                        {matchManagementSportFilter === "all"
                          ? "All Matches"
                          : managementSports.find(
                              (sport) =>
                                sport.key ===
                                matchManagementSportFilter,
                            )?.name || "Matches"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {managedMatches.length} match
                        {managedMatches.length === 1 ? "" : "es"} found.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {matchesLoading && (
                      <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                        Loading matches...
                      </div>
                    )}

                    {!matchesLoading &&
                      managedMatches.map((match) => (
                        <div
                          key={match.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                                  {match.sport_key || "sport"}
                                </span>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                                  {match.status || "scheduled"}
                                </span>
                              </div>

                              <div className="mt-3 text-base font-black text-[#071b34] sm:text-lg">
                                {match.home_team}
                                <span className="mx-2 text-slate-300">
                                  vs
                                </span>
                                {match.away_team}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {match.sports_leagues?.name ||
                                  "League"}
                                {match.sports_leagues?.country
                                  ? ` · ${match.sports_leagues.country}`
                                  : ""}
                                {match.kickoff_at
                                  ? ` · ${formatDate(match.kickoff_at)}`
                                  : ""}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openMatchEdit(match)
                                }
                                className="rounded-lg border border-[#f5b400] bg-[#fff8dc] px-3 py-2 text-xs font-black text-[#071b34] hover:bg-[#ffefb0]"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openMatchResult(match)
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-[#071b34] hover:bg-slate-50"
                              >
                                Result
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteMatch(match)
                                }
                                disabled={
                                  deletingMatchId === match.id
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingMatchId === match.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {!matchesLoading &&
                      managedMatches.length === 0 && (
                        <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                          No matches found for the selected sport or search.
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================
                DEPOSITS
            ====================================================== */}

            {section ===
              "deposits" && (
              <section>
                <div className="space-y-6">
                  <div className="rounded-3xl bg-[#071b34] p-6 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                      FINANCE
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      Deposit Requests
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Review customer deposit requests
                      and approve or reject them through
                      the protected server-side workflow.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#071b34]">
                          Pending / Recent Deposits
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Manual payment verification.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          loadDeposits
                        }
                        disabled={
                          depositsLoading
                        }
                        className="rounded-xl bg-[#071b34] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {depositsLoading
                          ? "Refreshing..."
                          : "Refresh"}
                      </button>
                    </div>

                    {depositsError && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {depositsError}
                      </div>
                    )}

                    <input
                      value={depositNote}
                      onChange={(event) =>
                        setDepositNote(
                          event.target.value,
                        )
                      }
                      placeholder="Admin note (required when rejecting)"
                      className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                    />

                    <div className="mt-5 space-y-3">
                      {deposits.map(
                        (deposit) => {
                          const profile =
                            deposit.users?.profiles ||
                            deposit.profiles;

                          const name =
                            profile?.full_name?.trim() ||
                            "Unnamed customer";

                          const pending =
                            String(
                              deposit.status ||
                                "pending",
                            ).toLowerCase() ===
                            "pending";

                          return (
                            <div
                              key={
                                deposit.id
                              }
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <div className="font-black text-[#071b34]">
                                    {name}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {deposit.users?.email ||
                                      deposit.user_id ||
                                      "-"}{" "}
                                    ·{" "}
                                    {deposit.payment_method ||
                                      "-"}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    Ref:{" "}
                                    {deposit.reference ||
                                      "-"}{" "}
                                    ·{" "}
                                    {formatDate(
                                      deposit.created_at,
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="text-lg font-black text-[#071b34]">
                                    GH₵{" "}
                                    {formatMoney(
                                      deposit.amount,
                                    )}
                                  </div>

                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase">
                                    {deposit.status ||
                                      "pending"}
                                  </span>

                                  {pending && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          processDeposit(
                                            deposit.id,
                                            "approve",
                                          )
                                        }
                                        className="rounded-xl bg-[#f5b400] px-4 py-2 text-xs font-black text-[#071b34]"
                                      >
                                        Approve
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          processDeposit(
                                            deposit.id,
                                            "reject",
                                          )
                                        }
                                        className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-600"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}

                      {!depositsLoading &&
                        deposits.length ===
                          0 && (
                          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                            No deposit requests found.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ======================================================
                WITHDRAWALS
            ====================================================== */}

            {section ===
              "withdrawals" && (
              <section>
                <div className="space-y-6">
                  <div className="rounded-3xl bg-[#071b34] p-6 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                      FINANCE
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      Withdrawal Requests
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Review customer withdrawals after
                      manual payment processing.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#071b34]">
                          Pending / Recent Withdrawals
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Approve only after the money has
                          been manually sent.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          loadWithdrawals
                        }
                        disabled={
                          withdrawalsLoading
                        }
                        className="rounded-xl bg-[#071b34] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {withdrawalsLoading
                          ? "Refreshing..."
                          : "Refresh"}
                      </button>
                    </div>

                    {withdrawalsError && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {withdrawalsError}
                      </div>
                    )}

                    <input
                      value={withdrawalNote}
                      onChange={(event) =>
                        setWithdrawalNote(
                          event.target.value,
                        )
                      }
                      placeholder="Admin note (required when rejecting)"
                      className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                    />

                    <div className="mt-5 space-y-3">
                      {withdrawals.map(
                        (withdrawal) => {
                          const profile =
                            withdrawal.users?.profiles;

                          const name =
                            profile?.full_name?.trim() ||
                            "Unnamed customer";

                          const pending =
                            String(
                              withdrawal.status ||
                                "pending",
                            ).toLowerCase() ===
                            "pending";

                          return (
                            <div
                              key={
                                withdrawal.id
                              }
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <div className="font-black text-[#071b34]">
                                    {name}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {withdrawal.users?.email ||
                                      withdrawal.user_id ||
                                      "-"}{" "}
                                    ·{" "}
                                    {withdrawal.payment_method ||
                                      "-"}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    Phone:{" "}
                                    {withdrawal.phone_number ||
                                      profile?.phone ||
                                      "-"}{" "}
                                    · Account:{" "}
                                    {withdrawal.account_name ||
                                      "-"}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {formatDate(
                                      withdrawal.created_at,
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="text-lg font-black text-[#071b34]">
                                    GH₵{" "}
                                    {formatMoney(
                                      withdrawal.amount,
                                    )}
                                  </div>

                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase">
                                    {withdrawal.status ||
                                      "pending"}
                                  </span>

                                  {pending && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          processWithdrawal(
                                            withdrawal.id,
                                            "approve",
                                          )
                                        }
                                        className="rounded-xl bg-[#f5b400] px-4 py-2 text-xs font-black text-[#071b34]"
                                      >
                                        Approve
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          processWithdrawal(
                                            withdrawal.id,
                                            "reject",
                                          )
                                        }
                                        className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-600"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}

                      {!withdrawalsLoading &&
                        withdrawals.length ===
                          0 && (
                          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                            No withdrawal requests found.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ======================================================
                USERS
            ====================================================== */}

            {section ===
              "users" && (
              <section>
                <div className="space-y-6">
                  <div className="rounded-3xl bg-[#071b34] p-6 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                      CUSTOMERS
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      BETZONE Users
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      View registered customers and
                      account information.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        value={userSearch}
                        onChange={(event) =>
                          setUserSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search ID, name, phone or email..."
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                      />

                      <button
                        type="button"
                        onClick={
                          loadUsers
                        }
                        disabled={
                          usersLoading
                        }
                        className="rounded-xl bg-[#071b34] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {usersLoading
                          ? "Refreshing..."
                          : "Refresh"}
                      </button>
                    </div>

                    {usersError && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {usersError}
                      </div>
                    )}

                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-[#071b34] text-xs uppercase tracking-wider text-white">
                          <tr>
                            <th className="px-4 py-3">
                              Customer
                            </th>
                            <th className="px-4 py-3">
                              Phone
                            </th>
                            <th className="px-4 py-3">
                              Email
                            </th>
                            <th className="px-4 py-3">
                              Account
                            </th>
                            <th className="px-4 py-3">
                              Registered
                            </th>
                            <th className="px-4 py-3">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {users
                            .filter(
                              (user) => {
                                const profile =
                                  user.profiles;

                                const query =
                                  userSearch
                                    .trim()
                                    .toLowerCase();

                                return (
                                  !query ||
                                  JSON.stringify(
                                    user,
                                  )
                                    .toLowerCase()
                                    .includes(
                                      query,
                                    ) ||
                                  profile?.full_name
                                    ?.toLowerCase()
                                    .includes(
                                      query,
                                    ) ||
                                  profile?.phone
                                    ?.toLowerCase()
                                    .includes(
                                      query,
                                    )
                                );
                              },
                            )
                            .map(
                              (user) => {
                                const profile =
                                  user.profiles;

                                return (
                                  <tr
                                    key={
                                      user.id
                                    }
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-4">
                                      <div className="font-bold text-[#071b34]">
                                        {user.full_name ||
                                          profile?.full_name ||
                                          "Unnamed customer"}
                                      </div>

                                      <div className="mt-1 text-[11px] text-slate-400">
                                        {user.id}
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {user.phone ||
                                        profile?.phone ||
                                        "-"}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {user.email ||
                                        "-"}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {user.account_type ||
                                        profile?.account_type ||
                                        "-"}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {formatDate(
                                        user.created_at ||
                                          profile?.created_at,
                                      )}
                                    </td>

                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase">
                                          {user.status ||
                                            profile?.status ||
                                            "active"}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openCustomerDetails(
                                              user,
                                            )
                                          }
                                          className="rounded-lg bg-[#071b34] px-3 py-2 text-[10px] font-black text-white transition hover:bg-[#0d2d50]"
                                        >
                                          View
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                        </tbody>
                      </table>
                    </div>

                    {!usersLoading &&
                      users.length ===
                        0 && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                          No users found.
                        </div>
                      )}
                  </div>
                </div>
              </section>
            )}

            {/* ======================================================
                WALLETS
            ====================================================== */}

            {section ===
              "wallet" && (
              <section>
                <div className="space-y-6">
                  <div className="rounded-3xl bg-[#071b34] p-6 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-[#f5b400]">
                      FINANCE
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      Customer Wallets
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      View customer wallet balances and
                      wallet information.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        value={walletSearch}
                        onChange={(event) =>
                          setWalletSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search customer, phone, email or user ID..."
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#f5b400]"
                      />

                      <button
                        type="button"
                        onClick={
                          loadWallets
                        }
                        disabled={
                          walletsLoading
                        }
                        className="rounded-xl bg-[#071b34] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {walletsLoading
                          ? "Refreshing..."
                          : "Refresh"}
                      </button>
                    </div>

                    {walletsError && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {walletsError}
                      </div>
                    )}

                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[950px] text-left">
                        <thead className="bg-[#071b34] text-xs uppercase tracking-wider text-white">
                          <tr>
                            <th className="px-4 py-3">
                              Customer
                            </th>
                            <th className="px-4 py-3">
                              Phone
                            </th>
                            <th className="px-4 py-3">
                              Email
                            </th>
                            <th className="px-4 py-3 text-right">
                              Balance
                            </th>
                            <th className="px-4 py-3">
                              Created
                            </th>
                            <th className="px-4 py-3">
                              Updated
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {wallets
                            .filter(
                              (wallet) => {
                                const profile =
                                  wallet.users
                                    ?.profiles;

                                const query =
                                  walletSearch
                                    .trim()
                                    .toLowerCase();

                                return (
                                  !query ||
                                  JSON.stringify(
                                    wallet,
                                  )
                                    .toLowerCase()
                                    .includes(
                                      query,
                                    ) ||
                                  profile?.full_name
                                    ?.toLowerCase()
                                    .includes(
                                      query,
                                    ) ||
                                  profile?.phone
                                    ?.toLowerCase()
                                    .includes(
                                      query,
                                    )
                                );
                              },
                            )
                            .map(
                              (wallet) => {
                                const profile =
                                  wallet.users
                                    ?.profiles;

                                return (
                                  <tr
                                    key={
                                      wallet.id
                                    }
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-4">
                                      <div className="font-bold text-[#071b34]">
                                        {profile?.full_name?.trim() ||
                                          "Unnamed customer"}
                                      </div>

                                      <div className="mt-1 text-[11px] text-slate-400">
                                        {wallet.user_id}
                                      </div>
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {profile?.phone ||
                                        "-"}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {wallet.users?.email ||
                                        "-"}
                                    </td>

                                    <td className="px-4 py-4 text-right">
                                      <span className="text-lg font-black text-[#b57e00]">
                                        {formatMoney(
                                          wallet.balance,
                                        )}
                                      </span>

                                      <span className="ml-1 text-xs text-slate-400">
                                        GHS
                                      </span>
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      {formatDate(
                                        wallet.created_at,
                                      )}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-600">
                                      <div className="flex items-center gap-2">
                                        <span>
                                          {formatDate(
                                            wallet.updated_at,
                                          )}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const customer =
                                              users.find(
                                                (item) =>
                                                  item.id ===
                                                  wallet.user_id,
                                              );

                                            if (
                                              customer
                                            ) {
                                              openCustomerDetails(
                                                customer,
                                              );
                                            } else {
                                              openCustomerDetails(
                                                {
                                                  id: wallet.user_id,
                                                  email:
                                                    wallet
                                                      .users
                                                      ?.email,
                                                  full_name:
                                                    wallet
                                                      .users
                                                      ?.profiles
                                                      ?.full_name,
                                                  phone:
                                                    wallet
                                                      .users
                                                      ?.profiles
                                                      ?.phone,
                                                },
                                              );
                                            }
                                          }}
                                          className="rounded-lg bg-[#071b34] px-3 py-2 text-[10px] font-black text-white transition hover:bg-[#0d2d50]"
                                        >
                                          View
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                        </tbody>
                      </table>
                    </div>

                    {!walletsLoading &&
                      wallets.length ===
                        0 && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                          No wallets found.
                        </div>
                      )}
                  </div>
                </div>
              </section>
            )}


      {/* ======================================================
          PLATFORM SETTINGS
      ====================================================== */}
      {section === "platform-settings" && (
        <div className="space-y-5">
              <div className="rounded-2xl bg-[#071b34] px-5 py-4 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f5b400]">ADMIN SETTINGS</p>
                <h3 className="mt-1 text-2xl font-black">Platform Settings</h3>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">Configure BETZONE's global identity, betting rules, deposits, withdrawals and maintenance controls.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    ["General", "Platform identity"],
                    ["Betting", "Stake & payout rules"],
                    ["Deposits", "Deposit limits"],
                    ["Withdrawals", "Withdrawal limits"],
                    ["Maintenance", "Platform availability"],
                  ].map(([label, description]) => (
                    <button
                      key={label}
                      type="button"
                      className="rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="block text-sm font-black text-[#071b34]">{label}</span>
                      <span className="mt-1 hidden text-[10px] font-semibold text-slate-400 sm:block">{description}</span>
                    </button>
                  ))}
                </div>
              </div>


              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-black text-[#071b34]">General</h4>
                  <div className="mt-4 grid gap-4">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Platform Name
                      <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">Currency
                        <select value={platformCurrency} onChange={(e) => setPlatformCurrency(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"><option value="GHS">GHS — GH₵</option></select>
                      </label>
                      <label className="text-xs font-black uppercase tracking-wide text-slate-500">Time Zone
                        <select value={platformTimezone} onChange={(e) => setPlatformTimezone(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"><option value="Africa/Accra">Africa/Accra</option></select>
                      </label>
                    </div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Support Email
                      <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@betzone.com" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" />
                    </label>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Support Phone / WhatsApp
                      <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+233..." className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-black text-[#071b34]">Betting Limits</h4>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Minimum Stake<input type="number" min="0" step="0.01" value={minimumStake} onChange={(e) => setMinimumStake(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Maximum Stake<input type="number" min="0" step="0.01" value={maximumStake} onChange={(e) => setMaximumStake(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Maximum Payout<input type="number" min="0" step="0.01" value={maximumPayout} onChange={(e) => setMaximumPayout(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                  </div>
                  <div className="mt-5 space-y-3">
                    {([['Betting Enabled', bettingEnabled, setBettingEnabled], ['Single Bets', singleBetsEnabled, setSingleBetsEnabled], ['Accumulator Bets', accumulatorBetsEnabled, setAccumulatorBetsEnabled]] as Array<[string, boolean, React.Dispatch<React.SetStateAction<boolean>>]>).map(([label, value, setter]) => (
                      <button key={String(label)} type="button" onClick={() => setter(!value)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left"><span className="text-sm font-black text-[#071b34]">{label}</span><span className={`rounded-full px-3 py-1 text-[10px] font-black ${value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{value ? 'ON' : 'OFF'}</span></button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-black text-[#071b34]">Wallet & Transactions</h4>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Minimum Deposit<input type="number" min="0" step="0.01" value={minimumDeposit} onChange={(e) => setMinimumDeposit(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Maximum Deposit<input type="number" min="0" step="0.01" value={maximumDeposit} onChange={(e) => setMaximumDeposit(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Minimum Withdrawal<input type="number" min="0" step="0.01" value={minimumWithdrawal} onChange={(e) => setMinimumWithdrawal(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Maximum Withdrawal<input type="number" min="0" step="0.01" value={maximumWithdrawal} onChange={(e) => setMaximumWithdrawal(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                  </div>
                  <div className="mt-5 space-y-3">
                    {([['Deposits Enabled', depositsEnabled, setDepositsEnabled], ['Withdrawals Enabled', withdrawalsEnabled, setWithdrawalsEnabled], ['Maintenance Mode', maintenanceMode, setMaintenanceMode]] as Array<[string, boolean, React.Dispatch<React.SetStateAction<boolean>>]>).map(([label, value, setter]) => (
                      <button key={String(label)} type="button" onClick={() => setter(!value)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left"><span className="text-sm font-black text-[#071b34]">{label}</span><span className={`rounded-full px-3 py-1 text-[10px] font-black ${value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{value ? 'ON' : 'OFF'}</span></button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-lg font-black text-[#071b34]">Manual Deposits</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Configure the Mobile Money account customers use for manual betting deposits.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setManualDepositEnabled((value) => !value)}
                      className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 text-left"
                    >
                      <span className="text-sm font-black text-[#071b34]">Manual Deposits</span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black ${
                          manualDepositEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {manualDepositEnabled ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Provider
                      <select
                        value={manualDepositProvider}
                        onChange={(e) => setManualDepositProvider(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                      >
                        <option value="MTN Mobile Money">MTN Mobile Money</option>
                        <option value="Telecel">Telecel</option>
                      </select>
                    </label>

                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Account Name
                      <input
                        value={manualDepositAccountName}
                        onChange={(e) => setManualDepositAccountName(e.target.value)}
                        placeholder="BETZONE"
                        required
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                      />
                    </label>

                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Mobile Money Number
                      <input
                        value={manualDepositPhoneNumber}
                        onChange={(e) => setManualDepositPhoneNumber(e.target.value)}
                        placeholder="+233..."
                        required
                        inputMode="tel"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                      />
                    </label>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Customer Verification
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                        Customers will enter the actual Mobile Money transaction ID generated by the provider.
                      </p>
                    </div>

                    <label className="text-xs font-black uppercase tracking-wide text-slate-500 sm:col-span-2">
                      Deposit Instructions
                      <textarea
                        value={manualDepositInstructions}
                        onChange={(e) => setManualDepositInstructions(e.target.value)}
                        required
                        rows={4}
                        placeholder="Tell customers how to send the deposit and what transaction ID to enter."
                        className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                      />
                    </label>
                  </div>

                  {!manualDepositEnabled && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Manual deposits are currently disabled. Customers should not be shown this manual deposit method.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-black text-[#071b34]">Save Platform Configuration</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">These values are stored in the BETZONE platform settings table. Saving here updates the backend configuration used by the platform.</p>

                  {platformSettingsLoading && (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">Loading saved platform settings...</div>
                  )}

                  {platformSettingsError && (
                    <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {platformSettingsError}
                    </div>
                  )}

                  {platformSettingsMessage && (
                    <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                      {platformSettingsMessage}
                    </div>
                  )}

                  {platformSettingsLastLoaded && (
                    <div className="mt-3 text-[11px] font-semibold text-slate-400">
                      Last loaded from backend: {new Date(platformSettingsLastLoaded).toLocaleString()}
                    </div>
                  )}

                  {maintenanceMode && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Maintenance Mode is ON. Customer-facing betting and wallet workflows must respect this setting at the backend.
                    </div>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPlatformSettingsMessage("");
                        loadPlatformSettings();
                      }}
                      disabled={platformSettingsLoading || savingPlatformSettings}
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[#071b34] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {platformSettingsLoading ? "Loading..." : "Reload Saved Settings"}
                    </button>

                    <button
                    type="button"
                    onClick={savePlatformSettings}
                    disabled={platformSettingsLoading || savingPlatformSettings}
                    className="mt-0 w-full rounded-xl bg-[#f5b400] px-5 py-3 text-sm font-black text-[#071b34] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingPlatformSettings ? "Saving Platform Settings..." : "Save Platform Settings"}
                  </button>
                  </div>
                </div>
              </div>
            </div>
      )}

      {/* ======================================================
          ADMIN SECURITY
      ====================================================== */}
      {section === "admin-security" && (
        <div className="space-y-6">
              <div className="rounded-2xl bg-[#071b34] px-5 py-4 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f5b400]">ADMIN PROTECTION</p>
                <h3 className="mt-1 text-2xl font-black">Admin Security</h3>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">Security controls for administrator accounts, sessions and access protection.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-black text-[#071b34]">Login Security</h4>
                  <div className="mt-4 space-y-3">
                    <button type="button" onClick={() => setTwoFactorRequired((value) => !value)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left"><span><span className="block text-sm font-black text-[#071b34]">Require Two-Factor Authentication</span><span className="mt-1 block text-xs text-slate-500">Require 2FA for administrator accounts.</span></span><span className={`rounded-full px-3 py-1 text-[10px] font-black ${twoFactorRequired ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{twoFactorRequired ? 'ON' : 'OFF'}</span></button>
                    <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Maximum Failed Login Attempts<input type="number" min="1" max="20" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                    <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Admin Session Timeout (minutes)<input type="number" min="5" max="1440" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]" /></label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="text-lg font-black text-[#071b34]">Security Operations</h4>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {['Active Sessions', 'Admin Accounts', 'Security Events', 'Audit History'].map((item) => (<div key={item} className="rounded-xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item}</div><div className="mt-2 text-sm font-black text-[#071b34]">Available in security backend</div></div>))}
                  </div>
                  <button type="button" onClick={() => setSecurityMessage("Security configuration has been reviewed. Backend enforcement will be connected next.")} className="mt-5 rounded-xl bg-[#071b34] px-5 py-3 text-xs font-black text-white">Review Security Configuration</button>
                  {securityMessage && <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">{securityMessage}</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <h4 className="text-lg font-black text-red-800">High-Risk Administrator Actions</h4>
                <p className="mt-2 text-sm leading-6 text-red-700">Match-result changes, bet settlement, wallet operations and platform-setting changes should be audited and permission-checked. We will connect these actions to role-based permissions and audit records rather than relying on frontend controls.</p>
              </div>
            </div>
      )}

          </div>
        </section>
      </div>

      {/* ========================================================
          CUSTOMER DETAILS MODAL
      ======================================================== */}

      {selectedCustomer &&
        (() => {
          const customerId =
            selectedCustomer.id;

          const profile =
            selectedCustomer.profiles;

          const customerName =
            selectedCustomer.full_name ||
            profile?.full_name ||
            "Unnamed customer";

          const customerBets =
            bets
              .filter(
                (bet) =>
                  bet.user_id ===
                  customerId,
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at || 0,
                  ).getTime() -
                  new Date(
                    a.created_at || 0,
                  ).getTime(),
              );

          const customerDeposits =
            deposits
              .filter(
                (item) =>
                  item.user_id ===
                  customerId,
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at || 0,
                  ).getTime() -
                  new Date(
                    a.created_at || 0,
                  ).getTime(),
              );

          const customerWithdrawals =
            withdrawals
              .filter(
                (item) =>
                  item.user_id ===
                  customerId,
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at || 0,
                  ).getTime() -
                  new Date(
                    a.created_at || 0,
                  ).getTime(),
              );

          const customerWallet =
            wallets.find(
              (wallet) =>
                wallet.user_id ===
                customerId,
            );

          const totalStaked =
            customerBets.reduce(
              (sum, bet) =>
                sum +
                Number(
                  bet.stake || 0,
                ),
              0,
            );

          const totalPotential =
            customerBets.reduce(
              (sum, bet) =>
                sum +
                Number(
                  bet.potential_win ||
                    0,
                ),
              0,
            );

          const totalDeposited =
            customerDeposits
              .filter(
                (item) =>
                  item.status?.toLowerCase() ===
                  "approved",
              )
              .reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.amount || 0,
                  ),
                0,
              );

          const totalWithdrawn =
            customerWithdrawals
              .filter(
                (item) =>
                  item.status?.toLowerCase() ===
                  "approved",
              )
              .reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.amount || 0,
                  ),
                0,
              );

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#020b16]/75 p-3 backdrop-blur-sm sm:p-6">
              <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
                <div className="shrink-0 bg-[#071b34] px-5 py-5 text-white sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f5b400]">
                        CUSTOMER PROFILE
                      </p>

                      <h2 className="mt-1 truncate text-2xl font-black sm:text-3xl">
                        {customerName}
                      </h2>

                      <p className="mt-1 break-all text-xs text-slate-300">
                        {selectedCustomer.email ||
                          "No email"}{" "}
                        · {customerId}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        closeCustomerDetails
                      }
                      className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xl font-black text-white transition hover:bg-white/20"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  {customerDetailsLoading && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                      Loading complete customer history...
                    </div>
                  )}

                  {customerDetailsError && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {customerDetailsError}
                    </div>
                  )}

                  {!customerDetailsLoading && (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                          [
                            "Wallet balance",
                            `GH₵ ${formatMoney(
                              customerWallet?.balance ||
                                0,
                            )}`,
                          ],
                          [
                            "Approved deposits",
                            `GH₵ ${formatMoney(
                              totalDeposited,
                            )}`,
                          ],
                          [
                            "Approved withdrawals",
                            `GH₵ ${formatMoney(
                              totalWithdrawn,
                            )}`,
                          ],
                          [
                            "Total stakes",
                            `GH₵ ${formatMoney(
                              totalStaked,
                            )}`,
                          ],
                          [
                            "Bets",
                            customerBets.length,
                          ],
                        ].map(
                          ([label, value]) => (
                            <div
                              key={String(
                                label,
                              )}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {label}
                              </div>

                              <div className="mt-2 text-xl font-black text-[#071b34]">
                                {value}
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h3 className="font-black text-[#071b34]">
                              Account information
                            </h3>
                          </div>

                          <div className="grid gap-4 p-5 sm:grid-cols-2">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Phone
                              </div>

                              <div className="mt-1 text-sm font-bold text-slate-700">
                                {selectedCustomer.phone ||
                                  profile?.phone ||
                                  "-"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Account type
                              </div>

                              <div className="mt-1 text-sm font-bold text-slate-700">
                                {selectedCustomer.account_type ||
                                  profile?.account_type ||
                                  "-"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Status
                              </div>

                              <div className="mt-1 text-sm font-bold text-slate-700">
                                {selectedCustomer.status ||
                                  profile?.status ||
                                  "active"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Registered
                              </div>

                              <div className="mt-1 text-sm font-bold text-slate-700">
                                {formatDate(
                                  selectedCustomer.created_at ||
                                    profile?.created_at,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h3 className="font-black text-[#071b34]">
                              Wallet
                            </h3>
                          </div>

                          <div className="p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-xs text-slate-400">
                                  Current balance
                                </div>

                                <div className="mt-1 text-3xl font-black text-[#b57e00]">
                                  GH₵{" "}
                                  {formatMoney(
                                    customerWallet?.balance ||
                                      0,
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-400">
                                  Last updated
                                </div>

                                <div className="mt-1 text-sm font-bold text-slate-700">
                                  {formatDate(
                                    customerWallet?.updated_at,
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                              Wallet ID:{" "}
                              <span className="font-bold text-slate-700">
                                {customerWallet?.id ||
                                  "No wallet found"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-black text-[#071b34]">
                                Bet history
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                All bets belonging to this customer.
                              </p>
                            </div>

                            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                              Potential wins: GH₵{" "}
                              {formatMoney(
                                totalPotential,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[850px] text-left">
                            <thead className="bg-[#071b34] text-[10px] uppercase tracking-wider text-white">
                              <tr>
                                <th className="px-4 py-3">
                                  Bet
                                </th>
                                <th className="px-4 py-3">
                                  Type
                                </th>
                                <th className="px-4 py-3">
                                  Stake
                                </th>
                                <th className="px-4 py-3">
                                  Odds
                                </th>
                                <th className="px-4 py-3">
                                  Potential
                                </th>
                                <th className="px-4 py-3">
                                  Status
                                </th>
                                <th className="px-4 py-3">
                                  Created
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {customerBets.map(
                                (bet) => (
                                  <tr
                                    key={
                                      bet.id
                                    }
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="font-bold text-[#071b34]">
                                        {bet.bet_reference ||
                                          bet.id}
                                      </div>

                                      <div className="mt-1 text-[10px] text-slate-400">
                                        {bet.bet_selections?.length ||
                                          0}{" "}
                                        selections
                                      </div>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {bet.bet_type ||
                                        "Bet"}
                                    </td>

                                    <td className="px-4 py-3 text-sm font-bold text-slate-700">
                                      GH₵{" "}
                                      {formatMoney(
                                        bet.stake,
                                      )}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {formatMoney(
                                        bet.total_odds,
                                      )}
                                    </td>

                                    <td className="px-4 py-3 text-sm font-bold text-slate-700">
                                      GH₵{" "}
                                      {formatMoney(
                                        bet.potential_win,
                                      )}
                                    </td>

                                    <td className="px-4 py-3">
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase">
                                        {bet.status ||
                                          "-"}
                                      </span>
                                    </td>

                                    <td className="px-4 py-3 text-xs text-slate-500">
                                      {formatDate(
                                        bet.created_at,
                                      )}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>

                        {customerBets.length ===
                          0 && (
                          <div className="p-8 text-center text-sm font-semibold text-slate-500">
                            No bets found for this customer.
                          </div>
                        )}
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h3 className="font-black text-[#071b34]">
                              Deposit history
                            </h3>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {customerDeposits.map(
                              (item) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-bold text-slate-800">
                                        GH₵{" "}
                                        {formatMoney(
                                          item.amount,
                                        )}
                                      </div>

                                      <div className="mt-1 text-xs text-slate-500">
                                        {item.payment_method ||
                                          "Payment"}{" "}
                                        ·{" "}
                                        {item.reference ||
                                          item.id}
                                      </div>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase">
                                      {item.status ||
                                        "-"}
                                    </span>
                                  </div>

                                  <div className="mt-2 text-[11px] text-slate-400">
                                    {formatDate(
                                      item.created_at,
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>

                          {customerDeposits.length ===
                            0 && (
                            <div className="p-8 text-center text-sm font-semibold text-slate-500">
                              No deposits found.
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h3 className="font-black text-[#071b34]">
                              Withdrawal history
                            </h3>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {customerWithdrawals.map(
                              (item) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="font-bold text-slate-800">
                                        GH₵{" "}
                                        {formatMoney(
                                          item.amount,
                                        )}
                                      </div>

                                      <div className="mt-1 text-xs text-slate-500">
                                        {item.payment_method ||
                                          "Payment"}{" "}
                                        ·{" "}
                                        {item.phone_number ||
                                          "No phone"}
                                      </div>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase">
                                      {item.status ||
                                        "-"}
                                    </span>
                                  </div>

                                  <div className="mt-2 text-[11px] text-slate-400">
                                    {formatDate(
                                      item.created_at,
                                    )}{" "}
                                    ·{" "}
                                    {item.account_name ||
                                      ""}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>

                          {customerWithdrawals.length ===
                            0 && (
                            <div className="p-8 text-center text-sm font-semibold text-slate-500">
                              No withdrawals found.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <div className="font-black">
                          Wallet transaction ledger
                        </div>

                        <p className="mt-1 leading-6">
                          The customer panel is connected
                          to the existing Admin Users, Bets,
                          Deposits, Withdrawals and Wallet
                          endpoints. The current admin API
                          does not expose{" "}
                          <code className="rounded bg-amber-100 px-1">
                            wallet_transactions
                          </code>{" "}
                          yet, so this panel does not invent
                          ledger entries.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ========================================================
          SETTLEMENT MODAL
      ======================================================== */}

      {selectedBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Bet Settlement
                </div>

                <h3 className="mt-1 text-xl font-black text-[#071b34]">
                  {selectedBet.bet_reference ||
                    selectedBet.id}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeSettlement
                }
                disabled={settling}
                className="rounded-lg px-3 py-2 text-xl font-black text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-5">
              {settlementError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {settlementError}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Stake
                  </span>

                  <span className="font-black">
                    GH₵{" "}
                    {formatMoney(
                      selectedBet.stake,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-slate-500">
                    Odds
                  </span>

                  <span className="font-black">
                    {formatMoney(
                      selectedBet.total_odds,
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {(
                  selectedBet.bet_selections ||
                  []
                ).map(
                  (selection) => (
                    <div
                      key={
                        selection.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-black text-[#071b34]">
                            {selection.selection ||
                              "-"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Odds{" "}
                            {formatMoney(
                              selection.odds,
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              "won",
                              "lost",
                              "void",
                            ] as const
                          ).map(
                            (result) => (
                              <button
                                key={
                                  result
                                }
                                type="button"
                                onClick={() =>
                                  setSelectionResult(
                                    selection.id,
                                    result,
                                  )
                                }
                                className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase ${
                                  settlementResults[
                                    selection.id
                                  ] ===
                                  result
                                    ? "bg-[#071b34] text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {result}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    closeSettlement
                  }
                  disabled={
                    settling
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-[#071b34]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    settleSelectedBet
                  }
                  disabled={
                    settling
                  }
                  className="flex-1 rounded-xl bg-[#f5b400] px-4 py-3 text-sm font-black text-[#071b34] disabled:opacity-50"
                >
                  {settling
                    ? "Settling..."
                    : "Confirm Settlement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MATCH EDIT / ODDS MODAL
      ======================================================== */}

      {editingMatch && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4"
          onClick={closeMatchEdit}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d39a00]">
                  MATCH EDITOR
                </p>
                <h3 className="mt-1 text-xl font-black text-[#071b34]">
                  {editingMatch.home_team} vs {editingMatch.away_team}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {editingMatch.sports_leagues?.name || "League"}
                  {editingMatch.kickoff_at
                    ? ` · ${formatDate(editingMatch.kickoff_at)}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMatchEdit}
                disabled={savingMatchEdit}
                className="rounded-lg px-3 py-2 text-xl font-black text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {editingMatchError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {editingMatchError}
                </div>
              )}

              {editingMatchMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  {editingMatchMessage}
                </div>
              )}

              {editingMatchLoading ? (
                <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
                  Loading match and odds...
                </div>
              ) : editingMatchOdds.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <h4 className="font-black text-amber-900">
                    No odds found for this match
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    This match exists, but the API did not return any odds for it.
                    Use Match & Odds to add and publish the markets for this match.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-lg font-black text-[#071b34]">
                        Existing Odds
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {editingMatchOdds.length} selection
                        {editingMatchOdds.length === 1 ? "" : "s"} found.
                        Change the values below and save the odds.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {editingMatchOdds.map((odd, index) => (
                      <div
                        key={odd.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_120px]">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Market
                            </label>
                            <input
                              value={odd.market_key}
                              onChange={(event) =>
                                updateEditingOdd(
                                  index,
                                  "market_key",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[#f5b400]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Selection
                            </label>
                            <input
                              value={odd.selection}
                              onChange={(event) =>
                                updateEditingOdd(
                                  index,
                                  "selection",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[#f5b400]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Odds
                            </label>
                            <input
                              type="number"
                              min="1.01"
                              step="0.01"
                              value={odd.odds}
                              onChange={(event) =>
                                updateEditingOdd(
                                  index,
                                  "odds",
                                  event.target.value,
                                )
                              }
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black outline-none focus:border-[#f5b400]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Line
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={odd.line}
                              onChange={(event) =>
                                updateEditingOdd(
                                  index,
                                  "line",
                                  event.target.value,
                                )
                              }
                              placeholder="—"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[#f5b400]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeMatchEdit}
                  disabled={savingMatchEdit}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-[#071b34] hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={saveMatchEdit}
                  disabled={
                    savingMatchEdit ||
                    editingMatchLoading ||
                    editingMatchOdds.length === 0
                  }
                  className="rounded-xl bg-[#f5b400] px-5 py-3 text-sm font-black text-[#071b34] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingMatchEdit
                    ? "Saving Odds..."
                    : "Save Odds"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MATCH RESULT MODAL
      ======================================================== */}

      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Official Match Result
                </div>

                <h3 className="mt-1 text-lg font-black text-[#071b34]">
                  {
                    selectedMatch.home_team
                  }{" "}
                  vs{" "}
                  {
                    selectedMatch.away_team
                  }
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeMatchResult
                }
                disabled={
                  savingMatchResult
                }
                className="rounded-lg px-3 py-2 text-xl font-black text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5">
              {matchesError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {matchesError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Home Score
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      homeScore
                    }
                    onChange={(event) =>
                      setHomeScore(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-black outline-none focus:border-[#f5b400]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Away Score
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      awayScore
                    }
                    onChange={(event) =>
                      setAwayScore(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-black outline-none focus:border-[#f5b400]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Result Status
                </label>

                <select
                  value={
                    matchResultStatus
                  }
                  onChange={(event) =>
                    setMatchResultStatus(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#f5b400]"
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="finished">
                    Finished
                  </option>

                  <option value="postponed">
                    Postponed
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                  <option value="abandoned">
                    Abandoned
                  </option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={
                    closeMatchResult
                  }
                  disabled={
                    savingMatchResult
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-[#071b34]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveMatchResult
                  }
                  disabled={
                    savingMatchResult
                  }
                  className="flex-1 rounded-xl bg-[#071b34] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {savingMatchResult
                    ? "Saving..."
                    : "Save Result"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}