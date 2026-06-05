export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  documents?: DocumentResult[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Citation {
  citation_num: number;
  document_id: string;
  link?: string;
  title?: string;
}

export interface DocumentResult {
  document_id: string;
  semantic_identifier: string;
  link: string;
  blurb: string;
  source_type: string;
  updated_at: string;
  content?: string;
  score?: number;
}

export interface AgentInfo {
  id: number;
  name: string;
  description: string;
  is_visible: boolean;
}

export interface ChatSession {
  id: string;
  agentId: number;
  messages: ChatMessage[];
  createdAt: Date;
}
