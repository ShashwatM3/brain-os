import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/chroma';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();
    const metadata_object = body.metadata_object;
    const collection_name = body.collection_name

    const collection = await client.getOrCreateCollection({
      name: `${collection_name}`,
    });

    await collection.delete({
      where: metadata_object
    })

    return NextResponse.json({ response: "success" });
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}