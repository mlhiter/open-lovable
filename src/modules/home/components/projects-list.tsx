'use client'

import { Button } from '@/components/ui/button'
import { useTRPC } from '@/trpc/client'
import { useSuspenseQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

export const ProjectsList = () => {
  const trpc = useTRPC()
  const { data: projects } = useSuspenseQuery(trpc.projects.getMany.queryOptions())

  return (
    <div className="flex w-full flex-col gap-y-6 rounded-xl border bg-white p-8 sm:gap-y-4 dark:bg-sidebar">
      <h2 className="text-2xl font-semibold">Saved Projects</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {projects?.length === 0 && (
          <div className="col-span-full text-center">
            <p className="text-sm text-muted-foreground">No projects yet</p>
          </div>
        )}
        {projects?.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            className="h-auto w-full justify-start p-4 text-start font-normal"
            asChild>
            <Link href={`/projects/${project.id}`}>
              <div className="flex items-center gap-x-4">
                <Image src="/logo.svg" alt="Doro" width={32} height={32} className="object-contain" />
                <div className="flex flex-col">
                  <h3 className="truncate font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(project.updatedAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
