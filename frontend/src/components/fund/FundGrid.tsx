import { ContractIds } from '@/deployments/deployments'
import { FundData } from '@/types'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import Router, { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import 'twin.macro'
import FundCard from './FundCard'
import ShowFundDetail from './ShowFundDetail'

const FundGrid = () => {
  const queries = useRouter().query
  const { api } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.prediction_market)
  const [fundData, setFundData] = useState<Array<FundData>>([])
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [fundToShow, setFundToShow] = useState<FundData | null>(null)

  const fetchFund = async () => {
    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'fundCore::getFunds', undefined, [null])

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'fundCore::getFunds',
      )
      if (isError) throw new Error(decodedOutput)

      setFundData(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setFundData([])
    } finally {
      setFetchIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFund()
  }, [contract])

  useEffect(() => {
    if (queries.fundId && fundData.length != 0) {
      const _fund = fundData.find(
        (fund) => fund[0].investmentFundId == parseInt(queries.fundId?.toString() ?? ''),
      )
      setFundToShow(_fund ?? null)
    }
  }, [queries.fundId, fundData.length])

  return (
    <>
      <div tw="w-full">
        {fetchIsLoading ? (
          <div>Loading contract...</div>
        ) : (
          <div tw="flex flex-row flex-wrap justify-center px-20">
            {(fundData || []).map((fund) => (
              <FundCard fundData={fund} key={fund[0].investmentFundId} />
            ))}
          </div>
        )}
      </div>
      {fundToShow && (
        <ShowFundDetail
          fundData={fundToShow}
          onClose={() => {
            setFundToShow(null)
            Router.push({
              pathname: `/fund`,
            })
          }}
        />
      )}
    </>
  )
}

export default FundGrid
