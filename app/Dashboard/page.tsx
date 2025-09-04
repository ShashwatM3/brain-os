'use client'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import TailwindSpinner from '@/components/ui/tailwindspinner'
import { toast } from 'sonner'

function Page() {
  // --------------- CREATING A CLOUD -------------------
  const [createCloud, setCreateCloud] = useState(false);
  const [createCloudName, setCreateCloudName] = useState("");
  const [createCloudDesciption, setCreateCloudDescription] = useState("");
  const [loadingCreateCloud, setLoadingCreateCloud] = useState(false);
  //  Sample Cloud Name — AI Articles
  //  Sample Cloud Description — Latest Research and publications in LLM Research
  // ----------------------------------------------------

  async function createNewCloud() {
    setLoadingCreateCloud(true);
    const res = await fetch('/api/clouds/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createCloudName,
        description: createCloudDesciption
      }),
    });

    if (!res.ok) {
      console.error('Request failed');
      return;
    }
  
    const data = await res.json();
    if (!(data.error)) {
      toast.success(`Cloud: ${createCloudName} created!`)
      setLoadingCreateCloud(false);
      setCreateCloudName("");
      setCreateCloudDescription("");
      setCreateCloud(false);
    } else {
      console.log(data.error)
      toast.error(`Cloud: ${createCloudName} could not be created! TRY AGAIN LATER`)
    }
  }
  return (
    <div className='p-5'>
      {createCloud ? (
        <Button variant={'secondary'} onClick={() => setCreateCloud(false)}>Close form</Button>
      ):(
        <Button onClick={() => setCreateCloud(true)}>Create cloud</Button>
      )}

      <br/><br/>
      {createCloud && (
        <div className='w-[35vw] p-8 border rounded-lg'>
          <h3 className='scroll-m-20 text-lg font-semibold tracking-tight mb-3'>Name of your new cloud</h3>
          <Input disabled={loadingCreateCloud} value={createCloudName} onChange={(e) => setCreateCloudName(e.target.value)} placeholder="Ex: AI Research" />
          <br/>
          <h3 className='scroll-m-20 text-lg font-semibold tracking-tight mb-3'>Give it a description</h3>
          <Input disabled={loadingCreateCloud} value={createCloudDesciption} onChange={(e) => setCreateCloudDescription(e.target.value)} placeholder="Ex: Latest articles and Posted Research and ....." />
          <br/>
          {loadingCreateCloud ? (
            <Button><TailwindSpinner/></Button>
          ): (
            <Button onClick={createNewCloud}>Create cloud</Button>
          )}
        </div>
      )}
    </div>
  )
}

export default Page