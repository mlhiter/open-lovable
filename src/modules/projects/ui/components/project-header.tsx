import Link from 'next/link'
import Image from 'next/image'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, ChevronLeftIcon, SunMoonIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

interface Props {
  projectId: string
}

const isLikelySlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(value)

export const ProjectHeader = ({ projectId }: Props) => {
  const trpc = useTRPC()
  const { theme, setTheme } = useTheme()
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions(
      { id: projectId },
      {
        refetchInterval: (query) => {
          const name = query.state.data?.name
          if (!name) return 5000
          return isLikelySlug(name) ? 5000 : false
        },
      }
    )
  )

  return (
    <header className="flex items-center justify-between border-b p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="pl-2! transition-opacity hover:bg-transparent hover:opacity-75 focus-visible:ring-0">
            <Image src="/logo.svg" alt="Doro" width={18} height={18} className="shrink-0" />
            <span className="text-sm font-medium">{project.name}</span>
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom">
          <DropdownMenuItem asChild>
            <Link href={'/'}>
              <ChevronLeftIcon />
              <span className="text-sm font-medium">Back to projects</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMoonIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
