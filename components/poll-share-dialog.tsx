"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Share2Icon, LinkIcon, CodeIcon, TwitterIcon, LinkedinIcon, CheckIcon } from "lucide-react"
import type { Poll } from "@/lib/features/polls/pollsSlice"

interface PollShareDialogProps {
  poll: Poll
}

export default function PollShareDialog({ poll }: PollShareDialogProps) {
  const [copied, setCopied] = useState(false)

  // Construct the shareable URL for the poll
  // In a real application, this would be a dedicated poll page URL like /polls/[id]
  const pollUrl = useMemo(() => {
    // This assumes your app is hosted at window.location.origin and has a /poll/[id] route
    return `${window.location.origin}/poll/${poll.id}`
  }, [poll.id])

  const iframeCode = useMemo(() => {
    return `<iframe src="${pollUrl}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`
  }, [pollUrl])

  const qrCodeUrl = useMemo(() => {
    // Using a public QR code API for demonstration
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pollUrl)}`
  }, [pollUrl])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset copied state after 2 seconds
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Vote on "${poll.question}"!`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(pollUrl)}`, "_blank")
  }

  const shareOnLinkedIn = () => {
    const title = encodeURIComponent(poll.question)
    const summary = encodeURIComponent("Participate in this poll!")
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        pollUrl,
      )}&title=${title}&summary=${summary}`,
      "_blank",
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2Icon className="mr-2 h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Poll</DialogTitle>
          <DialogDescription>Share this poll with others via link, embed, or social media.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Input readOnly value={pollUrl} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={() => handleCopy(pollUrl)}>
                      {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                      <span className="sr-only">{copied ? "Copied!" : "Copy link"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? "Copied!" : "Copy link"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={shareOnTwitter}>
                <TwitterIcon className="mr-2 h-4 w-4" /> Twitter
              </Button>
              <Button variant="outline" onClick={shareOnLinkedIn}>
                <LinkedinIcon className="mr-2 h-4 w-4" /> LinkedIn
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="embed" className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Input readOnly value={iframeCode} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={() => handleCopy(iframeCode)}>
                      {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CodeIcon className="h-4 w-4" />}
                      <span className="sr-only">{copied ? "Copied!" : "Copy embed code"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? "Copied!" : "Copy embed code"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TabsContent>
          <TabsContent value="qr" className="flex flex-col items-center space-y-4 pt-4">
            <img
              src={qrCodeUrl || "/placeholder.svg"}
              alt="QR Code"
              width={150}
              height={150}
              className="border p-1 rounded-md"
            />
            <p className="text-sm text-muted-foreground text-center">Scan to vote!</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
