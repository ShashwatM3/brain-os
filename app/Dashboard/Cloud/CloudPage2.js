'use client'
import { useCounterStore } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpRightFromSquare, AtSign, BookText, Brain, Check, Cloud, Cloudy, Forward, MessageCircleMore, MicVocal, MoveRight, MoveRightIcon, Plus, PointerIcon, Recycle, RefreshCcw, Repeat, Send, SendHorizonal, SendIcon, Sparkle, SparkleIcon, Sparkles, TrendingUpDown, Users, X } from 'lucide-react';
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
import { AuroraText } from '@/components/magicui/aurora-text';

function CloudPage2() {
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  const [name, setName] = useState("");
  const [data, setData] = useState([]);
  const [description, setDescription] = useState("");
  const [blur, setBlur] = useState()
  const router = useRouter();
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // --------------------------ZuStand States + Loading----------------------
  // ------------------------------------------------------------------------
  const currentCloud = useCounterStore((state) => state.currentCloud) // This will be set with the DATA OF THIS SPECIFIC CLOUD.....ONLY AFTER the page is loaded and hence function is called to load the data
  const setCurrentCloud = useCounterStore((state) => state.setCurrentCloud); // Setter function for the above
  const currentCloudName = useCounterStore((state) => state.currentCloudName) // Gets the current name of the cloud form state. SET WHEN ENTERING CLOUD
  const setCurrentCloudName = useCounterStore((state) => state.setCurrentCloudName); // Setter function for the above
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  const [sheetOpen, setSheetOpen] = useState(false)
  // ------------------------------------------------------------------------
  // ---------------------Handling file input--------------------------------
  // ------------------------------------------------------------------------
  const hiddenFileInput = useRef(null);
  const [currentMediaDetails, setCurrentMediaDetails] = useState({});
  const [fileName, setFileName] = useState("");
  const [refineStage, setRefineStage] = useState(false);
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------

  const tools = [
    { name: "General chat", icon: MessageCircleMore },
    { name: "Create Reports", icon: BookText },
    { name: "Have a Discussion", icon: Users },
    { name: "Podcast-it", icon: MicVocal },
    { name: "Create Workflows", icon: TrendingUpDown },
  ];

  function onBack() {
    console.log("🔙 [CloudPage] Back button clicked, navigating to Dashboard");
    setCurrentCloud([]);
    setCurrentCloudName("");
    router.push("/Dashboard");
  }

  function matchesFormat(str) {
    const regex = /^Cloud: (.+)\. Description: (.+)$/;
    return regex.test(str);
  }

  function matchesFormat(str) { // This function is for checking for the specific CLOUD DATA Of: "Cloud: <X>. Description: <Y>" which is stored when someone creates a new cloud
    const regex = /^Cloud: (.+)\. Description: (.+)$/;
    return regex.test(str);
  }

  function extractParts(str) { // This function is for EXTRACTING THE DETAILS of the above....
    const regex = /^Cloud: (.+)\. Description: (.+)$/;
    const match = str.match(regex); // returns an array if it matches
    if (match) {
      const cloudPart = match[1];      // everything after "Cloud: " and before "."
      const descriptionPart = match[2]; // everything after "Description: "
      return { name: cloudPart, description: descriptionPart };
    }
    return null; // return null if it doesn't match the format
  }

  async function refreshCloudData(cloud_name) {  // This function will mainly SET: ["LOADING STATE", "IN-COMPONENT DATA", "STORE CLOUD DATA", "STORE CLOUD NAME"]
    setLoading(true);
    try {
      const res = await fetch("/api/chroma/fetch-cloud-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cloud_name: cloud_name,
        }),
      });
    
      const data = await res.json();
      console.log(data);
      if (data && data.response) {  
        const cloud_data = []
        data.response.documents[0].forEach((docString, index) => {
          if (matchesFormat(docString)) {
            setName(extractParts(docString).name)
            setDescription(extractParts(docString).description)
          } else {
            // setData((prevData) => [...prevData, {
            //   chunk: docString,
            //   id: data.response.ids[0][index]
            // }])
            cloud_data.push(
              Object.assign({}, {
                text: docString,
              }, data.response.metadatas[0][index])
            )
          }
        })

        console.log(cloud_data)

        const uniqueFiles = Array.from(
          cloud_data.reduce((map, obj) => {
            if (!map.has(obj.file_name)) {
              map.set(obj.file_name, { file_name: obj.file_name, type: obj.type });
            }
            return map;
          }, new Map()).values()
        );


        setData(uniqueFiles)
        setCurrentCloud(uniqueFiles);
        setCurrentCloudName(cloud_name);
        setLoading(false);
      } 
    } catch (err) {
      console.error("Error sending POST request:", err);
    }
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

  function classifyFile(mimeType) {
    if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType.startsWith("audio/")) {
      return "audio";
    } else if (mimeType.startsWith("video/")) {
      return "video";
    } else if (
      mimeType.startsWith("text/") ||
      mimeType === "application/pdf" ||
      mimeType === "application/msword" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "document";
    } else {
      return "unknown";
    }
  }

  async function addToCloud() {
    console.log("📤 [CloudPage] addToCloud called");
    setLoading(true);
    setLoadingText("Reading through your file...")
    console.log(currentMediaDetails)

    // Start chunking
    if (currentMediaDetails.text.length > 750) {
      const chunks = await chunking(currentMediaDetails.text);
      setLoadingText("Compressing your file....")
      console.log(chunks);

      try {
        const res = await fetch("/api/chroma/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documents: chunks,
            filename: fileName,
            cloud_name: name,
            file_type: currentMediaDetails.fileType
          }),
        });
      
        const data = await res.json();
        if (data && data.response && data.response == "success") {
          toast.success(`Media: ${currentMediaDetails.name} added to cloud`);
          setLoading(false);
          setCurrentMediaDetails({});
          setFileName("");
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
    }
  }

  async function extractText(file) {
    setLoading(true);
    console.log(file)
    pdfToText(file)
      .then(text => {
        // setText(text);
        // setFinalExtracted({
        //   jobDescription: text
        // });
        setLoading(false);
        setFileName(file.name);
        setCurrentMediaDetails({
          name: file.name,
          text: text,
          fileType: classifyFile(file.type)
        })
        setRefineStage(true)
      })
      .catch(error => console.error("Failed to extract text from pdf"))
  }

  function capitalizeFirstLetter(str) { 
    if (!str) return str; // Handle empty strings 
    return str.charAt(0).toUpperCase() + str.slice(1); 
  }

  useEffect(() => { // This useEffect checks the first step to take when a user enters the application
    if (Array.isArray(currentCloud) && currentCloud.length > 0 && currentCloudName) { // This is when the cloud data exists in store
      setData(currentCloud)
      setName(currentCloudName)
    } else if (currentCloudName && (!Array.isArray(currentCloud) || currentCloud.length === 0)) { // This is when only name is there in stored. i.e. WHEN YOU FIRST ENTER THE CLOUD PAGE
      refreshCloudData(currentCloudName);
    } else { // This is when nothing is stored....not the cloud name nor data....usually happens via "DIRECT URL ACCESS"
      onBack();
    }
  }, [])
  
  return (
    <>
    {loading ? (
      <div id="fadeInOut" className='h-screen w-screen flex items-center justify-center gap-3'>
        <Brain className='h-11 w-11'/>
        <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight'>{loadingText}</h1>
      </div>
    ):(
      <div className='cloud-page-main p-8 pt-13'>
        {/* --------------------------------------------------------- */}
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
            <h3 className='w-[45%] mb-5 opacity-[70%]'>{description}</h3>
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

        {/* Add file */}
        {/* {!sheetOpen && (
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
        )} */}

        {/* Reviewing details of file */}
        {Object.keys(currentMediaDetails).length > 0 && refineStage && (
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

        {data.length > 0 ? (
          <div>
            {/* Displaying files */}
            <div className='flex items-center justify-between'>
              <h1 className='scroll-m-20 text-xl font-semibold tracking-tight mb-5'><span className='py-1 px-4 rounded-lg bg-neutral-900 text-red-400'>Layer 1</span> — Your Data</h1>
              <div className=''>
                <Button onClick={handleClick}><Plus/> Add media</Button>
                <input
                  type="file"
                  ref={hiddenFileInput}
                  onChange={handleChange}
                  accept="application/pdf"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div className='flex items-start gap-3'>
              {data.map((media, index) => (
                <div className='w-[30vw] h-[25vh] flex items-start justify-between flex-col py-7 px-6 border' key={index}>
                  <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight'>{media.file_name}</h1>
                  <div className='flex items-center justify-between w-full'>
                    <div className='flex items-center gap-2'>
                      <Button className='bg-blue-600 text-white cursor-pointer hover:bg-transparent hover:bg-blue-800'>Open</Button>
                      <Button variant={'outline'}>Chat with it <Sparkles/></Button>
                    </div>
                    <h1 className='text-neutral-400'>{capitalizeFirstLetter(media.type)}</h1>
                  </div>
                </div>
              ))}
            </div>
            <br/>
            {/* Displaying files */}
            <div className='p-7 border rounded-lg border-neutral-700 bg-neutral-950'>
              <div className='flex items-center justify-between mb-5'>
                <h1 className='scroll-m-20 text-xl font-semibold tracking-tight'><span className='py-1 px-4 rounded-lg bg-neutral-900 text-red-400'>Layer 2</span> —  Your <AuroraText>Intelligence</AuroraText> Layer</h1>
                <h3 className='text-neutral-400 font-bold'>Here, you can interact with your file content in several ways to gain insight</h3>
              </div>
              <div className='flex items-start gap-3 overflow-x-scroll'>
              {tools.map((tool, index) => {
                const IconComponent = tool.icon;
                return (
                  <div className='min-w-[20vw] h-[20vh] flex items-start justify-between flex-col py-7 px-6 border' key={index}>
                    <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight flex items-center gap-2' id="grotesk-font">
                      <IconComponent size={24} />
                      {tool.name}
                    </h1>
                    <div className='flex items-center justify-between w-full'>
                      <div className='flex items-center gap-2'>
                        <Button variant={'outline'} className="flex items-center gap-1">
                          More Info
                        </Button>
                        <Button>Launch</Button>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          </div>
        ):(
          <div className='h-[55vh] w-full flex items-center justify-center'>
            <div className='flex items-center justify-center flex-col gap-3'>
              <Repeat className='h-10 w-10 mb-4'/>
              <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight mb-2'>You haven't uploaded anything yet!</h1>
              <Button onClick={handleClick}>Make your first upload</Button>
              <input
                type="file"
                ref={hiddenFileInput}
                onChange={handleChange}
                accept="application/pdf"
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
      </div>
    )}
    </>
  )
}

export default CloudPage2