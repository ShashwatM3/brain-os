import { NextRequest, NextResponse } from "next/server";
import { CloudClient, Collection, Metadata } from "chromadb";

interface AddDataRequest {
  ids: string[];
  documents: string[];
  metadatas: Metadata[];
}

let chromaClient: CloudClient | null = null;
let myCollection: Collection | null = null;

function getChromaClient(): CloudClient {
  if (chromaClient) return chromaClient;

  const apiKey = process.env.CHROMA_API_KEY;
  const tenant = process.env.CHROMA_TENANT;
  const database = process.env.CHROMA_DATABASE;

  if (!apiKey) {
    throw new Error("CHROMA_API_KEY is missing. Set it in environment variables.");
  }
  if (!tenant) {
    throw new Error("CHROMA_TENANT is missing. Set it in environment variables.");
  }
  if (!database) {
    throw new Error("CHROMA_DATABASE is missing. Set it in environment variables.");
  }

  chromaClient = new CloudClient({ apiKey, tenant, database });
  return chromaClient;
}

const getMyCollection = async () => {
  if (!myCollection) {
    const client = getChromaClient();
    myCollection = await client.getOrCreateCollection({
      name: "myCollection",
    });
  }
  return myCollection;
};

export async function POST(request: NextRequest) {
  try {
    const data: AddDataRequest = await request.json();
    const collection = await getMyCollection();

    await collection.add({
      ids: data.ids,
      documents: data.documents,
      metadatas: data.metadatas,
    });

    return NextResponse.json({
      success: true,
      message: "Data added successfully",
      data,
    });
  } catch (error) {
    console.error("/api/chroma/add error:", error);
    return NextResponse.json(
      { success: false, message: (error as any)?.message ?? "Failed to add data" },
      { status: 500 },
    );
  }
}

