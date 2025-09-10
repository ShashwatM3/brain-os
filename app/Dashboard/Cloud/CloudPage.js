'use client'
import { useCounterStore } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpRightFromSquare, AtSign, Check, Cloud, Cloudy, Forward, MoveRight, MoveRightIcon, Plus, PointerIcon, Recycle, RefreshCcw, Send, SendHorizonal, SendIcon, Sparkle, SparkleIcon, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react'
import pdfToText from 'react-pdftotext'
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ReactMarkdown from 'react-markdown';
import { Switch } from '@/components/ui/switch';

function CloudPage() {
  console.log("🎯 [CloudPage] Component initialized");
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  const [name, setName] = useState("");
  const [data, setData] = useState([]);
  const [blur, setBlur] = useState()
  const router = useRouter();
  const currentCloud = useCounterStore((state) => state.currentCloud)
  const setCurrentCloud = useCounterStore((state) => state.setCurrentCloud);
  const currentCloudName = useCounterStore((state) => state.currentCloudName)
  const setCurrentCloudName = useCounterStore((state) => state.setCurrentCloudName);
  function onBack() {
    console.log("🔙 [CloudPage] Back button clicked, navigating to Dashboard");
    setCurrentCloud([]);
    setCurrentCloudName("");
    router.push("/Dashboard");
  }
  console.log("📊 [CloudPage] Store values - currentCloud:", currentCloud, "currentCloudName:", currentCloudName);
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false)
  const [mediaNames, setMediaNames] = useState([]);
  // ------------------------------------------------------------------------
  // ---------------------Handling file input-----------------------------
  // ------------------------------------------------------------------------
  const hiddenFileInput = useRef(null);
  const [currentMediaDetails, setCurrentMediaDetails] = useState({});
  const [fileName, setFileName] = useState("");
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // ---------------------Handling chat input-----------------------------
  // ------------------------------------------------------------------------
  const [userInputOverall, setUserInputOverall] = useState("");
  const [thinkHarder, setThinkHarder] = useState(false)
  const [messages, setMessages] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------

  async function refreshCloudData(namespace) { // This function will mainly SET: ["LOADING STATE", "IN-COMPONENT DATA", "STORE CLOUD DATA", "STORE CLOUD"]
    console.log("🔄 [CloudPage] refreshCloudData called with namespace:", namespace);
    setLoading(true);
    console.log("⏳ [CloudPage] Setting loading state to true");
    toast.info("Looking for your data...")
    console.log("🔍 [CloudPage] Starting API call to fetch-record-ids");
    
    // NOW GETTING THE VECTOR IDS
    try {
      const res = await fetch("/api/clouds/fetch-record-ids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: namespace,
          indexName: process.env.NEXT_PUBLIC_INDEX_NAME,
          indexHost: process.env.NEXT_PUBLIC_INDEX_HOST,
        }),
      });
    
      const data = await res.json();
      console.log("📋 [CloudPage] fetch-record-ids response:", data);
      
      if (data && data.response && data.response.length>0) {
        console.log("✅ [CloudPage] Found", data.response.length, "record IDs:", data.response);
        toast.info(`Loading media from your cloud...`);

        console.log("🔍 [CloudPage] Starting API call to fetch-records");
        // NOW GETTING THE VECTORS
        try {
          const res = await fetch("/api/clouds/fetch-records", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: namespace,
              indexName: process.env.NEXT_PUBLIC_INDEX_NAME,
              indexHost: process.env.NEXT_PUBLIC_INDEX_HOST,
              ids: data.response
            }),
          });
        
          const data2 = await res.json();
          console.log("📊 [CloudPage] fetch-records response:", data2);
          
          if (data2 && data2.response && data2.response.length>0) {
            console.log("✅ [CloudPage] Successfully loaded", data2.response.length, "records");
            setLoading(false);
            console.log("⏳ [CloudPage] Setting loading state to false");
            
            setData(data2.response)
            console.log("💾 [CloudPage] Setting local data state");
            
            setCurrentCloud(data2.response)
            console.log("🏪 [CloudPage] Updating store with currentCloud data");
            
            setCurrentCloudName(namespace)
            console.log("🏪 [CloudPage] Updating store with currentCloudName:", namespace);
            
            toast.info(`Loading in your data...`);
            console.log("🎉 [CloudPage] Data loading completed successfully");
          } else {
            console.log("⚠️ [CloudPage] No records found in fetch-records response");
          }
        } catch (err) {
          console.error("❌ [CloudPage] Error in fetch-records:", err);
        }
      } else {
        console.log("⚠️ [CloudPage] No record IDs found or empty response");
      }
    } catch (err) {
      console.error("❌ [CloudPage] Error in fetch-record-ids:", err);
    }
  }

  useEffect(() => {
    console.log("🔄 [CloudPage] useEffect triggered");
    console.log("📊 [CloudPage] useEffect - currentCloud:", currentCloud, "currentCloudName:", currentCloudName);
    
    if (Array.isArray(currentCloud) && currentCloud.length > 0 && currentCloudName) {
      console.log("✅ [CloudPage] useEffect - Data available, setting up component");
      setData(currentCloud)
      setName(currentCloudName)
      console.log("📝 [CloudPage] useEffect - Set name to:", currentCloudName);
      
      setMediaNames([
        ...new Set(
          currentCloud
            .map(item => item.metadata.media_name)
            .filter(Boolean)
        )
      ]);
      console.log("📁 [CloudPage] useEffect - Set mediaNames:", [...new Set(currentCloud.map(item => item.metadata.media_name).filter(Boolean))]);
      
      const descVector = currentCloud.find(v => v.metadata.category === "Description");
      if (descVector) {
        setDescription(descVector.metadata.text);
        console.log("📄 [CloudPage] useEffect - Set description from vector");
      }
    } else if (currentCloudName && (!Array.isArray(currentCloud) || currentCloud.length === 0)) {
      console.log("🔄 [CloudPage] useEffect - Cloud name available but no data, calling refreshCloudData");
      // If we have the cloud name but no data yet, load it
      refreshCloudData(currentCloudName);
    } else {
      console.log("⚠️ [CloudPage] useEffect - No cloud name or data available");
      console.log("📊 [CloudPage] useEffect - currentCloud:", currentCloud, "currentCloudName:", currentCloudName);
    }
  }, [data]);

  function formatNumber(num) {
    if (isNaN(num)) return num; // return as is if not a number
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    if (!fileUploaded) return;

    // Check MIME type
    if (fileUploaded.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    extractText(fileUploaded);
  };

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  async function chunking(text) {
    try {
      const res = await fetch("/api/helpers/chunking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
        }),
      });
    
      const data = await res.json();
      return data.response
    } catch (err) {
      console.error("Error sending POST request:", err);
    }
  }

  async function addToCloud() {
    console.log("📤 [CloudPage] addToCloud called");
    setLoading(true);
    console.log("⏳ [CloudPage] Setting loading state to true for addToCloud");
    
    if (currentMediaDetails.text.length > 750) {
      console.log("📝 [CloudPage] Text length > 750, proceeding with chunking");
      const chunks = await chunking(currentMediaDetails.text)
      console.log("✂️ [CloudPage] Chunking completed, chunks:", chunks);
      
      try {
        console.log("📤 [CloudPage] Starting upload to cloud");
        const res = await fetch("/api/clouds/media/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chunks: chunks,
            category: "Media",
            media_name: currentMediaDetails.name,
            type: "PDF",
            cloud_space_length: data.length,
            indexName: process.env.NEXT_PUBLIC_INDEX_NAME,
            indexHost: process.env.NEXT_PUBLIC_INDEX_HOST,
            name_namespace: name
          }),
        });
      
        const data2 = await res.json();
        console.log("📤 [CloudPage] Upload response:", data2);
        
        if (data2 && data2.success) {
          console.log("✅ [CloudPage] Upload successful");
          toast.success(`Media: ${currentMediaDetails.name} added to space`);
          setLoading(false);
          console.log("⏳ [CloudPage] Setting loading state to false");
          
          setCurrentMediaDetails({});
          setFileName("");
          console.log("🧹 [CloudPage] Cleared media details and filename");
          
          setTimeout(function() {
            console.log("⏰ [CloudPage] AddToCloud timeout triggered, calling refreshCloudData");
            refreshCloudData(name)
          }, 3000);
        } else {
          console.log("❌ [CloudPage] Upload failed:", data2);
        }
      } catch (err) {
        console.error("❌ [CloudPage] Error in addToCloud upload:", err);
      }
    } else {
      console.log("⚠️ [CloudPage] Text length <= 750, not proceeding with upload");
    }
  }

  async function extractText(file) {
    setLoading(true);
    pdfToText(file)
      .then(text => {
        // setText(text);
        // setFinalExtracted({
        //   jobDescription: text
        // });
        setLoading(false);
        setFileName(currentMediaDetails.name);
        setCurrentMediaDetails({
          name: file.name,
          text: text,
        })
      })
      .catch(error => console.error("Failed to extract text from pdf"))
  }
  
  async function askQuestion() {
    console.log("Messages, ", messages)
    setMessages(prevMessages => ([
      ...prevMessages,
      {"role": "user", "content": userInputOverall},
    ]))
    const res = await fetch('/api/ai/rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText: `Convo until now: ${JSON.stringify(messages)} \n\n. User's query: ${userInputOverall}`,
        indexName: process.env.NEXT_PUBLIC_INDEX_NAME,
        indexHost: process.env.NEXT_PUBLIC_INDEX_HOST,
        cloudName: name
      }),
    });

    if (!res.ok) {
      console.error('Request failed');
      return;
    }
  
    const data = await res.json();
    console.log(data);
    if (data && data.response && data.response.length>0) {
      setMessages(prevMessages => ([
        ...prevMessages,
        {"role": "assistant", "content": data.response},
      ]))
    }
  }

  return (
    <>
    <div className={`cloud-page-main p-8 pt-13`}>
      {/* Setting BLUR Overlay */}
      {sheetOpen && (
          <div className="absolute inset-0 bg-black/0 backdrop-blur-lg pointer-events-none"></div>
      )}

      {/* HEADER FOR INFORMATION */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 id="grotesk-font" className='text-4xl mb-5 flex items-center gap-4'>
            <Cloudy className='h-10 w-10'/>
            <span>Your Cloud: <span className='font-bold'>{name}</span></span>
          </h1>
          {/* <h3 className='w-[45%] mb-5 opacity-[70%]'>{description}</h3> */}
          <div className='flex items-center gap-2'>
            <Button variant={'outline'}>Edit details</Button>
            <Button className='cursor-pointer' onClick={onBack} variant={'secondary'}>Back to Clouds Home <Forward/></Button>
          </div>
        </div>
        <div className='border border-neutral-700 rounded-md p-5 w-[30vw]'>
          <h1 className='grotesk-font mb-2 text-2xl font-mono'>Refresh Data</h1>
          <h3 className='text-neutral-300 mb-5'>Load new fresh data</h3>
          <Button onClick={() => {
            console.log("🔄 [CloudPage] Refresh button clicked");
            setLoading(true)
            console.log("⏳ [CloudPage] Setting loading state to true for refresh");
            setTimeout(function() {
              console.log("⏰ [CloudPage] Refresh timeout triggered, calling refreshCloudData");
              refreshCloudData(name)
              setLoading(false)
              console.log("⏳ [CloudPage] Setting loading state to false after refresh");
            }, 3000);
          }} className='cursor-pointer' variant={'outline'}><RefreshCcw/> Refresh</Button>
        </div>
      </div>

      {/* PLUS BUTTON — ADDING MEDIA */}
      {!sheetOpen && (
        <div className='fixed bottom-10 right-10'>
          <h1 className='p-4 rounded-lg cursor-pointer bg-white text-black' onClick={handleClick} variant={'secondary'}>
            <Plus className='h-7 w-7'/>
          </h1>
          <input
            type="file"
            ref={hiddenFileInput}
            onChange={handleChange}
            accept="application/pdf"
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* LOADING SCREEN */}
      <div className={`${loading ? "fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black opacity-[40%]" : "hidden"}`}>
        <h1 id="fadeInOut" className='text-5xl font-bold opacity-[100%] z-5'>Loading....</h1>
      </div>

      {/* DIALOG — REVIEW DETAILS OF FILE */}
      {Object.keys(currentMediaDetails).length > 0 && (
        <Dialog open={Object.keys(currentMediaDetails).length > 0 ? true : false}>
          <DialogTrigger>
            <h1 className='hidden'></h1>
          </DialogTrigger>
          <DialogContent className='w-[35vw'>
            <DialogHeader>
              <DialogTitle className='mb-3'>Review details</DialogTitle>
              <DialogDescription className='mb-5 text-md'>
                <span className='font-bold text-md'>Media Name</span><br/>
                <Input
                  className="mb-4 mt-3 text-white"
                  value={fileName || ""}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <><span className='font-bold'>Media Size: </span>{currentMediaDetails.text.length} Chars</>
              </DialogDescription>
              <div className='flex items-center gap-2'>
                <Button onClick={addToCloud}>Add to cloud</Button>
                <Button 
                  onClick={() => {
                    setCurrentMediaDetails({});
                    if (hiddenFileInput.current) {
                      hiddenFileInput.current.value = null; // ✅ this resets it properly
                    }
                  }} 
                  variant={'secondary'}
                >
                  Exit
                </Button>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}

      <br/>

      {/* LOADING IN DATA */}
      <div className='flex items-start gap-3'>
        {mediaNames.map((media, index) => (
          <div className='w-[30vw] min-h-[30vh] flex items-start justify-between flex-col py-7 px-6 border' key={index}>
            <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight'>{media.substring(0, media.lastIndexOf("."))}</h1>
            <div className='flex items-center justify-between w-full'>
              <div className='flex items-center gap-2'>
                <Button className='bg-blue-600 text-white cursor-pointer hover:bg-transparent hover:bg-blue-800'>Open</Button>
                <Button variant={'outline'}>Chat with it <Sparkles/></Button>
              </div>
              <h1 className='text-neutral-400'>{(media.includes("pdf") || media.includes("txt")) && "Document"}</h1>
            </div>
          </div>
        ))}
      </div>
    </div>


    {!loading && (
      <Sheet onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <div className='flex items-center justify-center w-screen fixed bottom-8 py-4'>
            <Button variant={'outline'} className='hover:!text-blue-400 cursor-pointer'>Chat with your CLOUD <SendHorizonal/></Button>
          </div>
        </SheetTrigger>
        <SheetContent className='min-w-[100vw] p-5 bg-transparent'>
          <SheetHeader>
            <SheetTitle className='text-2xl mb-3'>Chat with your cloud</SheetTitle>
            <SheetDescription className='text-xl'>
              Ask and gather grounded valuable insights, and research across the media in your cloud, with no limitations
            </SheetDescription>
            <div className='w-full flex flex-col h-full relative'>
              {!loading && messages.length>0 && (
                <div className='rounded-lg'>
                  <div className="rounded-lg p-6 pt-2 text-popover-foreground shadow-lg">      
                    <div className="mb-4 flex items-center justify-between">
                      {/* <h2 className="text-lg font-semibold">Your Chat</h2> */}
                      <p className="text-sm text-muted-foreground">Messages with your cloud: {name}</p>
                      <div className='flex items-center gap-3'>
                        <Switch checked={thinkHarder} onCheckedChange={setThinkHarder}/>
                        {thinkHarder ? (
                          <h1 className='flex items-center gap-1'><Check className='text-green-500'/> Think Harder</h1>
                          // <h1 className='flex items-center gap-1 text-green-400 font-bold'> Think Harder</h1>
                        ):(
                          <h1 className='flex items-center gap-1 text-neutral-500'>— Think Normal</h1>
                        )}
                      </div>
                    </div>
                    <div className='p-5 border rounded-lg h-[63vh] overflow-y-auto w-full flex flex-col gap-5 pt-7 pb-28'>
                      {messages.map((message, index) => (
                        message.role == "user" ? (
                          <div key={index} className='flex items-center gap-2'>
                            <h1>You said: </h1>
                            <h1 className='p-1 px-3 border rounded-lg'>{message.content}</h1>
                          </div>
                        ):(
                          <div key={index} className='flex items-center gap-4'>
                            <h1 className='whitespace-nowrap'>AI said: </h1>
                            <h1 className='p-2 px-5 border rounded-lg border-blue-900'>
                              <ReactMarkdown>
                              {message.content}
                              </ReactMarkdown>
                            </h1>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* USER INPUT */}
              {!loading && (
                <div className='fixed bottom-10 w-full flex items-center justify-center mt-4'>
                  <div className='w-[80%]'>
                    <div className={`flex items-center transition duration-400 bg-transparent hover:bg-neutral-900 ${sheetOpen && ("!bg-neutral-900")}  hover:border-none rounded-lg pl-4 pr-2 py-2`}>
                      <textarea
                        rows="1"
                        placeholder="Ask anything about the info in your cloud..."
                        className="flex-1 bg-transparent text-neutral-200 placeholder-neutral-500 focus:outline-none resize-none text-base leading-relaxed px-2 py-1"
                        value={userInputOverall}
                        id="grotesk-font"
                        onChange={(e) => setUserInputOverall(e.target.value)}
                      ></textarea>
                      <button
                        onClick={askQuestion}
                        className="ml-3 p-2 rounded-lg h-full bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
                      >
                        <SendHorizonal className='h-5 w-auto'/>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )}
    </>
  )
}

export default CloudPage;