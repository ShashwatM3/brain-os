"use client";

import { TourProvider } from '@reactour/tour';

const steps = [
  {
    selector: '.first-step',
    content: 'This is Layer 1. This is where you can upload files 🗂️ and the content of these files will be used when you implement any tools ✨',
  },
  {
    selector: '.second-step',
    content: 'This is Layer 2. Here, you can write notes by clicking on the Add Note button with a sleek interface 📝 We also use this for our intelligence tools ⚡️',
  },
  {
    selector: '.third-step',
    content: 'This is where your intelligence comes in 🧠 You get to do a ton of stuff using the knowledge from your files and notes like chatting across your data, creating reports, etc....🔥',
  },
  // ...
];

export default function TourWrapper({ children }: { children: React.ReactNode }) {
  return (
<TourProvider 
  steps={steps} 
  styles={{
    popover: (base) => ({
      ...base,
      backgroundColor: "#000",   // black popover
      color: "#fff",             // white text
      border: "1px solid #444",  // subtle border
      borderRadius: 10,
    }),
    maskWrapper: (base) => ({
      ...base,
      background: "rgba(0,0,0,0.5)", // faint black overlay
    }),
    maskArea: (base) => ({
      ...base,
      rx: 10, // rounded highlight corners
      stroke: "rgba(255,255,255,0.8)", // glow color
      strokeWidth: 4,                  // thickness of glow
    }),
    badge: (base) => ({ ...base, left: 'auto', right: '-0.8125em' }),
    controls: (base) => ({ ...base, marginTop: 100 }),
    close: (base) => ({ ...base, right: 'auto', left: 8, top: 8 }),
  }}
>
      {children}
    </TourProvider>
  );
}
