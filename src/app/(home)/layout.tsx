import { Navbar } from '@/modules/home/components/navbar'

interface Props {
  children: React.ReactNode
}

export default function HomeLayout({ children }: Props) {
  return (
    <main className="flex max-h-screen min-h-screen flex-col">
      <Navbar />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#dadde2_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)]" />
      <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
    </main>
  )
}
