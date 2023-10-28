import CreateForm from '@/components/fund/proposals/CreateForm'
import { ContractIds } from '@/deployments/deployments'
import { Balance } from '@/types'
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

const CreatePage = () => {
  const router = useRouter()
  const fundId = useParams()?.fund_id
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.prediction_market)

  const [ownerShare, setOwnerShare] = useState<Balance>(0)
  const fetchFund = async () => {
    if (!contract || !api) return

    try {
      const result = await contractQuery(api, '', contract, 'fundCore::getOwnerShare', {}, [
        fundId,
        activeAccount?.address,
      ])

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'fundCore::getOwnerShare',
      )
      if (isError) throw new Error(decodedOutput)

      console.log(output.Ok)

      setOwnerShare(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setOwnerShare(0)
    }
  }

  useEffect(() => {
    fetchFund()
  }, [contract])

  return (
    <>
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
        <p>{' > '}</p>{' '}
        <Link href={'/fund/' + fundId + '/proposal'} tw="text-blue-700 hover:text-purple-700">
          Proposals
        </Link>{' '}
        <p>{' > '}</p>
        <p>Create</p>
      </div>
      <div tw="flex items-center justify-center">
        <CreateForm owneShare={ownerShare} fundId={fundId} />
      </div>
    </>
  )
}

export default CreatePage
