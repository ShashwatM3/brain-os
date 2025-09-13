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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function CreateReport() {
  const [reportTopic, setReportTopic] = useState("");
  const [reportPurpose, setReportPurpose] = useState("");
  const [reportLength, setReportLength] = useState("");
  const [structureFormat, setStructureFormat] = useState("");
  const [reports, setReports] = useState([]);

  const [workflowSteps, setWorkflowSteps] = useState([]);
  
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
          setWorkflowSteps(prev => [...prev, [msg.message, "not final"]])
        }

        if (msg.status === "done") {
          console.log("Final:", msg.result);
          finalResult = msg.result;
          setWorkflowSteps(prev => [...prev, [msg.message, "final"]])

          setReports(prev => [...prev, {
            report_instructions: `
- **Report Topic**: ${reportTopic}

- **Report Purpose**: ${reportPurpose}

- **Length and Depth**: ${reportLength}

- **Structure Format**: ${structureFormat}
            `,
            report_generated: msg.result,
            sources: msg.sources
          }])
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
              <div className='flex items-center gap-2 w-full justify-between'>
                <Button onClick={initiateWorkflow} className='w-fit cursor-pointer' variant={''}>Generate Report</Button>
                {reports.length > 0 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className='w-fit cursor-pointer' variant={'secondary'}>View previous reports</Button>
                    </SheetTrigger>
                    <SheetContent className='min-w-[40vw] p-5'>
                      <SheetHeader>
                        <SheetTitle className='scroll-m-20 text-2xl font-semibold tracking-tight'>Reports</SheetTitle>
                        <SheetDescription className='mb-4'>
                          View all your previously generated reports and their details below
                        </SheetDescription>
                        {reports.map((report, index) => (
                          <div key={index} className='border border-neutral-500 rounded-lg p-5'>
                            <ReactMarkdown>
                              {report.report_instructions}
                            </ReactMarkdown>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className='mt-5'>View Report</Button>
                              </DialogTrigger>
                              <DialogContent className='h-[45vh] overflow-scroll min-w-[45vw]'>
                                <DialogHeader>
                                  <DialogTitle></DialogTitle>
                                  <DialogDescription>
                                  </DialogDescription>
                                  <ReactMarkdown className="prose prose-stone">
                                      {report.report_generated}
                                    </ReactMarkdown>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        ))}
                      </SheetHeader>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Button variant={'outline'}>More info</Button>

        <Dialog open={workflowSteps.length>0}>
          <DialogTrigger asChild>
            <Button className='hidden'></Button>
          </DialogTrigger>
          <DialogContent className='p-5'>
            <DialogHeader>
              <DialogTitle>Status updates</DialogTitle>
              <DialogDescription className='mb-3'>
                What's cooking in the kitchen right now!
              </DialogDescription>
              <div className='flex items-start justify-center gap-2 flex-col'>
                {workflowSteps.map((workflowStep, index) => (
                  workflowStep[1] == "not final" ? (
                    <div id={`${(workflowStep[1] == "not final" && (index == workflowSteps.length-1)) ? "fadeInOut" : ""}`} key={index} className='flex items-center gap-2'>
                      <div className={`h-4 w-4 rounded-full ${(workflowStep[1] == "not final" && (index == workflowSteps.length-1)) ? "bg-yellow-500" : "bg-green-500"}`}></div>
                      <h1>{workflowStep[0]}</h1>
                    </div>
                  ) : workflowStep[1] == "final" ? (
                    <div key={index}>
                      <div className='flex items-center gap-2 mb-4'>
                        <CheckCheck className='text-green-500'/>
                        <h1>{workflowStep[0]}</h1>
                      </div>
                      <Button onClick={() => {
                        setReportTopic("");
                        setReportPurpose("");
                        setReportLength("");
                        setStructureFormat("");
                        setWorkflowSteps([]);
                      }} variant={'outline'}>Click here to close the window once you're done</Button>
                    </div>
                  ) : null
                ))}
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default CreateReport