// For DELETING a CLOUD

import pc from "@/lib/pinecone";
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = body.name;
  const indexName = body.indexName;
  const indexHost = body.indexHost;

  try {
    const index = pc.index(indexName, indexHost);
    const namespace = await index.deleteNamespace(`${name}`);
    return NextResponse.json({ error: null, discharge: namespace });
  } catch(error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}