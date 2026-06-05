const ONYX_API_URL = process.env.ONYX_API_URL || "https://cloud.onyx.app/api";
const ONYX_API_KEY = process.env.ONYX_API_KEY || "";
const ONYX_USERNAME = process.env.ONYX_USERNAME || "";
const ONYX_PASSWORD = process.env.ONYX_PASSWORD || "";
const TUNNEL_USER = process.env.TUNNEL_USER || "";
const TUNNEL_PASSWORD = process.env.TUNNEL_PASSWORD || "";

let cachedSessionCookie: string | null = null;
let cookieExpiresAt = 0;

function tunnelAuthHeader(): Record<string, string> {
  if (TUNNEL_USER && TUNNEL_PASSWORD) {
    const encoded = Buffer.from(`${TUNNEL_USER}:${TUNNEL_PASSWORD}`).toString(
      "base64"
    );
    return { Authorization: `Basic ${encoded}` };
  }
  return {};
}

function bearerAuthHeader(): Record<string, string> {
  if (ONYX_API_KEY) {
    return { Authorization: `Bearer ${ONYX_API_KEY}` };
  }
  return {};
}

async function loginAndGetCookie(): Promise<string> {
  if (cachedSessionCookie && Date.now() < cookieExpiresAt) {
    return cachedSessionCookie;
  }

  const res = await fetch(`${ONYX_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      ...tunnelAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: ONYX_USERNAME,
      password: ONYX_PASSWORD,
    }),
    redirect: "manual",
  });

  if (res.status !== 204 && res.status !== 200) {
    const text = await res.text();
    throw new Error(`Login failed: ${res.status} ${text}`);
  }

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie returned from login");
  }

  const match = setCookie.match(/fastapiusersauth=([^;]+)/);
  if (!match) {
    throw new Error("fastapiusersauth cookie not found in response");
  }

  cachedSessionCookie = match[1];
  // Cache for 20 minutes (cookie usually lasts longer but be safe)
  cookieExpiresAt = Date.now() + 20 * 60 * 1000;

  return cachedSessionCookie;
}

async function getHeaders(): Promise<Record<string, string>> {
  const hasTunnel = Boolean(TUNNEL_USER && TUNNEL_PASSWORD);
  const hasOnyxCredentials = Boolean(ONYX_USERNAME && ONYX_PASSWORD);

  if (hasTunnel && hasOnyxCredentials) {
    // Tunnel mode: use Basic Auth for tunnel + Cookie for Onyx
    const cookie = await loginAndGetCookie();
    return {
      ...tunnelAuthHeader(),
      Cookie: `fastapiusersauth=${cookie}`,
      "Content-Type": "application/json",
    };
  } else if (ONYX_API_KEY) {
    // Direct mode: use Bearer token
    return {
      ...bearerAuthHeader(),
      "Content-Type": "application/json",
    };
  } else {
    return {
      "Content-Type": "application/json",
    };
  }
}

export interface ChatSessionCreationRequest {
  persona_id?: number;
  description?: string;
}

export interface CreateChatSessionID {
  chat_session_id: string;
}

export interface SendMessageRequest {
  message: string;
  chat_session_id?: string;
  chat_session_info?: {
    persona_id?: number;
  };
  parent_message_id?: number | null;
  stream?: boolean;
  include_citations?: boolean;
  search_filters?: {
    source_type?: string[];
    document_set?: string[];
    time_cutoff?: string;
    tags?: Record<string, string>;
  };
}

export interface SearchDoc {
  document_id: string;
  semantic_identifier: string;
  link: string;
  blurb: string;
  source_type: string;
  updated_at: string;
}

export interface CitationInfo {
  citation_num: number;
  document_id: string;
}

export interface ChatFullResponse {
  answer: string;
  answer_citationless: string;
  pre_answer_reasoning: string | null;
  top_documents: SearchDoc[];
  citation_info: CitationInfo[];
  message_id: number;
  chat_session_id: string | null;
  error_msg: string | null;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  is_visible: boolean;
  is_public: boolean;
  is_featured: boolean;
}

export async function createChatSession(
  personaId = 0
): Promise<CreateChatSessionID> {
  const headers = await getHeaders();
  const res = await fetch(`${ONYX_API_URL}/chat/create-chat-session`, {
    method: "POST",
    headers,
    body: JSON.stringify({ persona_id: personaId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create chat session: ${res.status} ${text}`);
  }
  return res.json();
}

export async function sendMessage(req: SendMessageRequest): Promise<Response> {
  const headers = await getHeaders();
  const body = {
    ...req,
    stream: req.stream ?? true,
    include_citations: req.include_citations ?? true,
  };

  const res = await fetch(`${ONYX_API_URL}/chat/send-chat-message`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send message: ${res.status} ${text}`);
  }
  return res;
}

export async function sendMessageNonStreaming(
  req: SendMessageRequest
): Promise<ChatFullResponse> {
  const headers = await getHeaders();
  const body = {
    ...req,
    stream: false,
    include_citations: req.include_citations ?? true,
  };

  const res = await fetch(`${ONYX_API_URL}/chat/send-chat-message`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send message: ${res.status} ${text}`);
  }
  return res.json();
}

export async function searchDocuments(query: string, sourceTypes?: string[]) {
  const headers = await getHeaders();
  const body: Record<string, unknown> = { query };
  if (sourceTypes && sourceTypes.length > 0) {
    body.filters = { source_type: sourceTypes };
  }

  const res = await fetch(`${ONYX_API_URL}/search`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Search failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function listAgents(): Promise<Agent[]> {
  const headers = await getHeaders();
  const res = await fetch(`${ONYX_API_URL}/persona`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list agents: ${res.status} ${text}`);
  }
  return res.json();
}

export { ONYX_API_URL };
