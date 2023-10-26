import { CenterBody } from '@/components/layout/CenterBody'
import Bar from '@/components/market/Bar'
import EventGrid from '@/components/market/EventGrid'

const MarketPage = () => {
  return (
    <CenterBody>
      <Bar />
      <EventGrid />
    </CenterBody>
  )
}

export default MarketPage
