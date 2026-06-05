import { createChatSession, sendMessage, sendMessageNonStreaming } from "@/lib/onyx";
import { NextRequest } from "next/server";

export const maxDuration = 120;

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

      const reader = onyxResponse.body.getReader();
      const decoder = new TextDecoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          // Send session ID as first event
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "session", chat_session_id: sessionId })}\n\n`
            )
          );

          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                  JSON.parse(trimmed);
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${trimmed}\n\n`)
                  );
                } catch {
                  // Not valid JSON, skip
                }
              }
            }

            // Process remaining buffer
            if (buffer.trim()) {
              try {
                JSON.parse(buffer.trim());
                controller.enqueue(
                  new TextEncoder().encode(`data: ${buffer.trim()}\n\n`)
                );
              } catch {
                // skip
              }
            }

            controller.enqueue(
              new TextEncoder().encode(`data: [DONE]\n\n`)
            );
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Chat-Session-Id": sessionId,
        },
      });
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
    let errMsg = error instanceof Error ? error.message : "Unknown error";
    if (error instanceof Error && error.name === "TimeoutError") {
      errMsg = "La instancia de Onyx no respondió a tiempo. Verifica que esté activa.";
    }
    console.error("Chat API error:", errMsg);
    return Response.json({ error: errMsg }, { status: 500 });
  }
}
