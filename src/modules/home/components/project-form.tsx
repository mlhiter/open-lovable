'use client'

import { useForm } from 'react-hook-form'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import TextareaAutoSize from 'react-textarea-autosize'
import { Form, FormField } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PROJECT_TEMPLATES } from '@/app/(home)/constants'

const formSchema = z.object({
  value: z.string().min(1, { message: 'Value is required' }).max(10000, { message: 'Value is too long' }),
})

export const ProjectForm = () => {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: '',
    },
  })
  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => {
        //TODO: Redirect to pricing page if specific error
        toast.error(error.message)
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions())

        router.push(`/projects/${data.id}`)
        //TODO: Invalidate usage status
      },
    })
  )
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
    })
  }

  const onSelect = (value: string) => {
    form.setValue('value', value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    })
  }

  const [isFocused, setIsFocused] = useState(false)
  const isPending = createProject.isPending
  const isButtonDisabled = isPending || !form.formState.isValid

  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            'relative rounded-xl border bg-sidebar p-4 pt-1 transition-all dark:bg-sidebar',
            isFocused && 'shadow-xs'
          )}>
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <TextareaAutoSize
                {...field}
                disabled={isPending}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                minRows={2}
                maxRows={8}
                className="w-full resize-none border-none bg-transparent pt-4 outline-none"
                placeholder="What would you like to build?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    form.handleSubmit(onSubmit)(e)
                  }
                }}
              />
            )}
          />
          <div className="flex items-end justify-between gap-x-2 pt-2">
            <div className="font-mono text-[10px] text-muted-foreground">
              <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp;to submit
            </div>
            <Button
              type="submit"
              disabled={isButtonDisabled}
              className={cn('size-8 rounded-full', isButtonDisabled && 'border bg-muted-foreground')}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpIcon />}
            </Button>
          </div>
        </form>
        <div className="hidden max-w-3xl flex-wrap justify-center gap-2 md:flex">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              key={template.title}
              variant="outline"
              className="bg-white dark:bg-sidebar"
              size="sm"
              onClick={() => onSelect(template.prompt)}>
              {template.emoji} {template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  )
}
