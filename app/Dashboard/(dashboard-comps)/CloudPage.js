import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cloud, Cloudy, Plus, Recycle, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react'
import pdfToText from 'react-pdftotext'
import { toast } from 'sonner';

function CloudPage({ name, data, onBack, refreshCloudData }) {
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  const [description, setDescription] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  // ------------------------------------------------------------------------
  // // ---------------------Handling file input-----------------------------
  // ------------------------------------------------------------------------
  const hiddenFileInput = useRef(null);
  const [currentMediaDetails, setCurrentMediaDetails] = useState({});
  const [fileName, setFileName] = useState("");
  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------

  useEffect(() => {
    if (data) {
      console.log(data);
      const descVector = data.find(v => v.metadata.category === "Description");
      if (descVector) {
        setDescription(descVector.metadata.text);
      }
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
    setLoading(true);
    if (currentMediaDetails.text.length > 750) {
      const chunks = await chunking(currentMediaDetails.text)
      try {
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
        if (data2 && data2.success) {
          toast.success(`Media: ${currentMediaDetails.name} added to space`);
          setLoading(false);
          setCurrentMediaDetails({});
          setFileName("");
          setTimeout(function() {
            refreshCloudData()
          }, 3000);
        }
      } catch (err) {
        console.error("Error sending POST request:", err);
      }
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

  return (
    <div className='cloud-page-main p-8 pt-13'>
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
            <Button className='cursor-pointer' onClick={onBack} variant={'secondary'}>Back to Clouds Home</Button>
          </div>
        </div>
        <div className='border border-neutral-700 rounded-md p-5 w-[30vw]'>
          <h1 className='grotesk-font mb-2 text-2xl font-mono'>Refresh Data</h1>
          <h3 className='text-neutral-300 mb-5'>Load new fresh data</h3>
          <Button onClick={() => {
            setLoading(true)
            setTimeout(function() {
              refreshCloudData()
              setLoading(false)
            }, 3000);
          }} className='cursor-pointer' variant={'outline'}><RefreshCcw/> Refresh</Button>
        </div>
      </div>

      {/* PLUS BUTTON — ADDING MEDIA */}
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
      {data.map((record, index) => (
        <h1 key={index}>
          {index}
          {console.log(record)}
        </h1>
      ))}
    </div>
  )
}

export default CloudPage;