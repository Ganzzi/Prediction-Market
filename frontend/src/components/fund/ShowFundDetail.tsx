import { Balance, FundData } from '@/types'
import { fromDecimal, shorttenAddress } from '@/utils'
// import styled from '@emotion/styled';
import { ContractIds } from '@/deployments/deployments'
import { AccountId } from '@/types'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import 'twin.macro'

type Props = {
  fundData: FundData
  onClose: () => void
}

function ShowFundDetail({ onClose, fundData }: Props) {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.prediction_market)

  const [showTransferInput, setShowTransferInput] = useState<boolean>(false)
  const [transferPayload, setTransferPayload] = useState<{
    amount: Balance
    recipient: AccountId
  }>({
    amount: 0,
    recipient: '',
  })
  const [ownerFund, setOwnerFund] = useState<Balance>(0)

  const fetchFund = async () => {
    if (!contract || !api) return

    try {
      const result = await contractQuery(api, '', contract, 'fundCore::getOwnerShare', {}, [
        fundData[0].investmentFundId,
        activeAccount?.address,
      ])

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'fundCore::getOwnerShare',
      )
      if (isError) throw new Error(decodedOutput)

      setOwnerFund(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setOwnerFund(0)
    }
  }

  useEffect(() => {
    // fetchFund()
  }, [contract])

  async function handleTransfer() {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    if (!showTransferInput) {
      setShowTransferInput(true)
      return
    }

    try {
      await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'fundCore::transferShare',
        {},
        [fundData[0].investmentFundId, transferPayload.recipient, transferPayload.amount],
      )
    } catch (e) {
      console.error(e)
    }
  }
  return (
    <div
      onClick={onClose}
      tw="fixed top-0 left-0 z-10 h-full w-full text-black"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        tw="m-auto my-10 flex w-fit flex-row items-start justify-center rounded-xl bg-white p-10"
      >
        <div tw="w-full px-5">
          <div tw="flex flex-row items-center justify-start">
            {fundData[0].metadata.imageUrl && (
              <div tw="flex h-20 w-20 items-center justify-center">
                <Image
                  src={fundData[0].metadata.imageUrl ?? undefined}
                  alt=""
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 50,
                  }}
                />
              </div>
            )}
            <div>
              <p tw="text-2xl">{fundData[0].metadata.name}</p>
            </div>
          </div>
          <div tw="text-sm">
            <p tw="">trader: @{shorttenAddress(fundData[0].trader, 8, 6)}</p>
            <div tw="flex flex-row justify-between space-x-10">
              <p>{fundData[0].totalShare} shares</p>
              <p>{fromDecimal(fundData[0].totalFund, 12)} TZERO in pool</p>
            </div>
          </div>
          <div tw="my-5 flex flex-col items-center justify-start">
            <p tw="text-xs text-green-500">You hold {ownerFund} share</p>
            <div tw="rounded-3xl bg-blue-400 px-5 py-2 hover:bg-indigo-600">Buy/Sell share</div>
          </div>
          <div tw="mb-5 flex flex-col items-center justify-start">
            {showTransferInput && (
              <div tw="flex flex-col items-center">
                <input
                  type="number"
                  tw="mb-1 rounded-xl border-gray-200 border-2 px-3 text-center text-sm hover:border-black"
                  onChange={(e) =>
                    setTransferPayload({
                      ...transferPayload,
                      amount: parseInt(e.target.value),
                    })
                  }
                  value={transferPayload.amount != 0 ? transferPayload.amount : ''}
                  placeholder="Share"
                />
                <input
                  type="text"
                  tw="mb-1 rounded-xl border-gray-200 border-2 px-3 text-center text-sm hover:border-black"
                  onChange={(e) =>
                    setTransferPayload({
                      ...transferPayload,
                      recipient: e.target.value,
                    })
                  }
                  value={transferPayload.recipient}
                  placeholder="Recipient"
                />
              </div>
            )}
            <div tw="flex flex-row items-center justify-center">
              <div
                tw="rounded-3xl bg-orange-500 px-5 py-2 hover:bg-red-600"
                onClick={handleTransfer}
              >
                Transfer
              </div>
              {showTransferInput && (
                <div tw="px-1 text-red-600 text-2xl" onClick={() => setShowTransferInput(false)}>
                  X
                </div>
              )}
            </div>
          </div>
        </div>
        {fundData[1].length != 0 && (
          <div tw="mx-10 w-full">
            <p tw="mb-3 text-center">Betted Outcomes</p>
            <div tw="flex h-72 w-80 flex-col justify-start space-y-2 overflow-y-auto px-5">
              {fundData[1].map((outcome) => (
                <div tw="w-full rounded-3xl bg-blue-300 px-5 text-center" key={outcome.outcomeId}>
                  <p tw="text-xl">{outcome.description}</p>
                  <p tw="text-xs">
                    {outcome.totalSupply} supplies - {fromDecimal(outcome.depositPerSupply, 12)}{' '}
                    TZERO/supply
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShowFundDetail
