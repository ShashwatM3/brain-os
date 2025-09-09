// For creating a collection

import client from '@/lib/chroma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const cloud_name = body.cloud_name;

    const collection = await client.getOrCreateCollection({
      name: 'myCollection',
      metadata: { 'description': `Collection for user: ${"myCollection"}` }
    });

    const resp = await collection.query({
      queryTexts: [`Cloud: ${cloud_name}`],
      where: { cloud: cloud_name }
    })

    return NextResponse.json({ response: resp });
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}