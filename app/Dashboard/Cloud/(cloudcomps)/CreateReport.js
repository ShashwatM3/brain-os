import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
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
import { Brain, CheckCheck, Download } from 'lucide-react';
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import MarkdownComponent from '@/components/ui/MarkdownComponent';
import { useCounterStore } from '@/app/store';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function CreateReport() {
  const [reportTopic, setReportTopic] = useState("");
  const [reportPurpose, setReportPurpose] = useState("");
  const [reportLength, setReportLength] = useState("");
  const [structureFormat, setStructureFormat] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = useCounterStore((state) => state.user);
  const setUser = useCounterStore((state) => state.setUser);
  const router = useRouter();

  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  function printAsPdf() {
    reactToPrintFn();
  }

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
        collection_name: user.uid
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
          const d = new Date();
          toast.info("Saving the newly generated report to the database")
          let dateOnlyString = d.toISOString();
          try {
            const docRef = doc(db, "users", user.uid, "cloud_reports", dateOnlyString)
            await setDoc(docRef, {
              report_instructions: `
              - **Report Topic**: ${reportTopic}
              
              - **Report Purpose**: ${reportPurpose}
              
              - **Length and Depth**: ${reportLength}
              
              - **Structure Format**: ${structureFormat}
              `,
              report_generated: msg.result,
              sources: msg.sources
            })
            toast.success("Successfully saved!")
          } catch(err) {
            console.error("Error updating database with new report: ", err)
          }
          console.log("Final:", msg.result);
          finalResult = msg.result;
          setWorkflowSteps(prev => [...prev, [msg.message, "final"]])

          setTimeout(async () => {
            await getReportsData();
          }, 1500);

//           setReports(prev => [...prev, {
//             report_instructions: `
// - **Report Topic**: ${reportTopic}

// - **Report Purpose**: ${reportPurpose}

// - **Length and Depth**: ${reportLength}

// - **Structure Format**: ${structureFormat}
//             `,
//             report_generated: msg.result,
//             sources: msg.sources
//           }])
        }
      }
    }

    console.log(finalResult);
  }

  async function getReportsData() {
    try {
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "cloud_reports"));
      querySnapshot.forEach((doc) => {
        setReports(prev => [...prev, {
            ...doc.data(),
            datetime: doc.id
          },
        ])
      });
      setLoading(false);
    } catch(err) {
      console.error(err);
      router.push("/Dashboard");
    }
  }

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      if (user) {
        await getReportsData();
      }
    };
    fetchReports();
  }, [user])
  
  return (
    loading ? (
      <div className="flex items-center justify-center h-screen w-screen">
        <Brain id="fadeInOut" className="h-11 w-auto"/>
      </div>
    ) : (
      <div>
        <div className='flex items-center gap-2'>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Launch</Button>
            </SheetTrigger>
            <SheetContent className='p-5 pt-10 min-w-[50vw] overflow-scroll'>
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
                        <Button className='w-fit cursor-pointer bg-blue-900 hover:bg-blue-700 text-white'>Previously Generated Reports</Button>
                      </SheetTrigger>
                      <SheetContent className='min-w-[40vw] p-5'>
                        <SheetHeader>
                          <SheetTitle className='scroll-m-20 text-2xl font-semibold tracking-tight'>Reports</SheetTitle>
                          <SheetDescription className='mb-4'>
                            View all your previously generated reports and their details below
                          </SheetDescription>
                          {reports.map((report, index) => (
                            <div key={index} className='border border-neutral-800 rounded-lg p-5 mb-4'>
                              <div className='text-white'>
                                <MarkdownComponent markdown={report.report_instructions} />
                              </div>
                              <div className='flex gap-2 mt-2 items-center justify-end'>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant={'outline'}>View Report</Button>
                                  </DialogTrigger>
                                  <DialogContent className='h-[65vh] overflow-scroll min-w-[65vw] p-5'>
                                    <DialogHeader>
                                      <DialogTitle>Generated Report</DialogTitle>
                                      <DialogDescription>
                                        Preview of your generated report
                                      </DialogDescription>
                                      <Button onClick={printAsPdf} variant='outline' className='flex items-center gap-2 my-3'>
                                        <Download size={16} />
                                        Download Report
                                      </Button>
                                      <div 
                                        className='prose bg-black p-4 rounded' 
                                        ref={contentRef}
                                        dangerouslySetInnerHTML={{ __html: report.report_generated }} 
                                      />
                                    </DialogHeader>
                                  </DialogContent>
                                </Dialog>
                              </div>
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
  )
}

export default CreateReport