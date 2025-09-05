import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'

function CloudPage({ name, data, onBack }) {
  const [description, setDescription] = useState("");
  const router = useRouter()

  useEffect(() => {
    if (data) {
      const descVector = data.find(v => v.metadata.category === "Description");
      if (descVector) {
        setDescription(descVector.metadata.text);
      }
    }
  }, [data]);

  return (
    <div className='cloud-page-main p-8 pt-13'>
      <h1 id="grotesk-font" className='text-4xl mb-5'>
        Your Cloud: <span className='font-bold'>{name}</span>
      </h1>
      <h3 className='w-[45%] mb-5 opacity-[70%]'>{description}</h3>
      <div className='flex items-center gap-2'>
        <Button variant={'outline'}>Edit details</Button>
        <Button className='cursor-pointer' onClick={onBack} variant={'secondary'}>Back to Clouds Home</Button>
      </div>
    </div>
  )
}

export default CloudPage;