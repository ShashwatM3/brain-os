import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/chroma';

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { metadata_object, collection_name } = body;

    const collection = await client.getOrCreateCollection({
      name: collection_name,
    });

    await collection.delete({
      where: metadata_object,
    });

    return NextResponse.json({ response: "success" });
  } catch (error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to delete: " + error.message },
      { status: 500 }
    );
  }
}
