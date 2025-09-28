// For creating a collection

import client from '@/lib/chroma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = body.name;
    const description = body.description;
    const collection_name = body.collection_name
    const ids = [`Cloud_${name}_DESCRIPTION`];
    const documents = [`Cloud: ${name}. Description: ${description}`];

    const metadatas = [
      {"cloud": name}
    ]

    const collection = await client.getOrCreateCollection({
      name: collection_name,
      metadata: { 'description': `Collection for user: ${collection_name}` }
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