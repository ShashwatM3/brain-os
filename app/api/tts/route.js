// app/api/tts/route.js (for App Router)
import { NextResponse } from 'next/server';
import { getElevenLabsClientSafe } from '@/lib/elevenlabs';

export async function POST(request) {
  try {
    const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const client = getElevenLabsClientSafe();
    
    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Convert stream to buffer
    const chunks = [];
    const reader = audioStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return the audio data
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    if ((JSON.stringify(error)).includes("quota_exceeded")) {
      return NextResponse.json(
        {"error": "Credit limit reached"}
      )
    } else {
      console.error('TTS API Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate audio' }, 
        { status: 500 }
      );
    }

  }
}