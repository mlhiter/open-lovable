import { useTRPC } from '@/trpc/client'
import { useSuspenseQuery } from '@tanstack/react-query'
import { MessageCard } from './message-card'
import { MessageForm } from './message-form'
import { useEffect, useRef } from 'react'
import { Fragment } from '@/generated/prisma/browser'
import { MessageLoading } from './message-loading'

interface Props {
  projectId: string
  activeFragment: Fragment | null
  setActiveFragment: (fragment: Fragment | null) => void
}

export const MessagesContainer = ({ projectId, activeFragment, setActiveFragment }: Props) => {
  const trpc = useTRPC()
  const bottomRef = useRef<HTMLDivElement>(null)
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      {
        refetchInterval: 5000,
      }
    )
  )

  // useEffect(() => {
  //   const lastAssistantMessageWithFragment = messages.findLast(
  //     (message) => message.role === 'ASSISTANT' && message.fragment
  //   )
  //   if (lastAssistantMessageWithFragment) {
  //     setActiveFragment(lastAssistantMessageWithFragment.fragment)
  //   }
  // }, [messages, setActiveFragment])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const lastMessage = messages[messages.length - 1]
  const isLastMessageUser = lastMessage?.role === 'USER'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragment?.id}
              onFragmentClick={() => {
                setActiveFragment(message.fragment)
              }}
              type={message.type}
            />
          ))}
          {isLastMessageUser && <MessageLoading />}
        </div>
        <div ref={bottomRef} />
      </div>
      <div className="relative p-3 pt-1">
        <div className="pointer-events-none absolute -top-6 right-0 left-0 h-6 bg-linear-to-b from-transparent to-background" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  )
}
