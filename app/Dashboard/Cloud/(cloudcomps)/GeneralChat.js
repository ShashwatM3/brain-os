import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from '@/components/ui/switch';
import { Check, Circle, SendHorizonal } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import MarkdownComponent from "@/components/ui/MarkdownComponent"

function GeneralChat(props) {
  const cloudData = props.data;
  const name = props.cloudName
  const setBlur = props.setBlur;

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [thinkHarder, setThinkHarder] = useState(false);
  const [userInputOverall, setUserInputOverall] = useState("");
  const textareaRef = useRef(null);
  const [contexts, setContexts] = useState([]);

  const [loadingResponse, setLoadingResponse] = useState(false);
  
  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [userInputOverall]);
  
  async function askQuestion() {
    setLoadingResponse(true)
    setMessages(prev => [...prev, {"role": "user", "content": userInputOverall}])
    try {
      const res = await fetch("/api/ai/rag-chroma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputText: userInputOverall,
          collectionName: "myCollection",
        }),
      });
      const data = await res.json();
      if (data && data.response && data.response.length>0) {
        setUserInputOverall("");
        setMessages(prevMessages => ([
          ...prevMessages,
          {"role": "assistant", "content": data.response},
        ]))
        if (data.documents && data.documents.length>0) {
          const uniqueFileNames = [...new Set(data.documents.map(item => item.file_name))];
          console.log(uniqueFileNames);
          setContexts(prev => [...prev, uniqueFileNames]);
        } else {
          setContexts(prev => [...prev, []])
        }
        setLoadingResponse(false);
      }
    } catch (err) {
      console.error("Error sending POST request:", err);
      setLoadingResponse(false);
    }
  }

  return (
    <div className='h-full w-full bg-transparent'>
      <div className='flex items-center gap-2'>
        <Sheet onOpenChange={setBlur}>
          <SheetTrigger asChild>
            <Button>Launch</Button>
          </SheetTrigger>
          <SheetContent className='min-w-screen p-5 bg-transparent'>
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
                      <div className='p-5 border relative rounded-lg h-[63vh] overflow-y-auto w-full flex flex-col gap-5 pt-7 pb-28'>
                        {messages.map((message, index) => (
                          message.role == "user" ? (
                            <div key={index} className='flex items-center gap-2'>
                              <h1>You said: </h1>
                              <h1 className='p-1 px-3 border rounded-lg'>{message.content}</h1>
                            </div>
                          ):(
                            <div key={index} className='flex items-center gap-4'>
                              <h1 className='whitespace-nowrap'>AI said: </h1>
                              <div>
                                <h1 className='p-2 px-5 border rounded-lg border-blue-900'>
                                  <MarkdownComponent markdown={message.content} />
                                </h1>
                                {(() => {
                                  // Find the context index for this assistant message
                                  const assistantMessageIndex = messages.slice(0, index + 1).filter(msg => msg.role === "assistant").length - 1;
                                  const contextForThisMessage = contexts[assistantMessageIndex];
                                  console.log("Chat this is the contexts: ", contextForThisMessage);
                                  
                                  return contextForThisMessage && contextForThisMessage.filter(item => item !== undefined).length > 0 && (
                                    <h1 className='bg-neutral-900 w-fit p-2 px-4 rounded-lg mt-3 text-sm'>Sources: <span className='text-blue-400'>{contextForThisMessage.filter(item => item !== undefined).join(", ")}</span></h1>
                                  );
                                })()}
                              </div>
                            </div>
                          )
                        ))}
                        {loadingResponse && (
                          <h1 id='fadeInOut' className='flex items-center gap-3 absolute top-4 right-6 text-green-400'><div className='h-3 w-3 bg-green-500 rounded-full'/>Thinking</h1>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* USER INPUT */}
                {!loading && (
                  <div className='fixed bottom-10 w-full flex items-center justify-center mt-4'>
                    <div className='w-[80%]'>
                      <div className={`flex items-center transition duration-400 bg-neutral-900 hover:border-none rounded-lg pl-4 pr-2 py-2`}>
                        <textarea
                          rows="1"
                          placeholder="Ask anything about the info in your cloud..."
                          className="flex-1 bg-transparent text-neutral-200 placeholder-neutral-500 focus:outline-none resize-none text-base leading-relaxed px-2 py-1 overflow-resize"
                          value={userInputOverall}
                          id="grotesk-font"
                          onChange={(e) => setUserInputOverall(e.target.value)}
                          ref={textareaRef}
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

        <Button variant={'outline'}>More Info</Button>
      </div>
    </div>
  )
}

export default GeneralChat