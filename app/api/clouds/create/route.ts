// For CREATING a CLOUD

import pc from "@/lib/pinecone";
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = body.name;
  const description = body.description;
  const indexName = body.indexName;
  const indexHost = body.indexHost;

  try {
    const namespace = pc.index(indexName, indexHost).namespace(`${name}`);
    await namespace.upsertRecords([
      {
          "_id": "rec1",
          "text": `The name of this current searchable namespace is ${name} and it's description is: ${description} `,
          "category": "Description", 
      },
    ]);
    return NextResponse.json({ error: null });
  } catch(error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}