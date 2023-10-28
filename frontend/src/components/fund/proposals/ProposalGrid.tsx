import { ContractIds } from '@/deployments/deployments'
import { Balance, TradeId } from '@/types'
import { FundTrade, InvestmentFund } from '@/types/fund'
import { fromDecimal, milisecondsToDate, shorttenAddress, stringToNumber } from '@/utils'
import { useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import 'twin.macro'
import ProposalCard from './ProposalCard'

type Props = {
  data: [InvestmentFund, FundTrade[]]
  onSwap: (deposit: Balance, tradeId: TradeId) => void
}

const ProposalGrid: React.FC<Props> = ({ data, onSwap }) => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(
    ContractIds.prediction_market,
  )
  const router = useRouter()
  const params = useParams()
  const [investmentFund, fundTrades] = data
  const [tradeToShow, setTradeToShow] = useState<FundTrade | null>(null)

  return (
    <div tw="mx-auto w-full overflow-hidden rounded-xl bg-white">
      <div tw="my-5 text-center">
        <p tw="text-2xl">Investment Fund: {investmentFund.metadata.name}</p>
        <div tw="flex flex-row justify-center space-x-10">
          <p>Total Shares: {investmentFund.totalShare}</p>
          <p>Total Fund: {fromDecimal(investmentFund.totalFund, 12)}</p>
        </div>
        <p>Trader: {investmentFund.trader}</p>
      </div>
      <div tw="p-4 text-center">
        <div tw="flex flex-row items-center justify-center space-x-5">
          <h3 tw="font-bold text-2xl">Swapes</h3>
          <button
            tw="rounded-3xl bg-green-400 px-5 py-2 hover:bg-lime-600"
            onClick={() => router.push(`/fund/${params?.fund_id}/proposal/create`)}
          >
            Create
          </button>
        </div>
        <div tw="mb-10 flex w-full flex-row flex-wrap text-start">
          {fundTrades.map((trade) => (
            <ProposalCard
              trade={trade}
              setTradeToShow={(trade) => setTradeToShow(trade)}
              key={trade.tradeId}
            />
          ))}
          {fundTrades.length == 0 && <div>No proposal available</div>}
        </div>
      </div>

      {tradeToShow && (
        <div
          tw="fixed top-0 left-0 z-10 h-full w-full text-black"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => setTradeToShow(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            tw="m-auto my-10 flex w-fit flex-row items-start justify-center rounded-xl bg-white p-10"
          >
            <div tw="rounded-3xl border bg-blue-200 p-3">
              <p>ID: {tradeToShow.tradeId}</p>
              <p>Proponent: {shorttenAddress(tradeToShow.proponent, 10, 8)}</p>
              {tradeToShow.proposedPerson && (
                <p>
                  Proposed Person:{' '}
                  {tradeToShow.proposedPerson == activeAccount?.address
                    ? 'you'
                    : tradeToShow.proposedPerson}
                </p>
              )}
              <p>Share: {tradeToShow.share}</p>
              <p>Price: {fromDecimal(tradeToShow.price, 12)} TZERO</p>
              <p>Close Time: {milisecondsToDate(tradeToShow.closeTime)}</p>
              <p>Is Completed: {tradeToShow.isCompleted ? 'Yes' : 'No'}</p>
              {!tradeToShow.isCompleted &&
                (tradeToShow.proposedPerson != null
                  ? tradeToShow.proposedPerson == activeAccount?.address
                  : true) && (
                  <div tw="mt-10 mb-5 flex flex-col items-center justify-start">
                    <div tw="flex flex-row text-center text-gray-700 text-xs">
                      <p>You have to send</p>
                      <p tw="mx-1 text-red-400">{fromDecimal(tradeToShow.price, 12)} TZERO</p>
                      to buy
                      <p tw="mx-1 text-red-400">{tradeToShow.share} share</p>
                      of
                      <p tw="mx-1 text-red-400">{investmentFund.metadata.name}</p>
                    </div>
                    <button
                      tw="my-1 rounded-3xl bg-green-400 px-5 py-2 hover:bg-orange-500"
                      onClick={() =>
                        onSwap(
                          stringToNumber(tradeToShow.price) ?? 0,
                          stringToNumber(tradeToShow.tradeId) ?? -1,
                        )
                      }
                    >
                      Swap
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProposalGrid
