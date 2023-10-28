import { FundTrade } from '@/types/fund'
import { fromDecimal, milisecondsToDate, shorttenAddress } from '@/utils'
import 'twin.macro'

type Props = {
  trade: FundTrade
  setTradeToShow: (trade: FundTrade) => void
}

const ProposalCard = ({ trade, setTradeToShow }: Props) => {
  return (
    <div tw="flex-1 basis-1/3 p-5" onClick={() => setTradeToShow(trade)}>
      <div tw="h-52 rounded-3xl border bg-blue-200 p-3 hover:bg-green-400">
        <p>ID: {trade.tradeId}</p>
        <p>Proponent: {shorttenAddress(trade.proponent, 10, 8)}</p>
        {trade.proposedPerson && <p>Proposed Person: {trade.proposedPerson}</p>}
        <p>Share: {trade.share}</p>
        <p>Price: {fromDecimal(trade.price, 12)} TZERO</p>
        <p>Close Time: {milisecondsToDate(trade.closeTime)}</p>
        <p>Is Completed: {trade.isCompleted ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}

export default ProposalCard
