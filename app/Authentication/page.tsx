import { Brain, GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/ui/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <Brain/>
            <h1>BrainOS</h1>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="p-10">
        <h1 className="font-mono w-[30vw]">Maybe if we tell the people that the brain is an app they'll start using it</h1>
      </div>
    </div>
  )
}