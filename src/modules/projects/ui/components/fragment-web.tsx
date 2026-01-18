import { Hint } from '@/components/hint'
import { Button } from '@/components/ui/button'
import { Fragment } from '@/generated/prisma/browser'
import { ExternalLinkIcon, RefreshCcwIcon } from 'lucide-react'
import { useState } from 'react'

interface Props {
  data: Fragment
}

export const FragmentWeb = ({ data }: Props) => {
  const [copied, setCopied] = useState(false)
  const [fragmentKey, setFragmentKey] = useState(0)

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-x-2 border-b bg-sidebar p-2">
        <Hint text="Refresh" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon className="size-4" />
          </Button>
        </Hint>
        <Hint text="Copy" side="bottom" align="start">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="flex-1 justify-start text-start font-normal"
            disabled={!data.sandboxUrl || copied}>
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>
        <Hint text="Open in new tab" side="bottom" align="start">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!data.sandboxUrl) return
              window.open(data.sandboxUrl, '_blank')
            }}
            disabled={!data.sandboxUrl}>
            <ExternalLinkIcon className="size-4" />
          </Button>
        </Hint>
      </div>
      <iframe
        src={data.sandboxUrl}
        className="h-full w-full"
        sandbox="allow-scripts allow-same-origin allow-forms"
        key={fragmentKey}
      />
    </div>
  )
}
