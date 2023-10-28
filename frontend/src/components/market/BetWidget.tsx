import {
  AccountId,
  Balance,
  FundData,
  InvestmentFundId,
  OutComeData,
  OutComeId,
  Supply,
} from '@/types'
import { fromDecimal } from '@/utils'
import { Input } from '@chakra-ui/react'
import { useInkathon } from '@scio-labs/use-inkathon'
import { useState } from 'react'
import toast from 'react-hot-toast'
import 'twin.macro'
import { SelectList, SelectOption } from './SelectList'

type Props = {
  eventOwner: AccountId
  data: OutComeData
  userFunds: Array<FundData>
  onBet: (
    outcomeId: OutComeId,
    fundId: InvestmentFundId,
    supply: Supply,
    depositPerSupply: Balance,
  ) => void
  onResolve: (winningOutcome: OutComeId) => void
}

type PayloadError = {
  supply: boolean
  fund: boolean
}

type Bet = {
  outcomeId: OutComeId
  depositPerSupply: Balance
} | null

const BetWidget = ({ data, userFunds, onBet, eventOwner, onResolve }: Props) => {
  const { api, activeAccount, activeSigner } = useInkathon()

  const [selectedBet, setSelectedBet] = useState<Bet>(null)
  const [selectedFund, setSelectedFund] = useState<SelectOption | null>(null)
  const [supplyToBuy, setsupplyToBuy] = useState<Supply>(0)
  const [payloadErrors, setPayloadErrors] = useState<PayloadError>({
    supply: false,
    fund: false,
  })

  const ownedFund = userFunds
    .filter((fund) => fund[0].trader == activeAccount?.address)
    .map((fund) => {
      return {
        value: fund[0].investmentFundId,
        label: fund[0].metadata.name ?? '',
      }
    })

  async function handleBet() {
    setPayloadErrors({
      supply: supplyToBuy == 0 ? true : false,
      fund: !selectedFund ? true : false,
    })
    if (!selectedBet || !selectedFund) {
      toast.error('supply and fund are required!')
      return
    }

    if (supplyToBuy == 0) {
      toast.error('Must buy at least 1 supply!')
      return
    }

    onBet(selectedBet.outcomeId, selectedFund.value, supplyToBuy, selectedBet.depositPerSupply)
  }

  async function handleResolve() {
    if (!selectedBet) {
      toast.error('Winning outcome is required!')
      return
    }

    onResolve(selectedBet.outcomeId)
  }

  return (
    <>
      <p>There are {data?.length} outcomes</p>
      <div tw="flex flex-row justify-center space-x-10">
        {(data || []).map(([outcome, marketOutcome, investmentFunds], index) => (
          <div
            key={index}
            tw="m-2 flex flex-col items-center justify-between rounded-2xl py-5"
            onClick={() =>
              setSelectedBet({
                outcomeId: outcome.outcomeId,
                depositPerSupply: outcome.depositPerSupply,
              })
            }
            style={{
              minWidth: 300,
              maxWidth: 700,
              backgroundColor: `${
                outcome.outcomeId == selectedBet?.outcomeId ? '#555555' : '#DDDDDD'
              }`,
            }}
          >
            <div>
              <p tw="text-2xl">{outcome.description}</p>
            </div>
            <div tw="mt-8 flex w-full flex-row items-center justify-center space-x-5">
              <div tw="w-fit rounded-3xl bg-blue-300 px-4 py-2">
                <p>{outcome.totalSupply} supplies</p>
              </div>
              <div tw="w-fit rounded-3xl bg-green-300 px-4 py-2">
                <p>{marketOutcome.availableSupply} available!</p>
              </div>
            </div>
            <div tw="my-2 flex w-fit flex-row items-center justify-center space-x-10 rounded-3xl bg-yellow-300 px-4 py-2">
              <p>{fromDecimal(outcome.depositPerSupply, 12)} (TZERO/Supply)</p>
            </div>
          </div>
        ))}
      </div>

      {eventOwner != activeAccount?.address ? (
        <div tw="mt-5 flex flex-row items-center justify-between space-x-3">
          <div tw="flex-1 flex justify-center">
            <Input
              borderColor={'green.800'}
              type="number"
              style={{
                borderColor: `${payloadErrors.supply && 'red'}`,
              }}
              placeholder="Supply to buy"
              min={1}
              value={supplyToBuy != 0 ? supplyToBuy : ''}
              onChange={(e) => setsupplyToBuy(parseInt(e.target.value))}
            />
          </div>
          <div tw="flex-1 flex justify-center">
            <button
              tw="rounded-3xl bg-blue-500 px-5 py-1 text-3xl hover:bg-blue-600"
              onClick={handleBet}
            >
              Bet
            </button>
          </div>
          <div tw="flex-1 flex justify-center">
            <SelectList
              error={payloadErrors.fund}
              onChange={function (value: SelectOption | null): void {
                setSelectedFund(value)
              }}
              options={ownedFund}
              value={selectedFund ?? null}
            />
          </div>
        </div>
      ) : (
        <div tw="mt-5">
          <button
            tw="rounded-3xl bg-blue-500 px-5 py-1 text-3xl hover:bg-blue-600"
            onClick={handleResolve}
          >
            Resolve
          </button>
        </div>
      )}
    </>
  )
}

export default BetWidget
