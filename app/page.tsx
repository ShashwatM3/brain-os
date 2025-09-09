'use client'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Cloud } from "lucide-react";

export default function Home() {
  const router = useRouter()
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[12px] row-start-2 items-center sm:items-start">
        <h1 className="brainos">BrainOS</h1>
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left mb-5">
          <li className="mb-2 tracking-[-.01em]">
            Add
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={'ghost'} className="mx-2 text-red-400 cursor-pointer">information</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Documents, YouTube vids, MP4 / MP3, Images, Live Record / Camera</p>
              </TooltipContent>
            </Tooltip>
            to your{" "}
            <code className="bg-black/[.40] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              2nd brain
            </code>
          </li>
          <li className="tracking-[-.01em]">
            Search across your brain 🧠
          </li>
        </ol>
        <Button variant={'outline'} onClick={() => router.push("/Dashboard")}>Go to dashboard</Button>
      </main>
      <div className="fixed bottom-10 right-10">
        <h1 className="text-neutral-500 hover:text-neutral-300 transition-all cursor-pointer border-b hover:border-neutral-500 pb-1 text-sm">Contact the Founder</h1>
      </div>
      {/* <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer> */}
    </div>
  );
}
