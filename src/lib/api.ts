const API_URL = "http://localhost:4000";

export async function getSports() {
  const response = await fetch(`${API_URL}/sports`);

  if (!response.ok) {
    throw new Error("Failed to fetch sports");
  }

  return response.json();
}

export async function getLeaguesBySport(sportKey: string) {
  const response = await fetch(
    `${API_URL}/sports/${sportKey}/leagues`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch leagues");
  }

  return response.json();
}

export async function getMatchesByLeague(leagueId: string) {
  const response = await fetch(
    `${API_URL}/sports/football/leagues/${leagueId}/matches`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch matches");
  }

  return response.json();
}

export async function getMarketsByMatch(
  sportKey: string,
  leagueId: string,
  matchId: string,
) {
  const response = await fetch(
    `${API_URL}/sports/${sportKey}/leagues/${leagueId}/matches/${matchId}/markets`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch match markets");
  }

  return response.json();
}

/* =========================
   TRANSACTIONS
========================= */

export async function createDeposit(
  accessToken: string,
  paymentMethod: string,
  amount: number,
  reference?: string,
) {
  const response = await fetch(
    `${API_URL}/transactions/deposit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod,
        amount,
        reference,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to create deposit request",
    );
  }

  return data;
}

export async function createWithdrawal(
  accessToken: string,
  paymentMethod: string,
  phoneNumber: string,
  amount: number,
  accountName?: string,
  note?: string,
) {
  const response = await fetch(
    `${API_URL}/transactions/withdrawal`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod,
        phoneNumber,
        amount,
        accountName,
        note,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to create withdrawal request",
    );
  }

  return data;
}