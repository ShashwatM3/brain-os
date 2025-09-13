'use client'
import React, { useRef } from 'react'
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { useReactToPrint } from "react-to-print";
import { toast } from 'sonner';

function TrialPage() {
  const dialogRef = useRef(null);

  const reactToPrintFn = useReactToPrint({ contentRef: dialogRef });

  function printAsPdf() {
    toast.info("Loading...");
    if (dialogRef.current) {
      dialogRef.current.style.color = "black";
      dialogRef.current.style.padding = "30px";
    }
    setTimeout(() => {
      reactToPrintFn();
      dialogRef.current.style.color = "white";
      dialogRef.current.style.padding = "0px";
    }, 2000);
  }  

  const markdownText = 
  `
# Introduction to Agentic Design Patterns

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
  `

  return (
    <div>
      <h1>helo</h1>
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent className='h-[50vh] overflow-scroll'>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
          <Button onClick={printAsPdf}>
            Download as PDF
          </Button>

          <div ref={dialogRef} className="prose">
            <ReactMarkdown>
              {markdownText}
            </ReactMarkdown>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    </div>
  )
}

export default TrialPage