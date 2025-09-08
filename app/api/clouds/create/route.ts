// For CREATING a CLOUD

import pc from "@/lib/pinecone";
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = (body?.name ?? '').toString().trim();
  const description = (body?.description ?? '').toString();
  const indexName = (body?.indexName ?? '').toString().trim();
  let indexHost = (body?.indexHost ?? '').toString().trim();

  if (!name || !indexName || !indexHost) {
    return NextResponse.json(
      { error: "Missing required fields: name, indexName, indexHost" },
      { status: 400 }
    );
  }

  // Pinecone v2 requires full protocol host, ensure https is present
  if (!/^https?:\/\//i.test(indexHost)) {
    indexHost = `https://${indexHost}`;
  }

  try {
    const namespace = pc.index(indexName, indexHost).namespace(`${name}`);
    await namespace.upsertRecords([
      {
          "_id": "rec1",
          "text": `The name of this current searchable cloud is ${name} and it's description is: ${description} `,
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