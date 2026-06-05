import { createChatSession, sendMessage, sendMessageNonStreaming } from "@/lib/onyx";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      chat_session_id,
      persona_id,
      parent_message_id,
      stream = true,
    } = body;

    let sessionId = chat_session_id;

    if (!sessionId) {
      const session = await createChatSession(persona_id ?? 0);
      sessionId = session.chat_session_id;
    }

    if (stream) {
      const onyxResponse = await sendMessage({
        message,
        chat_session_id: sessionId,
        parent_message_id,
        stream: true,
        include_citations: true,
      });

      if (!onyxResponse.body) {
        return Response.json(
          { error: "No response body from Onyx" },
          { status: 502 }
        );
      }

      const responseHeaders = new Headers({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Chat-Session-Id": sessionId,
      });

      return new Response(onyxResponse.body, { headers: responseHeaders });
    } else {
      const result = await sendMessageNonStreaming({
        message,
        chat_session_id: sessionId,
        parent_message_id,
        stream: false,
        include_citations: true,
      });

      return Response.json({
        ...result,
        chat_session_id: sessionId,
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat API error:", errMsg);
    return Response.json({ error: errMsg }, { status: 500 });
  }
}
