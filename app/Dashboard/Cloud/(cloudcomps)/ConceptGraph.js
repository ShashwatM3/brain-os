import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { GitBranchPlusIcon, GitGraph, LucideNetwork, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Mermaid from '@/components/ui/Mermaid';
import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import elevenLabsClient from '@/lib/elevenlabs';

function ConceptGraph(props) {
  const [loading, setLoading] = useState("");
  const [form, setForm] = useState(false);
  const data = props.data;
  const [selectedFile, setSelectedFile] = useState("");
  const [graphTopic, setGraphTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [finalResult, setFinalResult] = useState(null); 
  const [voiceover, setVoiceover] = useState("");
  const [statusVoiceover, setStatusVoiceover] = useState("");
  
  const steps = [
    'Generating queries',
    'Searching database', 
    'Extracting entities',
    'Creating visualization',
    'Generating narrative'
  ];

  async function generateGraph() {
    if (graphTopic.length > 0 && selectedFile.length > 0) {
      setIsGenerating(true);
      setCurrentStep(0);
      setStepMessage('');
      setFinalResult(null);
  
      try {
        const response = await fetch('/api/ai/concept-graph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: graphTopic,
            file_name: selectedFile,
            collection_name: "myCollection"
          }),
        });
  
        if (!response.ok) {
          console.error('Request failed');
          return;
        }
  
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
  
        if (!reader) {
          console.error('No reader available');
          return;
        }
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsGenerating(false);
            break;
          }
  
          // Decode the chunk
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                if (jsonStr.trim() === '') continue;
                
                const update = JSON.parse(jsonStr);
                
                // Handle different types of updates
                switch (update.type) {
                  case 'progress':
                    setCurrentStep(update.data.step);
                    setStepMessage(update.data.message);
                    console.log(`Step ${update.data.step}: ${update.data.message}`);
                    break;
                    
                  case 'step_complete':
                    setCurrentStep(update.data.step);
                    setStepMessage(update.data.message);
                    console.log(`Step ${update.data.step} completed:`, update.data.data);
                    break;
                    
                  case 'complete':
                    console.log('Generation completed:', update.data);
                    setFinalResult(update.data);
                    setStepMessage('Knowledge graph generation completed!');
                    break;
                    
                  case 'error':
                    console.error('Error:', update.data.message);
                    setStepMessage(`Error: ${update.data.message}`);
                    setIsGenerating(false);
                    break;
                }
              } catch (parseError) {
                console.error('Failed to parse update:', parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        setIsGenerating(false);
        setStepMessage('Connection error occurred');
      }
    } else {
      toast.warning("All fields are required to fill!");
    }
  }

  async function playAudioInBrowser(audioData) {
    try {
      console.log('Audio data type:', typeof audioData);
      console.log('Audio data constructor:', audioData?.constructor?.name);
      
      let audioBuffer;
      
      // Handle ReadableStream from ElevenLabs
      if (audioData instanceof ReadableStream) {
        console.log('Processing ReadableStream audio data...');
        
        const reader = audioData.getReader();
        const chunks = [];
        let totalLength = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            totalLength += value.length;
          }
        } finally {
          reader.releaseLock();
        }
        
        // Combine all chunks into a single Uint8Array
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combinedArray.set(chunk, offset);
          offset += chunk.length;
        }
        
        audioBuffer = combinedArray.buffer;
        console.log('Combined audio buffer size:', audioBuffer.byteLength);
        
      } else if (audioData instanceof ArrayBuffer) {
        audioBuffer = audioData;
      } else if (audioData instanceof Uint8Array) {
        audioBuffer = audioData.buffer;
      } else if (typeof audioData === 'string') {
        // If it's base64 encoded
        try {
          const binaryString = atob(audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBuffer = bytes.buffer;
        } catch (base64Error) {
          console.error('Base64 decode error:', base64Error);
          throw new Error('Invalid base64 audio data');
        }
      } else if (audioData && typeof audioData === 'object' && audioData.audio_base64) {
        // If the response has a specific structure
        try {
          const binaryString = atob(audioData.audio_base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBuffer = bytes.buffer;
        } catch (base64Error) {
          console.error('Base64 decode error:', base64Error);
          throw new Error('Invalid base64 audio data in response');
        }
      } else {
        console.error('Unsupported audio data format:', audioData);
        throw new Error('Unsupported audio data format');
      }
  
      // Validate audio buffer
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error('Empty or invalid audio buffer');
      }
  
      console.log('Final audio buffer size:', audioBuffer.byteLength);
  
      // Create blob and play audio
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and configure audio element
      const audio = new Audio();
      audio.preload = 'auto';
      
      // Set up promise-based playback
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('ended', onEnded);
        };
  
        const onCanPlay = async () => {
          console.log('Audio can play, starting playback...');
          try {
            await audio.play();
            console.log('Audio playback started successfully');
          } catch (playError) {
            console.error('Play error:', playError);
            cleanup();
            URL.revokeObjectURL(audioUrl);
            reject(playError);
          }
        };
  
        const onError = (event) => {
          console.error('Audio load/play error:', audio.error);
          cleanup();
          URL.revokeObjectURL(audioUrl);
          reject(new Error(`Audio failed: ${audio.error?.message || 'Unknown error'}`));
        };
  
        const onEnded = () => {
          console.log('Audio playback completed');
          cleanup();
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
  
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('error', onError);
        audio.addEventListener('ended', onEnded);
        
        // Set source and start loading
        audio.src = audioUrl;
        audio.load();
      });
  
    } catch (error) {
      console.error('Error in playAudioInBrowser:', error);
      throw error;
    }
  }
  
  // Alternative using Web Audio API for better compatibility
  async function playAudioInBrowserWebAudio(audioData) {
    try {
      console.log('Using Web Audio API...');
      
      let audioBuffer;
      
      // Handle ReadableStream
      if (audioData instanceof ReadableStream) {
        console.log('Processing ReadableStream with Web Audio API...');
        
        const reader = audioData.getReader();
        const chunks = [];
        let totalLength = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            totalLength += value.length;
          }
        } finally {
          reader.releaseLock();
        }
        
        // Combine all chunks
        const combinedArray = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combinedArray.set(chunk, offset);
          offset += chunk.length;
        }
        
        audioBuffer = combinedArray.buffer;
      } else if (audioData instanceof ArrayBuffer) {
        audioBuffer = audioData;
      } else if (audioData instanceof Uint8Array) {
        audioBuffer = audioData.buffer;
      } else {
        throw new Error('Unsupported format for Web Audio API');
      }
  
      // Use Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if it's suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Decode audio data
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice());
      
      // Create and play audio
      const source = audioContext.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioContext.destination);
      
      return new Promise((resolve, reject) => {
        source.onended = () => {
          console.log('Web Audio playback completed');
          resolve();
        };
        
        try {
          source.start();
          console.log('Web Audio playback started');
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (error) {
      console.error('Web Audio API error:', error);
      throw error;
    }
  }
  
  // Enhanced speakSample function
  async function speak(text) {
    setStatusVoiceover("Loading in an AI Narrater....")
    try {
      console.log('Starting text-to-speech...');
      
      const audioData = await elevenLabsClient.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
        text: text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      });
  
      setStatusVoiceover("Making the AI understand your graph....")
      
      // Try the main method first
      try {
        setStatusVoiceover("Speaking...")
        setVoiceover(text)
        await playAudioInBrowser(audioData);
        setStatusVoiceover("");
      } catch (htmlAudioError) {
        console.log('HTML Audio failed, trying Web Audio API...', htmlAudioError);
        
        // If HTML audio fails, try Web Audio API
        try {
          setVoiceover(text)
          await playAudioInBrowserWebAudio(audioData);
          toast.success('Audio played successfully with Web Audio API!');
        } catch (webAudioError) {
          console.error('Both audio methods failed:', { htmlAudioError, webAudioError });
          toast.error('Failed to play audio with both methods');
        }
      }
      
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      toast.error('Failed to generate or play audio');
    }
  }

  async function speakOut() {
    if (finalResult) {
      try {
        const audioData = await elevenLabsClient.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
          text: finalResult.voiceover,
          modelId: 'eleven_multilingual_v2',
          outputFormat: 'mp3_44100_128',
        });
        
        await playAudioInBrowser(audioData);
      } catch (error) {
        console.error('Error with text-to-speech:', error);
        toast.error('Failed to play voiceover');
      }
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Launch</Button>
        </SheetTrigger>
        <SheetContent className='p-5 min-w-1/2'>
          <SheetHeader>
            <SheetTitle className='scroll-m-20 text-2xl font-semibold tracking-tight mb-2'>
              <GitBranchPlusIcon className='inline h-6 mr-4 w-auto'/>
              Concept Graph
            </SheetTitle>
            <SheetDescription>
            </SheetDescription>
            <h3 className='bg-neutral-800 text-red-400 px-3 py-1 text-lg font-bold font-mono pl-4 rounded-xl my-4 w-fit'>How it works</h3>
            <h3 className={`text-lg mb-4 ${form ? "text-neutral-500" : ""}`}>
              This tool allows you to convert any of your knowledge sources into a navigable graph of entities where EACH ENTITY represents a bit of information.<br/><br/> <b>Additionally, you can use an AI to help you along the way.</b> 
            </h3>

            {!form ? (
              <Button onClick={() => setForm(true)} className='w-fit' variant={'outline'}>Launch form</Button>
            ):(
            <>
              <div className='mt-2 border-t border-neutral-700 pt-10'>
                <h1 className='mb-4 scroll-m-20 text-xl font-semibold tracking-tight'>1. &nbsp;Choose your data source</h1>
                <div className='flex items-center gap-3 flex-wrap'>
                  {data.filter(media => media.category == "Media").length > 0 ? (
                    data.map((media, index) => (
                      media.category == "Media" && (
                        <Button key={media.file_name} onClick={() => {
                          if (media.file_name == selectedFile) {
                            setSelectedFile("")
                          } else {
                            setSelectedFile(media.file_name)
                          }
                        }} variant={'outline'} className={`${selectedFile==media.file_name ? "!bg-blue-900 text-white" : ""}`}>
                          {media.file_name}
                        </Button>
                      )
                    ))
                  ) : (
                    <div className='w-full h-[25vh] flex items-center justify-center'>
                      <h1 className='text-neutral-500 text-lg'>No media</h1>
                    </div>
                  )}
                </div>
                <br/>
                {/* <h1 className='scroll-m-20 text-xl font-semibold tracking-tight mb-4'>2. &nbsp;Give a topic <span className='text-neutral-500'>(Optional)</span></h1> */}
                <h1 className='scroll-m-20 text-xl font-semibold tracking-tight mb-4'>2. &nbsp;Give a topic</h1>
                <Input placeholder='What do you wanna make the graph about?' value={graphTopic} onChange={(e) => setGraphTopic(e.target.value)}/><br/>
                <Button disabled={isGenerating} onClick={generateGraph}>Generate concept graph <LucideNetwork/></Button>
                <br/><br/>
                <div className="w-full">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-gray-500">{currentStep}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{stepMessage}</p>
                      <div className="flex space-x-1">
                        {steps.map((step, index) => (
                          <div
                            key={index}
                            className={`w-3 h-3 rounded-full ${
                              index < currentStep 
                                ? 'bg-green-500' 
                                : index === currentStep 
                                ? 'bg-blue-500 animate-pulse' 
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {finalResult && (
                <Dialog open={finalResult ? true : false}>
                  <DialogTrigger asChild>
                    <Button className='hidden'></Button>
                  </DialogTrigger>
                  <DialogContent className='h-[80vh] min-w-[80vw] p-7'>
                    <DialogHeader>
                      <DialogTitle></DialogTitle>
                      <DialogDescription>
                      </DialogDescription>
                      <div className='bg-white overflow-scroll'>
                        <Mermaid className='h-[80vh] overflow-scroll' chart={finalResult.mermaid_syntax}/>
                      </div><br/>
                      <div className='flex items-center gap-3'>
                        <Button className='w-fit' onClick={() => speak(finalResult.voiceover)}><Mic className='inline'/><span>Narrative Voiceover</span></Button>
                        {statusVoiceover.length>0 && (
                          <h1 id="" className='flex items-center gap-2'>
                            <div className='h-9 w-9 rounded-full bg-green-500'></div>
                            <span id='fadeInOut'>{statusVoiceover}</span>
                          </h1>
                        )}
                      </div>
                      <h1 className='mt-3 text-neutral-400'>{finalResult.voiceover}</h1>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              )}
            </>
            )}
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <Button variant={'outline'}>More Info</Button>
    </div>
  )
}

export default ConceptGraph