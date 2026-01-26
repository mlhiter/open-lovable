'use client'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { MessagesContainer } from '../components/messages-container'
import { Suspense, useState } from 'react'
import { Fragment } from '@/generated/prisma/browser'
import { ProjectHeader } from '../components/project-header'
import { FragmentWeb } from '../components/fragment-web'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeIcon, CrownIcon, EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileExplorer } from '@/components/file-explorer'
import { UserControl } from '@/components/user-control'
import { useAuth } from '@clerk/nextjs'
import { ErrorBoundary } from 'react-error-boundary'

interface Props {
  projectId: string
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null)
  const [tabStatus, setTabStatus] = useState<'preview' | 'code'>('preview')

  const { has } = useAuth()
  const hasProAccess = has?.({ plan: 'pro' })

  return (
    <div className="h-screen">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={35} minSize={20} className="flex min-h-0 flex-col">
          <ErrorBoundary fallback={<p>Project header error.</p>}>
            <Suspense fallback={<p>Loading project...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<p>Messages container error.</p>}>
            <Suspense fallback={<p>Loading messages...</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="transition-colors hover:bg-primary/20 focus-visible:ring-0" />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            defaultValue="preview"
            value={tabStatus}
            className="h-full gap-y-0"
            onValueChange={(value) => setTabStatus(value as 'preview' | 'code')}>
            <div className="flex w-full items-center gap-x-2 border-b p-2">
              <TabsList className="h-8 rounded-md border p-0">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button size="sm" variant="tertiary" asChild>
                    <Link href="/pricing">
                      <CrownIcon />
                      Upgrade
                    </Link>
                  </Button>
                )}
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview" className="h-full">
              {activeFragment ? <FragmentWeb data={activeFragment} /> : <EmptyPreviewState />}
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment?.files && <FileExplorer files={activeFragment.files as { [path: string]: string }} />}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

const EmptyPreviewState = () => {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden">
      <div className="w-full max-w-2xl space-y-6 rounded-2xl border p-8">
        <div className="flex items-start gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary/70" />
              Preview is waiting
            </div>
            <h3 className="text-lg font-semibold">Select a fragment to see the live demo</h3>
            <p className="text-sm text-muted-foreground">
              This panel renders the UI and code that your prompts generate. Pick a fragment from the left or create a
              new one to get started.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Step 1</p>
            <p className="mt-2 text-sm font-medium">Generate a fragment</p>
            <p className="mt-1 text-sm text-muted-foreground">Send a prompt in the chat to build a preview.</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Step 2</p>
            <p className="mt-2 text-sm font-medium">Select it in the list</p>
            <p className="mt-1 text-sm text-muted-foreground">Click the message to load its Demo and Code.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
