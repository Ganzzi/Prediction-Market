import { ContractIds } from '@/deployments/deployments'
import { Balance, Share } from '@/types'
import { toDecimal } from '@/utils'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import { Button, FormControl, FormLabel, Input, VStack } from '@chakra-ui/react'
import { useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import 'twin.macro'

interface FormData {
  totalShare: Share
  metadata: Metadata
  deposit: Balance
}

type Metadata = {
  name: string | null
  imageUrl: string | null
}

const CreateForm = () => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(
    ContractIds.prediction_market,
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<FormData>()

  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()

  const onSubmit = async (data: FormData) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    setUpdateIsLoading(true)

    try {
      await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'fundCore::createFund',
        {
          value: toDecimal(data.deposit, 12),
        },
        [data.totalShare, data.metadata],
      )
      reset()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdateIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} tw="my-10 w-full md:w-2/3 xl:w-1/2">
      <VStack spacing={10}>
        <FormControl id="totalShare" isRequired>
          <FormLabel>Total Share (MIN 100 & DEVISIBLE BY 100)</FormLabel>
          <Input borderColor={'green.800'} type="text" {...register('totalShare')} />
        </FormControl>

        <FormControl id="metadata.name">
          <FormLabel>Investment Fund name (optional)</FormLabel>
          <Input borderColor={'green.800'} type="text" {...register('metadata.name')} />
        </FormControl>

        <FormControl id="metadata.imageUrl">
          <FormLabel>Investment Fund Image Url (optional)</FormLabel>
          <Input borderColor={'green.800'} type="text" {...register('metadata.imageUrl')} />
        </FormControl>

        <FormControl id="deposit" isRequired>
          <FormLabel>Investment Fund Creation Deposit (TZERO - MIN 1)</FormLabel>

          <Input
            borderColor={'green.800'}
            type="number"
            defaultValue={1}
            {...register('deposit')}
          />
        </FormControl>

        <Button colorScheme="blue" type="submit">
          Submit
        </Button>
      </VStack>
    </form>
  )
}

export default CreateForm
