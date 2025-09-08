import pc from '@/lib/pinecone';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();

    const chunks = body.chunks;
    const category = body.category;
    const media_name = body.media_name;
    const type = body.type;
    const cloud_space_length = body.cloud_space_length;
    const indexName = body.indexName
    const indexHost = body.indexHost;
    const name_namespace = body.name_namespace;

    const namespace = pc.index(indexName, indexHost).namespace(`${name_namespace}`);

    const records: any = []

    chunks.forEach((chunk: any, index: any) => {
      records.push({
        "_id": `media_${media_name}_${index + 1}`,
        "category": category,
        "media_name": media_name,
        "type": type,
        "text": chunk
      })
    })

    await namespace.upsertRecords(records)

    return NextResponse.json({ success: true, records: records });
    
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}