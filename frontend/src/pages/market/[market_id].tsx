import Attendence from '@/components/market/Attendence'
import BetWidget from '@/components/market/BetWidget'
import { ContractIds } from '@/deployments/deployments'
import { Balance, EventDetailData, FundData, InvestmentFundId, OutComeId, Supply } from '@/types'
import { milisecondsToDate, stringToNumber } from '@/utils'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
  const params = useParams()
  const market_id = params?.market_id
  const { error } = useInkathon()
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(
    ContractIds.prediction_market,
  )
  const [eventDetail, setEventDetail] = useState<EventDetailData | null>(null)
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [userFunds, setUserFunds] = useState<Array<FundData>>([])

  const [event, eventMarket, totalSupply, data] = eventDetail ? eventDetail : [null, null, 0, []]
  const winner = data.find((array) => array[0].outcomeId == eventMarket?.winningOutcome)

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
    if (eventMarket?.isResolved) {
      toast.error('Event has ended!')
      return
    }
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

  async function handleResolve(winningOutcome: OutComeId) {
    if (eventMarket?.isResolved) {
      toast.error('Event has ended!')
      return
    }
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    try {
      const rs = await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'eventCore::resolveEvent',
        {},
        [market_id, winningOutcome],
      )
      if (rs.result?.isCompleted) {
        await fetchEventDetail()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div tw="flex flex-col p-4">
      {/* Rendering Event Details */}
      <div tw="flex w-full flex-row items-center justify-start space-x-3 px-20 text-3xl">
        <Link href={'/market'} tw="text-blue-700 hover:text-purple-700">
          Market
        </Link>{' '}
        <p>{' > '}</p> <p>{event?.metadata.name ?? event?.eventId}</p>
      </div>
      <hr tw="mt-1" />
      <div tw="my-3 flex w-full flex-col items-center justify-start">
        <div tw="flex flex-col items-center justify-center space-x-3">
          <p>by @{event?.owner}</p>
          {eventMarket?.isResolved ? (
            <div tw="text-blue-700">winning bet: {winner?.[0].description}</div>
          ) : (
            event?.owner != activeAccount?.address && (
              <div>
                <p>End in {milisecondsToDate(eventMarket?.resolveDate)}</p>
              </div>
            )
          )}
        </div>
        <span tw="mt-5 rounded-3xl border-2 border-black px-5 py-3">
          <p tw="text-5xl">{event?.question}</p>
        </span>
      </div>

      {/* Rendering Other Data */}
      <div tw="my-5 flex flex-col items-center justify-start">
        <BetWidget
          userFunds={userFunds}
          data={data}
          eventOwner={event?.owner ?? ''}
          onResolve={handleResolve}
          onBet={handleBet}
        />
        <Attendence data={data} />
      </div>
    </div>
  )
}

export default HomePage
