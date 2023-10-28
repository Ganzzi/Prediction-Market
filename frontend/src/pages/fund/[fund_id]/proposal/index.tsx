import ProposalGrid from '@/components/fund/proposals/ProposalGrid'
import { CenterBody } from '@/components/layout/CenterBody'
import { ContractIds } from '@/deployments/deployments'
import { Balance, TradeId } from '@/types'
import { FundTrade, InvestmentFund } from '@/types/fund'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import 'twin.macro'

type FundTradeData = [InvestmentFund, FundTrade[]]

const FundProposalPage = () => {
  const router = useRouter()
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(
    ContractIds.prediction_market,
  )
  const params = useParams()
  const fundId = params?.fund_id

  const [data, setData] = useState<FundTradeData | null>(null)

  const fetchFundProposal = async () => {
    if (!contract || !api) return

    try {
      const result = await contractQuery(api, '', contract, 'fundCore::getFundProposals', {}, [
        fundId,
      ])

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'fundCore::getFundProposals',
      )
      if (isError) throw new Error(decodedOutput)
      setData(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setData(null)
    }
  }

  useEffect(() => {
    fetchFundProposal()
  }, [contract])

  const handleSwap = async (deposit: Balance, tradeId: TradeId) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    try {
      const rs = await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'fundCore::acceptProposal',
        {
          value: deposit,
        },
        [tradeId],
      )
      if (rs.result?.isCompleted) await fetchFundProposal()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <CenterBody>
      <div tw="mt-6 flex w-full flex-row items-center justify-start space-x-3 px-20 text-3xl">
        <Link href={'/fund'} tw="text-blue-700 hover:text-purple-700">
          Investmen fund
        </Link>
        <p>{' > '}</p>{' '}
        <p
          onClick={() =>
            router.push({
              pathname: `/fund`,
              query: {
                fundId,
              },
            })
          }
          tw="text-blue-700 hover:text-purple-700"
        >
          {fundId}
        </p>{' '}
        <p>{' > '}</p> <p>Proposals</p>
      </div>
      {data && <ProposalGrid data={data} onSwap={handleSwap} />}
    </CenterBody>
  )
}

export default FundProposalPage
