import { searchDocuments } from "@/lib/onyx";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query, source_types } = await request.json();

    if (!query || typeof query !== "string") {
      return Response.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const results = await searchDocuments(query, source_types);
    return Response.json(results);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Search API error:", errMsg);
    return Response.json({ error: errMsg }, { status: 500 });
  }
}
