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
import { Cloud, Delete, Edit, Link, RefreshCcw, Trash } from 'lucide-react'
import CloudPage from "./Cloud/CloudPage"
import { useCounterStore } from "../store"
import { useRouter } from "next/navigation"

function DashboardPage() {
  // Creating clouds
  const [createCloud, setCreateCloud] = useState(false);
  const [loadingCreateCloud, setLoadingCreateCloud] = useState(false);
  const [cloudsRefresh, setCloudsRefresh] = useState(false) // For REFRESHING DATA or INITIAL LOAD
  const [createCloudName, setCreateCloudName] = useState("");
  const [createCloudDesciption, setCreateCloudDescription] = useState("");
  const [clouds, setClouds] = useState([])

  // Missing state variables
  const [loadingCloudData, setLoadingCloudData] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCloudState, setDeleteCloudState] = useState(false);
  const [editCloudName, setEditCloudName] = useState("");

  // ------------------------------FUNCTIONS-----------------------------------
  function refreshTotal() { // Function for refreshing everything (not resetting any values)
    setCloudsRefresh(true)
    setTimeout(function() {
      loadCloudData();
    }, 3000);
  }

  async function createNewCloud() { // Function for create a new cloud ---> AND THEN TOTAL REFRESH
    setLoadingCreateCloud(true);
    setCloudsRefresh(true)
    try {
      const res = await fetch("/api/chroma/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createCloudName,
          description: createCloudDesciption,
        }),
      });
    
      const data = await res.json();
      if (data && data.response && data.response == 'success') {
        toast.success(`Cloud: ${createCloudName} successfully created!`)
        setLoadingCreateCloud(false);
        setCreateCloudName("");
        setCreateCloudDescription("");
        setCreateCloud(false);
        setCloudsRefresh(true);
      }
    } catch (err) {
      console.error("Error sending POST request:", err);
    }
  }

  function countFieldOccurrences(arr, field) { // For counting the cloud count per cloud names
    const counts = arr.reduce((acc, item) => {
      const val = item[field];
      if (val !== undefined) {
        acc[val] = (acc[val] || 0) + 1;
      }
      return acc;
    }, {});
  
    return Object.entries(counts).map(([key, value]) => ({
      cloud_name: key,
      count: value
    }));
  }

  async function loadCloudData() { // Function for loading all cloud data
    try {
      const res = await fetch("/api/chroma/fetch-clouds-only", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    
      const data = await res.json();
      if (data.response && data.response.metadatas) {
        const cloudNamesCounts = countFieldOccurrences(data.response.metadatas)
      } else {
        console.log(data)
      }
      
      // setClouds(cloudNamesCounts)
    } catch (err) {
      console.error("Error sending POST request:", err);
    }
  }

  // Empty placeholder functions
  async function getAllVectors(cloudName) {
    
  }

  async function deleteNamespace(cloudName) {
    
  }

  async function setNewName() {
    
  }

  useEffect(() => {
    loadCloudData()
  }, [cloudsRefresh])

  return(
    <div className='dashboard-page-main'>
      <h1>Welcome to your Dashboard</h1>
      <h3>Here, you can view your clouds, edit them, and access them for further intelligent interactions</h3>
      
      {/* Clouds Form Button */}
      {createCloud ? (
          <Button variant={'secondary'} onClick={() => setCreateCloud(false)}>Close form</Button>
        ):(
          <div className='flex items-center justify-between'>
            <Button onClick={() => setCreateCloud(true)}>Create Cloud</Button>
            <Button variant={'secondary'} onClick={refreshTotal}><RefreshCcw/> Refresh</Button>
          </div>
        )}

        {/* Clouds Form */}
        <br/><br/>
        {createCloud && (
          <div className='w-[35vw] p-8 border rounded-lg'>
            <h3 className='scroll-m-20 text-lg font-semibold tracking-tight mb-3'>Name of your new collection</h3>
            <Input disabled={loadingCreateCloud} value={createCloudName} onChange={(e) => setCreateCloudName(e.target.value)} placeholder="Ex: AI Research" />
            <br/>
            <h3 className='scroll-m-20 text-lg font-semibold tracking-tight mb-3'>Give it a description</h3>
            <Input disabled={loadingCreateCloud} value={createCloudDesciption} onChange={(e) => setCreateCloudDescription(e.target.value)} placeholder="Ex: Latest articles and Posted Research and ....." />
            <br/>
            {loadingCreateCloud ? (
              <Button><TailwindSpinner/></Button>
            ): (
              <Button onClick={createNewCloud}>Create collection</Button>
            )}
          </div>
        )}

        {clouds.length>0 ? (
          <h1>Loaded!!!</h1>
        ):(
          <h1>Loading...</h1>
        )}

        {/* {clouds.map((cloud) => (
          <div key={cloud.cloud_name} className='h-[25vh] w-[25vw] p-8 bg-[rgb(12, 12, 12)] border rounded-sm overflow-scroll flex justify-between flex-col'>
            <div className='flex items-center gap-3 mb-5'>
              <Cloud/>
              <h1 className='scroll-m-20 text-xl font-semibold tracking-tight'>{cloud.cloud_name}</h1>
            </div>
            <h1 className='mb-3'>Number of entities: {cloud.count==0 ? "0" : cloud.count-1}</h1>
            <div className='flex items-center justify-between w-full gap-1'>
              <Button onClick={() => getAllVectors(cloud.cloud_name)} className='flex-1 w-full font-mono cursor-pointer' variant={'outline'}>
                {loadingCloudData ? (
                  <TailwindSpinner/>
                ):(
                  <p>Enter cloud</p>
                )}
              </Button>
              <div className=''>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className='w-full font-mono text-red-400 cursor-pointer' variant={'outline'}>Delete cloud</Button>
                    <Button className='w-full' variant={'destructive'}><Trash/></Button>
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
                          <Button className="w-full flex-1" onClick={() => deleteNamespace(cloud.cloud_name)}>Yes I'm sure</Button>
                        )}
                        <Button className="w-full flex-1" variant={'outline'} onClick={() => setDeleteDialogOpen(false)}>No let's go back</Button>
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button><Edit/></Button>
                </DialogTrigger>
                <DialogContent className="w-[30vw]">
                  <DialogHeader>
                    <DialogTitle>Edit Cloud: {cloud.cloud_name}</DialogTitle>
                    <DialogDescription className="mb-3">
                      You can only modify the name of the cloud
                    </DialogDescription>
                    <Label className="mb-1">Enter new name</Label>
                    <Input value={editCloudName} onChange={(e) => setEditCloudName(e.target.value)} className="mb-3"/>
                    <div className="flex items-center gap-1">
                      <Button onClick={setNewName} className="w-fit">Submit changes</Button>
                      <Button variant={'secondary'} className="w-fit">Go back</Button>
                    </div>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))} */}
    </div>
  )
}

export default DashboardPage