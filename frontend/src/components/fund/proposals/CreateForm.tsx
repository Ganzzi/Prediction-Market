import { ContractIds } from '@/deployments/deployments'
import { AccountId, Balance, InvestmentFundId, Share, Timestamp } from '@/types'
import { dateToMilliseconds, toDecimal } from '@/utils'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import { Button, FormControl, FormLabel, Input, VStack } from '@chakra-ui/react'
import { useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import 'twin.macro'

interface FormData {
  share: Share
  price: Balance
  duration: Timestamp | null
  proposedPerson: AccountId | null
}

type Props = {
  owneShare: Balance
  fundId: InvestmentFundId | any
}

const CreateForm = ({ owneShare, fundId }: Props) => {
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

  const onSubmit = async (data: FormData) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    const payload = [
      fundId,
      data.share,
      toDecimal(data.price, 12),
      data?.duration ? data?.duration : null,
      data?.proposedPerson != '' ? data?.proposedPerson : null,
    ]

    try {
      await contractTxWithToast(
        api,
        activeAccount.address,
        contract,
        'fundCore::createProposal',
        {},
        payload,
      )
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} tw="my-10 w-full md:w-2/3 xl:w-1/2">
      <VStack spacing={10}>
        <FormControl>
          <FormLabel>Creating a proposal of fund with ID: {fundId}</FormLabel>
          <Input borderColor={'green.800'} type="text" isDisabled value={fundId} />
        </FormControl>

        <FormControl id="share" isRequired>
          <FormLabel>Share to swap (you have {owneShare} share)</FormLabel>
          <Input
            borderColor={'green.800'}
            type="number"
            defaultValue={1}
            {...register('share')}
            min={1}
            max={owneShare}
          />
        </FormControl>

        <FormControl id="price" isRequired>
          <FormLabel>Price each share</FormLabel>
          <Input borderColor={'green.800'} type="number" defaultValue={1} {...register('price')} />
        </FormControl>

        <FormControl id="duration">
          <FormLabel>Duration (optional)</FormLabel>
          <Input
            borderColor={'green.800'}
            type="date"
            onChange={(e) => {
              const today = new Date()
              const todayMilliseconds = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              ).getTime()
              console.log(dateToMilliseconds(e.target.value) - todayMilliseconds)

              const duration = dateToMilliseconds(e.target.value) - todayMilliseconds

              setValue('duration', duration)
            }}
          />
        </FormControl>

        <FormControl id="proposedPerson">
          <FormLabel>Proposed Person (optional)</FormLabel>
          <Input borderColor={'green.800'} type="text" {...register('proposedPerson')} />
        </FormControl>

        <Button colorScheme="blue" type="submit">
          Submit
        </Button>
      </VStack>
    </form>
  )
}

export default CreateForm
