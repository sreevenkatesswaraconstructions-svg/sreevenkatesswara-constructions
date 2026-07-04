import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
const QuotationBuilder = dynamic(() => import('./builder'), { ssr: false })

export default function QuotationDetail(){
  const router = useRouter(); const { id } = router.query
  if (!id) return null
  return <QuotationBuilder quotationId={id} />
}
