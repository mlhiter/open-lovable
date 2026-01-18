import Image from 'next/image'
import { useState, useEffect } from 'react'

const ShimmerMessages = () => {
  const messages = [
    'Thinking...',
    'Loading...',
    'Generating...',
    'Analyzing your request...',
    'Building your website...',
    'Crafting components...',
    'Optimizing layout...',
    'Adding final touches...',
    'Almost ready...',
  ]

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex items-center gap-2">
      <span className="animate-pulse text-base text-muted-foreground">{messages[currentMessageIndex]}</span>
    </div>
  )
}

export const MessageLoading = () => {
  return (
    <div className="group flex flex-col px-2 pb-4">
      <div className="mb-2 flex items-center gap-2 pl-2">
        <Image src="/logo.svg" alt="Doro" width={18} height={18} className="shrink-0" />
        <span className="text-sm font-medium">Doro</span>
      </div>
      <div className="flex flex-col gap-y-4 pl-8.5">
        <ShimmerMessages />
      </div>
    </div>
  )
}
