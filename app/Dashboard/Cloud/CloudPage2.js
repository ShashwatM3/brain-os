'use client'
import { useCounterStore } from '@/app/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpRightFromSquare, AtSign, BookText, Brain, Check, Cloud, Cloudy, Forward, GitBranchPlusIcon, GitGraph, HelpCircleIcon, InfoIcon, MessageCircleMore, MicVocal, MoveRight, MoveRightIcon, NotebookPen, NotebookPenIcon, Plus, PointerIcon, Recycle, RefreshCcw, Repeat, Send, SendHorizonal, SendIcon, Sparkle, SparkleIcon, Sparkles, Trash2, TrendingUpDown, Users, X } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { AuroraText } from '@/components/magicui/aurora-text';
import ContentEditable from "react-contenteditable";
import TurndownService from "turndown";
import GeneralChat from './(cloudcomps)/GeneralChat';
import CreateReport from "./(cloudcomps)/CreateReport"
import HaveADiscussion from "./(cloudcomps)/HaveADiscussion"
import ConceptGraph from "./(cloudcomps)/ConceptGraph"

function CloudPage2() {
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  const [name, setName] = useState("");
  const [data, setData] = useState([]);
  const [description, setDescription] = useState("");
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
  const [fileDescription, setFileDescription] = useState("");
  const [refineStage, setRefineStage] = useState(false);
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // ---------------------Handling note input--------------------------------
  // ------------------------------------------------------------------------
  const [sheetNote, setSheetNote] = useState(false);
  const [html, setHtml] = useState("<h1 class='text-3xl font-bold mb-6'>Untitled</h1><p>Body comes here</p>");
  const contentRef = useRef(null);
  const [noteTitle, setNoteTitle] = useState("");

  const handleChange2 = (e) => {
    setHtml(e.target.value);
  };

  const handleSave = async () => {
    setLoading(true)
    setLoadingText("Retrieving your note content....")
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(html);
    const chunks = await chunking(markdown);
    setLoadingText("Sending to database...")
    try {
      const res = await fetch("/api/chroma/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documents: chunks,
          filename: noteTitle,
          cloud_name: name,
          file_type: "document",
          category: "Notes"
        }),
      });
    
      const data = await res.json();
      if (data && data.response && data.response == "success") {
        toast.success(`Note: ${noteTitle} added to cloud`);
        setLoading(false);
        setNoteTitle("");
        setLoadingText("");
        setHtml("<h1 class='text-3xl font-bold mb-6'>Untitled</h1><p>Body comes here</p>")
        setSheetNote(false)
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
  };
  // ------------------------------------------------------------------------
  // ---------------------Chat with it---------------------------------------
  // ------------------------------------------------------------------------
  const [sheetChatWithIt, setSheetChatWithIt] = useState(false);
  const [chatWithIt, setChatWithIt] = useState([]);
  const [chatWithItFileName, setChatWithItFileName] = useState("");
  const [userInputOverall, setUserInputOverall] = useState("");
  const [thinkHarder, setThinkHarder] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------

  const tools = [
    { name: "General chat", icon: MessageCircleMore, component: GeneralChat },
    { name: "Create Reports", icon: BookText, component: CreateReport },
    // { name: "Have a Discussion", icon: Users, component: HaveADiscussion },
    { name: "Concept Graph", icon: GitBranchPlusIcon, component: ConceptGraph },
    // { name: "Podcast-it", icon: MicVocal, component: GeneralChat },
    // { name: "Create Workflows", icon: TrendingUpDown, component: GeneralChat },
  ];

  function onBack() {
    console.log("🔙 [CloudPage] Back button clicked, navigating to Dashboard");
    setCurrentCloud([]);
    setCurrentCloudName("");
    router.push("/Dashboard");
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
              map.set(obj.file_name, { 
                file_name: obj.file_name, 
                type: obj.type,
                category: obj.category
              });
            }
            return map;
          }, new Map()).values()
        );


        setData(uniqueFiles);
        setCurrentCloud(uniqueFiles);
        setCurrentCloudName(cloud_name);
        setLoading(false);
        setLoadingText("");
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
      const chunks = await chunking(`This content is about: ${fileDescription}. Contents: ${currentMediaDetails.text}`);
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
            file_type: currentMediaDetails.fileType,
            category: "Media"
          }),
        });
      
        const data = await res.json();
        if (data && data.response && data.response == "success") {
          toast.success(`Media: ${currentMediaDetails.name} added to cloud`);
          setLoading(false);
          setLoadingText("");
          setCurrentMediaDetails({});
          setFileName("");
          setFileDescription("")
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
        setLoadingText("");
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

  async function deleteFile(fileName) {
    try {
      const res = await fetch("/api/chroma/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata_object: {
            file_name: fileName,
          },
          collection_name: "myCollection",
        }),
      });
    
      const data = await res.json();
      if (data && data.response == "success") {
        toast.success("Data removed");
        setTimeout(function() {
          refreshCloudData(currentCloudName);
        }, 2000);
      }
    } catch (err) {
      console.error("Error sending POST request:", err);
    }
  }

  // --------------------------------------------------------------------------
  // ----------------------CHAT WITH A SPECIFIC FILE---------------------------
  // --------------------------------------------------------------------------
  function chatWithIt_1(fileName) {
    if (fileName == chatWithItFileName) {
      setSheetChatWithIt(true);
    } else {
      setChatWithIt([]);
      setChatWithItFileName(fileName)
      setSheetChatWithIt(true);
    }
  }

  function askQuestion() {
    setChatWithIt(prev => [...prev, {"role": "user", "content": userInputOverall}])
  }
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------

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

  useEffect(() => {
    if ((html.replace(/<[^>]+>/g, "").trim()).length < 2) {
      setHtml("<h1 class='text-3xl font-bold mb-6'>Untitled</h1><p>Body comes here</p>")
    }
  }, [sheetNote])
  
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
        {(sheetNote || sheetChatWithIt || toolOpen) && (
          <div className="absolute inset-0 bg-black/0 backdrop-blur-lg pointer-events-none z-2"></div>
        )}

        {/* HEADER FOR INFORMATION */}
        <div className='flex items-center justify-between w-full'>
          <div className='w-full'>
            <h1 id="grotesk-font" className='text-4xl mb-5 flex items-center gap-4'>
              <Cloudy className='h-10 w-10'/>
              <span>Your Cloud: <span className='font-bold'>{name}</span></span>
            </h1>
            <h3 className='w-[60%] mb-5 opacity-[70%]'>{description}</h3>
            <div className='flex items-center justify-between pr-4'>
              <div className='flex items-center gap-2'>
                <Button variant={'outline'}>Edit details</Button>
                <Button className='cursor-pointer' onClick={onBack} variant={'secondary'}>Back to Clouds Home <Forward/></Button>
              </div>
              <Button className='bg-neutral-900 cursor-pointer' variant={'ghost'}><InfoIcon/>How to use?</Button>
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
                    className="mb-7 mt-3 text-white"
                    value={fileName || ""}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                  <span className='text-md'>Give us a short description to help us understand<br/> what the file is about</span><br/>
                  <Input
                    className="mb-7 mt-3 text-white"
                    value={fileDescription}
                    placeholder='A roadmap to learning how to be a cook where....'
                    onChange={(e) => setFileDescription(e.target.value)}
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
            <div className='flex items-center justify-center gap-3 h-[36vh]'>
              <div className='p-7 border rounded-lg border-neutral-700 bg-neutral-950 w-1/2 overflow-scroll h-full'>
                <div className='flex items-center justify-between'>
                  <h1 className='scroll-m-20 text-xl font-semibold tracking-tight mb-5'><span className='py-1 px-4 rounded-lg bg-neutral-900 text-red-400'>Layer 1</span> — Your Media</h1>
                  <div className='mb-2'>
                    <Button variant={'outline'} onClick={handleClick}><Plus/> Add media</Button>
                    <input
                      type="file"
                      ref={hiddenFileInput}
                      onChange={handleChange}
                      accept="application/pdf"
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                <div className='flex items-start gap-3 overflow-x-auto overflow-y-hidden'>
                  {console.log(data[0])}
                  {data.filter(media => media.category == "Media").length > 0 ? (
                    data.map((media, index) => (
                      media.category == "Media" && (
                        <div className='w-[30vw] h-[25vh] flex items-start justify-between flex-col py-7 px-6 border flex-shrink-0' key={index}>
                          <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight'>{media.file_name}</h1>
                          <div className='flex items-center justify-between w-full'>
                            <div className='flex items-center gap-2'>
                              <Button className='bg-blue-600 text-white cursor-pointer hover:bg-transparent hover:bg-blue-800'>Open</Button>
                              <Button onClick={() => chatWithIt_1(media.file_name)} variant={'outline'}>Chat with it <Sparkles/></Button>
                              <Button onClick={() => deleteFile(media.file_name)} variant={'outline'}><Trash2/></Button>
                            </div>
                            <h1 className='text-neutral-400'>{capitalizeFirstLetter(media.type)}</h1>
                          </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className='w-full h-[25vh] flex items-center justify-center'>
                      <h1 className='text-neutral-500 text-lg'>No media</h1>
                    </div>
                  )}
                </div>
              </div>
              <div className='p-7 border rounded-lg border-neutral-700 bg-neutral-950 flex-1 h-full'>
                <div className='flex items-center justify-between'>
                  <h1 className='scroll-m-20 text-xl font-semibold tracking-tight mb-5'><span className='py-1 px-4 rounded-lg bg-neutral-900 text-red-400'>Layer 2</span> — Your Notes</h1>
                  <div className=''>
                    <Button onClick={() => {setSheetNote(true)}} variant={'outline'}><Plus/>Add Note</Button>
                    <Sheet open={sheetNote} onOpenChange={setSheetNote}>
                      <SheetTrigger asChild>
                        <button className='hidden'></button>
                      </SheetTrigger>
                      <SheetContent className='min-w-screen bg-transparent'>
                        <SheetHeader>
                          <SheetTitle></SheetTitle>
                          <SheetDescription>
                          </SheetDescription>
                          <div className="min-h-screen text-[#e6e6e6] px-24 py-12 font-sans">
                            <div className="mb-6 flex justify-between items-center">
                              <h1 className='text-neutral-400 font-bold'>✨ New note</h1>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    className='cursor-pointer'
                                    variant={'secondary'}
                                  >
                                    Save Note
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className='border-neutral-600'>
                                  <DialogHeader className='flex justify-center flex-col gap-6'>
                                    <DialogTitle>Review details</DialogTitle>
                                    <DialogDescription>
                                      Check below details to save note
                                    </DialogDescription>
                                    <div>
                                      <h3 className='mb-3 font-semibold'>Name of note</h3>
                                      <Input placeholder='Ex: Avada Kedavra...' value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}/>
                                    </div>
                                    <Button onClick={handleSave}>Upload note</Button>
                                  </DialogHeader>
                                </DialogContent>
                              </Dialog>
                            </div>

                            <ContentEditable
                              innerRef={contentRef}
                              html={html}
                              disabled={false}
                              onChange={handleChange2}
                              className="outline-none prose prose-invert max-w-none text-gray-200"
                            />
                          </div>
                        </SheetHeader>
                      </SheetContent>
                    </Sheet>
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
                  {data.filter(media => media.category == "Notes").length > 0 ? (
                    data.map((media, index) => (
                      media.category == "Notes" && (
                        <div className='w-[30vw] h-[25vh] flex items-start justify-between flex-col py-7 px-6 border' key={index}>
                          <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight flex items-center gap-3'><NotebookPen className='text-neutral-400'/>{media.file_name}</h1>
                          <div className='flex items-center justify-between w-full'>
                            <div className='flex items-center gap-2'>
                              <Button className='bg-blue-600 text-white cursor-pointer hover:bg-transparent hover:bg-blue-800'>Open</Button>
                              <Button onClick={() => chatWithIt_1(media.file_name)} variant={'outline'}>Chat with it <Sparkles/></Button>
                              <Button variant={'outline'}><Trash2/></Button>
                            </div>
                            <h1 className='text-neutral-400'>{capitalizeFirstLetter(media.type)}</h1>
                          </div>
                        </div>
                      )
                    ))
                  ) : (
                    <div className='w-full h-[25vh] flex items-center justify-center'>
                      <h1 className='text-neutral-500 text-lg flex items-center justify-center gap-3'><NotebookPenIcon/><span>No Notes</span></h1>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Sheet open={sheetChatWithIt} onOpenChange={setSheetChatWithIt}>
              <SheetTrigger asChild>
                  <Button className='hidden'></Button>
              </SheetTrigger>
              <SheetContent className='min-w-[100vw] p-5 bg-transparent'>
                <SheetHeader>
                  <SheetTitle className='text-2xl mb-3'>Chat with your media:&nbsp; <span className='py-2 px-4 rounded-lg bg-neutral-900 text-red-400'>{chatWithItFileName}</span></SheetTitle>
                  <SheetDescription className='text-xl'>
                    Ask and gather grounded valuable insights, and research across the media in your cloud, with no limitations
                  </SheetDescription>
                  <div className='w-full flex flex-col h-full relative'>
                    {!loading && chatWithIt.length>0 && (
                      <div className='rounded-lg'>
                        <div className="rounded-lg p-6 pt-2 text-popover-foreground shadow-lg">      
                          <div className="mb-1 flex items-center justify-between">
                            {/* <h2 className="text-lg font-semibold">Your Chat</h2> */}
                            <p className="text-sm text-muted-foreground">Messages</p>
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
                            {chatWithIt.map((message, index) => (
                              message.role == "user" ? (
                                <div key={index} className='flex items-center gap-2'>
                                  <h1>You said: </h1>
                                  <h1 className='p-1 px-3 border rounded-lg'>{message.content}</h1>
                                </div>
                              ):(
                                <div key={index} className='flex items-center gap-4'>
                                  <h1 className='whitespace-nowrap'>AI said: </h1>
                                  <h1 className='p-2 px-5 border rounded-lg border-blue-900'>
                                    {message.content}
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
                          <div className={`flex items-center transition duration-400 bg-n bg-neutral-900 hover:border-none rounded-lg pl-4 pr-2 py-2`}>
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

            <br/>

            {/* Displaying TOOLKIT */}
            <div className='p-7 border rounded-lg border-neutral-700 bg-neutral-950'>
              <div className='flex items-center justify-between mb-5'>
                <h1 className='scroll-m-20 text-xl font-semibold tracking-tight'><span className='py-1 px-4 rounded-lg bg-neutral-900 text-green-400'>Layer 3</span> —  Your <AuroraText className='z-1'>Intelligence</AuroraText> Layer</h1>
                <h3 className='text-neutral-400 font-bold'>Here, you can interact with your data and uncover key insights through several ways</h3>
              </div>
              <div className='flex items-start gap-3 overflow-x-scroll'>
              {tools.map((tool, index) => {
                const IconComponent = tool.icon;
                const ToolComponent = tool.component
                return (
                  <div className='min-w-[20vw] h-[20vh] flex items-start justify-between flex-col py-7 px-6 border' key={index}>
                    <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight flex items-center gap-2' id="grotesk-font">
                      <IconComponent data={data} size={24} />
                      {tool.name}
                    </h1>
                    <div className='flex items-center justify-between w-full'>
                      <div className='flex items-center gap-2'>
                        <ToolComponent data={currentCloud} cloudName={currentCloudName} setBlur={setToolOpen}/>
                      </div>
                    </div>
                  </div>
                );
                })}
                {console.log(currentCloud)}
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