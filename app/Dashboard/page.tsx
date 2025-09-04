'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import TailwindSpinner from '@/components/ui/tailwindspinner'
import { toast } from 'sonner'
import { Cloud, Link } from 'lucide-react'

function Page() {
  // --------------- CREATING A CLOUD -------------------
  const [createCloud, setCreateCloud] = useState(false);
  const [createCloudName, setCreateCloudName] = useState("");
  const [createCloudDesciption, setCreateCloudDescription] = useState("");
  const [loadingCreateCloud, setLoadingCreateCloud] = useState(false);
  // ----------------------------------------------------

  // --------------- MANAGINGS CLOUDS -------------------
  const [clouds, setClouds] = useState([]);
  const [cloudsRefresh, setCloudsRefresh] = useState(true);
  const [deleteCloudState, setDeleteCloudState] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // ----------------------------------------------------

  async function createNewCloud() {
    setLoadingCreateCloud(true);
    setCloudsRefresh(true)
    const res = await fetch('/api/clouds/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createCloudName,
        description: createCloudDesciption,
        indexName: process.env.NEXT_PUBLIC_INDEX_NAME,
        indexHost: process.env.NEXT_PUBLIC_INDEX_HOST,
      }),
    });

    if (!res.ok) {
      console.error('Request failed');
      return;
    }
  
    const data = await res.json();
    if (!(data.error)) {
      toast.success(`Cloud: ${createCloudName} created successfully`)
      setLoadingCreateCloud(false);
      setCreateCloudName("");
      setCreateCloudDescription("");
      setCreateCloud(false);
      setCloudsRefresh(true);
    } else {
      console.log(data.error)
      toast.error(`Cloud: ${createCloudName} could not be created! TRY AGAIN LATER`)
      setLoadingCreateCloud(false);
    }
  }

  async function loadCloudData() {
    try {
      const res = await fetch("/api/clouds/fetch-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indexName: process.env.NEXT_PUBLIC_INDEX_NAME,
          indexHost: process.env.NEXT_PUBLIC_INDEX_HOST,
        }),
      });
    
      const data = await res.json();
      console.log(data);
      if (data && data.response) {
        if (data.response.namespaces.length>0) {
          setClouds(data.response.namespaces)
        } else {
          setClouds([])
        }
      }
      setCloudsRefresh(false);
    } catch (err) {
      console.error("Error sending POST request:", err);
      setCloudsRefresh(false);
    }
  }

  async function deleteNamespace(namespace: string) {
    try {
      const res = await fetch("/api/clouds/delete", {
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
      console.log(data);
      toast.info(`Your Cloud: ${namespace} has been deleted.`)
      setDeleteDialogOpen(false);
      setCloudsRefresh(true)
    } catch (err) {
      console.error("Error sending POST request:", err);
    }
  }

  useEffect(() => {
    loadCloudData()
  }, [cloudsRefresh])

  return (
    <div className='p-5 pt-10'>
      {/* CREATING CLOUDS */}
      <section>
        {createCloud ? (
          <Button variant={'secondary'} onClick={() => setCreateCloud(false)}>Close form</Button>
        ):(
          <div className='flex items-center justify-between'>
            <Button onClick={() => setCreateCloud(true)}>Create cloud</Button>
            <Button variant={'secondary'} onClick={() => {
              setCloudsRefresh(true)
              loadCloudData();
            }}>Refresh cloud data</Button>
          </div>
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
      </section>
      <br/><br/>
      {/* SHOWING CLOUDS */}
      <section>
        {cloudsRefresh ? (
          <h1>Loading in your clouds...</h1>
        ):(
          clouds.length==0 ? (
            <h1>No clouds exist yet.</h1>
          ):(
            <div className='flex items-center gap-3'>
              {clouds.map((cloud: Record<any, any>) => (
                <div key={cloud.name} className='h-[25vh] w-[25vw] p-8 bg-[rgb(12, 12, 12)] border rounded-sm overflow-scroll flex justify-between flex-col'>
                  <div className='flex items-center gap-3 mb-5'>
                    <Cloud/>
                    <h1 className='scroll-m-20 text-xl font-semibold tracking-tight'>{cloud.name}</h1>
                  </div>
                  <h1 className='mb-3'>Number of entities: {cloud.recordCount==0 ? "0" : cloud.recordCount-1}</h1>
                  <div className='flex items-center justify-between w-full gap-3'>
                    <div className='flex-1 w-full'>
                      <Button className='w-full' variant={'outline'}>Enter cloud</Button>
                    </div>
                    <div className='flex-1 w-full'>
                      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className='w-full font-mono text-red-400 cursor-pointer' variant={'outline'}>Delete cloud</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[30vw]">
                          <DialogHeader>
                            <DialogTitle className="mb-3">Are you absolutely sure?</DialogTitle>
                            <DialogDescription className="mb-5">
                              This action cannot be undone. This will permanently delete your cloud
                              and remove any data within it.
                            </DialogDescription>
                            <div className="w-full flex items-center justify-center gap-2">
                              {deleteCloudState ? (
                                <Button className="w-full flex-1" disabled={true}><TailwindSpinner/></Button>
                              ):(
                                <Button className="w-full flex-1" onClick={() => deleteNamespace(cloud.name)}>Yes I'm sure</Button>
                              )}
                              <Button className="w-full flex-1" variant={'outline'} onClick={() => setDeleteDialogOpen(false)}>No let's go back</Button>
                            </div>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>
    </div>
  )
}

export default Page