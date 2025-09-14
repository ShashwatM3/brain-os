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
  const [reports, setReports] = useState([
    {
      report_generated: `# Introduction to Agentic Design Patterns

Agentic design patterns are architectural and behavioral templates guiding the development of AI systems. These patterns facilitate the collaboration of autonomous or semi-autonomous agents, enhancing scalability, modularity, and adaptability. By treating agents as parts of a cohesive team rather than isolated entities, we harness their ability to tackle complex problems efficiently.

## Definition and Origin

The concept of agentic design patterns emerges from a need for more structured methodologies in AI system design. Rooted in behavioral science and computer science, these patterns reflect significant advancements in how AI systems interact with their environments and each other. They encapsulate common workflows, making it easier to design systems that can autonomously adapt to dynamic requirements.

## Examples in Technology

Current technologies significantly leverage agentic design patterns. For instance, in autonomous robotics, agents orchestrate tasks such as navigation and obstacle avoidance. Similarly, in customer support, multiple agents interface with various tools, streamlining response times and improving user experiences. These applications highlight the patterns' versatility and impact on creating intelligent, collaborative systems.

# Understanding the A2A Protocol

The Agent-to-Agent (A2A) protocol underpins effective communication and coordination among agents without centralized control. This protocol is crucial for the seamless operation of modern multi-agent systems.

## Overview of A2A Protocol

The A2A protocol facilitates the sharing of knowledge and collective intelligence among autonomous agents. It encompasses structured message exchanges that often employ standardized formats like JSON to ensure interoperability. Through this method, agents can autonomously coordinate actions while maintaining their distinct functionalities.

## Use Cases

1. **Swarm Robotics**: In swarm robotics, agents share data about their environment, enabling them to adapt their strategies collectively. This enhances efficiency and problem-solving capabilities in navigating complex terrains.
  
2. **AI Assistants**: In virtual assistant technologies, different agents may manage scheduling, email sorting, and information retrieval, coordinating their efforts for optimal user satisfaction.
  
3. **Decentralized Knowledge Sharing**: A2A protocols can facilitate knowledge distribution in blockchain technologies, where agents validate transactions and provide real-time updates on statuses without a central authority.

# Strategic Implications of Agentic Design Patterns and A2A Protocol

The integration of agentic design patterns with the A2A protocol has notable strategic implications across various sectors.

## Benefits

Integrating these patterns enhances system scalability and adaptability. By utilizing reusable architectural templates, organizations can reduce development time while increasing operational efficiency. The agentic systems become more robust, capable of dynamically evolving workflows based on real-time data and user demands.

## Challenges

However, potential challenges include managing the complexity of these multi-agent systems. Ensuring reliable communication across diverse agents may necessitate robust error-handling mechanisms. Furthermore, security concerns may arise from agents interacting outside controlled environments, necessitating a focus on trust and authentication within the A2A framework.

# Conclusion and Future Outlook

In summary, agentic design patterns and the A2A protocol represent a transformative shift in AI system architecture, fostering enhanced collaboration and adaptability.

## Summary of Findings

Overall, the integration of agentic design patterns into the A2A protocol provides a framework for developing collaborative AI systems. These frameworks optimize performance and adaptability while posing unique challenges in coordination and security.

## Research Opportunities

Future research may focus on improving error-handling mechanisms, enhancing security protocols within A2A communications, and exploring new domains where agentic design patterns can be applied, such as healthcare or smart cities. As the field evolves, ongoing investigations into optimizing these systems will be crucial for maximizing their potential benefits.
      `,
      report_instructions: `
      - **Report Topic**: Topic
      
      - **Report Purpose**: Purpose
      
      - **Length and Depth**: Length
      
      - **Structure Format**: Format
                  `,
    }
  ]);

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
                                  <div className='prose'>
                                  <ReactMarkdown>
                                    {report.report_generated}
                                  </ReactMarkdown>
                                  </div>
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