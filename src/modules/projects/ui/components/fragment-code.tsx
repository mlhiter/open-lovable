import { CodeView } from '@/components/code-view'
import { Fragment } from '@/generated/prisma/browser'
interface Props {
  data: Fragment
}
export const FragmentCode = ({ data }: Props) => {
  return <CodeView code={JSON.stringify(data.files, null, 2)} lang="javascript" />
}
