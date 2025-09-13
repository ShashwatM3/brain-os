import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea"

function CreateReport() {
  const [reportTopic, setReportTopic] = useState("");
  const [reportPurpose, setReportPurpose] = useState("");
  const [reportLength, setReportLength] = useState("");
  const [structureFormat, setStructureFormat] = useState("");
  
  const options = [
    { label: "Brief (1–2 pages)", value: "Brief (1–2 pages)" },
    { label: "Standard (3–5 pages)", value: "Standard (3–5 pages" },
    // { label: "In-depth (8–10 pages)", value: "indepth" },
  ];

  async function initiateWorkflow() {
    const res = await fetch("/api/ai/report-brief", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        report_details: {
          report_topic: reportTopic,
          report_purpose: reportPurpose,
          report_length: reportLength,
          report_structure: structureFormat
        },
        collection_name: "myCollection"
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    let finalResult = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true }).trim();

      // Handle multiple messages in one chunk
      for (const line of chunk.split("\n")) {
        if (!line) continue;
        const msg = JSON.parse(line);

        if (msg.status === "update") {
          console.log("Update:", msg.message);
        }

        if (msg.status === "done") {
          console.log("Final:", msg.result);
          finalResult = msg.result;
        }
      }
    }

    console.log(finalResult);
  }
  
  return (
    <div>
      <div className='flex items-center gap-2'>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Launch</Button>
          </SheetTrigger>
          <SheetContent className='p-5 pt-10 min-w-[50vw]'>
            <SheetHeader>
              <SheetTitle>
                <span id='grotesk-font' className='scroll-m-20 text-3xl font-bold tracking-tight text-balance'>Generate a Report</span>
              </SheetTitle>
              <SheetDescription className='text-lg w-[80%] mt-2 mb-4'>
                Here you can generate reports about your cloud with specific data with custom instructions and a prompt to follow
              </SheetDescription>
              {/* ================ Report Topic ================ */}
              <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight mb-3'>Topic of Report</h1>
              <Input
              placeholder='Specify a topic for the report to be based off'
              className='mb-6'
              value={reportTopic}
              onChange={(e) => setReportTopic(e.target.value)}
              />
              {/* ================ Report Purpose ================ */}
              <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight mb-1'>Purpose of Report</h1>
              <h3 className='mb-3 text-neutral-400'>Specify purpose of report. Ex: <span className='font-bold'>Research summary, Business strategy, Technical Report</span>, etc</h3>
              <Input
              placeholder='This is a XXX focused on.....'
              className='mb-6'
              value={reportPurpose}
              onChange={(e) => setReportPurpose(e.target.value)}
              />
              {/* ================ Length & Depth ================ */}
              <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight mb-1'>Length & Depth</h1>
              <h3 className='mb-3 text-neutral-400'>How long should your report be?</h3>
              <div className="flex gap-2 mb-6">
                {options.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    onClick={() => setReportLength(opt.value)}
                    variant={`${reportLength === opt.value ? "" : "outline"}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {/* ================ Structure Format ================ */}
              <h1 className='scroll-m-20 text-2xl font-semibold tracking-tight mb-1'>Structure / Format</h1>
              <h3 className='mb-3 text-neutral-400'>Specify a structure for the report. Optional.</h3>
              <Textarea
              placeholder='SWOT Analysis / Executive Summary / etc...'
              className='mb-6'
              value={structureFormat}
              onChange={(e) => setStructureFormat(e.target.value)}
              />
              {/* ===================== End ======================== */}
              <Button onClick={initiateWorkflow} className='w-fit cursor-pointer' variant={'secondary'}>Generate Report</Button>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Button variant={'outline'}>More info</Button>
      </div>
    </div>
  )
}

export default CreateReport