'use client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react';
import React, { useRef, useState } from 'react'
import pdfToText from 'react-pdftotext';
import { toast } from 'sonner';

function UploadFile() {
  const hiddenFileInput = useRef(null);
  const [currentMediaDetails, setCurrentMediaDetails] = useState({});
  const [fileName, setFileName] = useState("");
  const [chunks, setChunks] = useState([]);

  async function extractText(file) {
    pdfToText(file)
      .then(text => {
        // setText(text);
        // setFinalExtracted({
        //   jobDescription: text
        // });
        console.log(text);
        console.log(file.name)
        setFileName(currentMediaDetails.name);
        setCurrentMediaDetails({
          name: file.name,
          text: text,
        })
      })
      .catch(error => console.error("Failed to extract text from pdf"))
  }

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

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

  async function addDocuments() {
    const ids = Array.from({ length: chunks.length }, (_, i) => (i + 1).toString());
    const metadatas = Array.from({ length: chunks.length }, () => ({ category: "technology" }));

    console.log("--------------------")
    console.log(ids)
    console.log(chunks)
    console.log(metadatas)

    const response = await fetch("/api/chroma/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: ids,
        documents: chunks,
        metadatas: metadatas
      }),
    });
  
    const data = await response.json();
    console.log("Response:", data);
  }

  return (
    <div className='p-8'>
      <br/>
      <h1 className='p-4 rounded-lg cursor-pointer bg-white text-black w-fit' onClick={handleClick} variant={'secondary'}>
        <Plus className='h-7 w-7'/>
      </h1>
      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        accept="application/pdf"
        style={{ display: 'none' }}
      />
      <br/>
      {Object.keys(currentMediaDetails).length>0 && chunks.length==0 && (
        <Button onClick={async () => {
          toast("Chunking....")
          const chunks = await chunking(currentMediaDetails.text)
          toast("Got them chunks!....")
          console.log("✂️ [CloudPage] Chunking completed, chunks:", chunks);
          setChunks(chunks)
        }} variant={'outline'}>Start chunking</Button>
      )}

      {chunks.length>0 && (
        <Button onClick={addDocuments} variant={'outline'}>Submit</Button>
      )}
    </div>
  )
}

export default UploadFile