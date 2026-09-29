export type Sport = {
  id: string;
  sport_key: string;
  sport_name: string;
  is_active: boolean;
  sort_order: number | null;
};

export type League = {
  id: string;
  name: string;
  country: string | null;
  sport: string;
  is_active: boolean;
};

export type Match = {
  id: string;
  league_id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
  is_active: boolean;
  provider: string | null;
  provider_match_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Market = {
  id: string;
  market_key: string;
  market_name: string;
  market_group: string;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

export type MatchOdd = {
  id: string;
  match_id: string;
  market: string;
  selection: string;
  odds: string;
  line: string | null;
  market_group: string | null;
  sort_order: number | null;
  market_id: string | null;
  provider: string | null;
  provider_odd_id: string | null;
  is_active: boolean;
  sports_markets: Market | null;
};