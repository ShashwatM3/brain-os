import { NextRequest, NextResponse } from 'next/server';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();
    const text = body.text;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 750,
      chunkOverlap: 100,
    })

    const splitDocs = await textSplitter.createDocuments([text])
    
    // Extract just the page content from each document
    const chunks = splitDocs.map(doc => doc.pageContent)

    return NextResponse.json({ response: chunks });
    
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}