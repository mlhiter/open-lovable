import { MessageRole, MessageType, Fragment } from '@/generated/prisma/browser'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Image from 'next/image'
import { ChevronRightIcon, Code2Icon } from 'lucide-react'

interface MessageCardProps {
  content: string
  role: MessageRole
  fragment: Fragment | null
  createdAt: Date
  isActiveFragment: boolean
  onFragmentClick: () => void
  type: MessageType
}

export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: MessageCardProps) => {
  if (role === MessageRole.ASSISTANT) {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
      />
    )
  }
  return <UserMessage content={content} />
}

interface UserMessageProps {
  content: string
}

export const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end pr-2 pb-4 pl-10">
      <Card className="max-w-[80%] rounded-lg border-none bg-muted p-3 break-words shadow-none">
        <CardContent>
          <p>{content}</p>
        </CardContent>
      </Card>
    </div>
  )
}

interface AssistantMessageProps {
  content: string
  fragment: Fragment | null
  createdAt: Date
  isActiveFragment: boolean
  onFragmentClick: () => void
  type: MessageType
}

export const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: AssistantMessageProps) => {
  return (
    <div className={cn('group flex flex-col px-2 pb-4', type === 'ERROR' && 'text-red-700 dark:text-red-500')}>
      <div className="mb-2 flex items-center gap-2 pl-2">
        <Image src="/logo.svg" alt="Doro" width={20} height={20} className="shrink-0" />
        <span className="text-sm font-medium">Doro</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMMM dd, yyyy")}
        </span>
      </div>
      <div className="flex flex-col gap-y-4 pl-8.5">
        <span>{content}</span>
        {fragment && type == 'RESULT' && (
          <FragmentCard fragment={fragment} isActiveFragment={isActiveFragment} onFragmentClick={onFragmentClick} />
        )}
      </div>
    </div>
  )
}

interface FragmentCardProps {
  fragment: Fragment
  isActiveFragment: boolean
  onFragmentClick: (fragment: Fragment) => void
}

export const FragmentCard = ({ fragment, isActiveFragment, onFragmentClick }: FragmentCardProps) => {
  return (
    <button
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-lg border bg-muted p-3 text-start transition-colors hover:bg-secondary',
        isActiveFragment && 'border-primary bg-primary text-primary-foreground hover:bg-primary'
      )}
      onClick={() => onFragmentClick(fragment)}>
      <Code2Icon className="mt-0.5 size-4" />
      <div className="flex flex-1 flex-col">
        <span className="line-clamp-1 text-sm font-medium">{fragment.title}</span>
        <span className="text-xs text-muted-foreground">Preview</span>
      </div>
      <div className="mt-0.5 flex items-center justify-center">
        <ChevronRightIcon className="size-4" />
      </div>
    </button>
  )
}
