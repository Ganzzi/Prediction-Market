import Attendence from '@/components/market/Attendence'
import BetWidget from '@/components/market/BetWidget'
import { ContractIds } from '@/deployments/deployments'
import { Balance, EventDetailData, FundData, InvestmentFundId, OutComeId, Supply } from '@/types'
import { stringToNumber } from '@/utils'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
  const params = useParams()
  const market_id = params.market_id
  const { error } = useInkathon()
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(
    ContractIds.prediction_market,
  )
  const [eventDetail, setEventDetail] = useState<EventDetailData | null>(null)
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [userFunds, setUserFunds] = useState<Array<FundData>>([])

  const fetchEventDetail = async () => {
    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(
        api,
        '',
        contract,
        'eventCore::getEventDetail',
        undefined,
        [market_id],
      )

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'eventCore::getEventDetail',
      )
      if (isError) throw new Error(decodedOutput)

      setEventDetail(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setEventDetail(null)
    } finally {
      setFetchIsLoading(false)
    }
  }

  const fetchUserFunds = async () => {
    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'fundCore::getFunds', {}, [
        activeAccount?.address,
      ])

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'fundCore::getFunds',
      )
      if (isError) throw new Error(decodedOutput)
      setUserFunds(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setUserFunds([])
    } finally {
      setFetchIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEventDetail()
    fetchUserFunds()
  }, [contract])

  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  async function handleBet(
    outcomeId: OutComeId,
    fundId: InvestmentFundId,
    supply: Supply,
    depositPerSupply: Balance,
  ) {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    try {
      const rs = await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'fundCore::bet',
        {
          value: supply * (stringToNumber(depositPerSupply) ?? 0),
        },
        [outcomeId, fundId, supply],
      )
      if (rs.result?.isCompleted) {
        await fetchEventDetail()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const [event, eventMarket, totalSupply, data] = eventDetail ? eventDetail : [null, null, 0, []]

  return (
    <div tw="flex flex-col p-4">
      {/* Rendering Event Details */}
      <div tw="my-3 flex w-full flex-col items-center justify-start">
        <div tw="flex flex-row items-center justify-center space-x-3">
          <p>by @{event?.owner}</p> <button tw="rounded-2xl bg-red-400 px-5 py-2">Resolve</button>
        </div>
        <span>
          question: <p tw="text-5xl">{event?.question}</p>
        </span>
      </div>

      {/* Rendering Other Data */}
      <div tw="my-10 flex flex-col items-center justify-start">
        <BetWidget userFunds={userFunds} data={data} onBet={handleBet} />
        <Attendence data={data} />
      </div>
    </div>
  )
}

export default HomePage
