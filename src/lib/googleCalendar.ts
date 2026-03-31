const CLIENT_ID = "552476458118-6817lk1jgg1a0i8k438dlsvus98haqgo.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

let tokenClient: any = null;
let accessToken: string | null = localStorage.getItem("google_access_token");
let tokenExpiry: number = Number(localStorage.getItem("google_token_expiry") || "0");

export const isGoogleConnected = () => {
  return !!accessToken && Date.now() < tokenExpiry;
};

export const getGoogleToken = () => accessToken;

export const initGoogleAuth = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject("Google Identity Services não carregou");
      return;
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          reject(response.error);
          return;
        }
        accessToken = response.access_token;
        tokenExpiry = Date.now() + (response.expires_in * 1000);
        localStorage.setItem("google_access_token", accessToken!);
        localStorage.setItem("google_token_expiry", String(tokenExpiry));
        resolve(accessToken!);
      },
    });
    tokenClient.requestAccessToken();
  });
};

export const disconnectGoogle = () => {
  if (accessToken) {
    const google = (window as any).google;
    google?.accounts?.oauth2?.revoke?.(accessToken);
  }
  accessToken = null;
  tokenExpiry = 0;
  localStorage.removeItem("google_access_token");
  localStorage.removeItem("google_token_expiry");
};

const apiCall = async (method: string, url: string, body?: any) => {
  if (!accessToken) throw new Error("Não conectado ao Google");
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // Token expired, clear it
    disconnectGoogle();
    throw new Error("Token expirado, reconecte o Google Calendar");
  }
  if (!res.ok && res.status !== 204) {
    throw new Error(`Google API error: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

export const createGoogleEvent = async (event: {
  summary: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  attendees?: string[]; // emails dos convidados
}) => {
  const hasTime = event.startTime && event.startTime !== "A confirmar";
  const body: any = {
    summary: event.summary,
    description: event.description || "Criado pelo MedWork",
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  if (event.attendees?.length) {
    body.attendees = event.attendees.map(email => ({ email }));
    body.guestsCanModify = false;
    body.sendUpdates = "all";
  }

  if (hasTime) {
    const start = `${event.date}T${event.startTime}:00`;
    const end = event.endTime ? `${event.date}T${event.endTime}:00` : `${event.date}T${event.startTime?.replace(/:\d+/, ":59")}:00`;
    body.start = { dateTime: start, timeZone: "America/Sao_Paulo" };
    body.end = { dateTime: end, timeZone: "America/Sao_Paulo" };
  } else {
    body.start = { date: event.date };
    body.end = { date: event.date };
  }

  const result = await apiCall("POST", `${CALENDAR_API}/calendars/primary/events`, body);
  return result?.id || "";
};

export const updateGoogleEvent = async (eventId: string, event: {
  summary: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  attendees?: string[];
}) => {
  const hasTime = event.startTime && event.startTime !== "A confirmar";
  const body: any = {
    summary: event.summary,
    description: event.description || "Criado pelo MedWork",
  };

  if (event.attendees?.length) {
    body.attendees = event.attendees.map(email => ({ email }));
    body.sendUpdates = "all";
  }

  if (hasTime) {
    const start = `${event.date}T${event.startTime}:00`;
    const end = event.endTime ? `${event.date}T${event.endTime}:00` : `${event.date}T${event.startTime?.replace(/:\d+/, ":59")}:00`;
    body.start = { dateTime: start, timeZone: "America/Sao_Paulo" };
    body.end = { dateTime: end, timeZone: "America/Sao_Paulo" };
  } else {
    body.start = { date: event.date };
    body.end = { date: event.date };
  }

  await apiCall("PUT", `${CALENDAR_API}/calendars/primary/events/${eventId}`, body);
};

export const deleteGoogleEvent = async (eventId: string) => {
  await apiCall("DELETE", `${CALENDAR_API}/calendars/primary/events/${eventId}`);
};
