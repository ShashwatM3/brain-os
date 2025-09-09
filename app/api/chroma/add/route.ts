// For adding to collection

import client from '@/lib/chroma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const documents = body.documents;
    const filename = body.filename;

    const ids = Array.from({ length: documents.length }, (_, i) => (i + 1).toString());
    const metadatas = Array.from({ length: documents.length }, () => ({ file_name: `${filename}` }));

    const collection = await client.getOrCreateCollection({
      name: 'myCollection',
      metadata: { 'description': `Collection for user: ${"myCollection"}` }
    });

    await collection.add({
      ids: ids,
      documents: documents,
      metadatas: metadatas
    });

    return NextResponse.json({ response: "success" });
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}