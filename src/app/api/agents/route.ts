import { listAgents } from "@/lib/onyx";

export async function GET() {
  try {
    const agents = await listAgents();
    return Response.json(agents);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Agents API error:", errMsg);
    return Response.json({ error: errMsg }, { status: 500 });
  }
}
