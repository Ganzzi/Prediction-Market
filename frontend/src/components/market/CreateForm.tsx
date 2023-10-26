import { ContractIds } from '@/deployments/deployments'
import { Balance, Timestamp } from '@/types'
import { EventMetadata } from '@/types/event'
import { OutComePayload } from '@/types/outcome'
import { dateToMilliseconds, toDecimal } from '@/utils'
import { contractTxWithToast } from '@/utils/contractTxWithToast'
import { Box, Button, FormControl, FormLabel, Input, VStack } from '@chakra-ui/react'
import { useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import 'twin.macro'

interface FormData {
  question: string
  resolveDate: Timestamp
  metadata: EventMetadata
  deposit: Balance
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

  const [betItems, setBetItems] = useState<OutComePayload[]>([])
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()

  const addNewBet = () => {
    const newBet: OutComePayload = {
      description: '',
      depositPerSupply: 0,
      totalSupply: 0,
    }
    setBetItems([...betItems, newBet])
  }

  const removeBet = (index: number) => {
    const updatedBets = [...betItems]
    updatedBets.splice(index, 1)
    setBetItems(updatedBets)
  }

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
        'eventCore::createEvent',
        {
          value: toDecimal(data.deposit, 12),
        },
        [
          data.question,
          data.resolveDate,
          betItems?.map((outcome) => {
            return {
              ...outcome,
              depositPerSupply: toDecimal(outcome.depositPerSupply, 12),
            }
          }),
          data.metadata,
        ],
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
        <FormControl id="metadata.name">
          <FormLabel>Event Name (optional)</FormLabel>
          <Input type="text" {...register('metadata.name')} />
        </FormControl>

        <FormControl id="metadata.imageUrl">
          <FormLabel>Event Image Url (optional)</FormLabel>
          <Input type="text" {...register('metadata.imageUrl')} />
        </FormControl>

        <FormControl id="metadata.description">
          <FormLabel>Event Description (optional)</FormLabel>
          <Input type="text" {...register('metadata.description')} />
        </FormControl>

        <FormControl id="deposit" isRequired>
          <FormLabel>Event Creation Deposit (TZERO - MIN 1)</FormLabel>

          <Input type="number" defaultValue={1} {...register('deposit')} />
        </FormControl>

        <FormControl id="resolveDate" isRequired>
          <FormLabel>Resolve Date</FormLabel>
          <Input
            type="date"
            onChange={(e) => {
              setValue('resolveDate', dateToMilliseconds(e.target.value))
            }}
          />
        </FormControl>

        <FormControl id="question" isRequired>
          <FormLabel>Question</FormLabel>
          <Input type="text" {...register('question', { required: true })} />
        </FormControl>

        <Box tw="flex w-full flex-row items-center justify-between">
          <FormLabel>Bets (optional)</FormLabel>
          <Button colorScheme="green" onClick={addNewBet}>
            Add Bet
          </Button>
        </Box>
        {betItems.map((bet, index) => (
          <Box key={index} tw="w-full border border-blue-400 px-10 py-3">
            <Box tw="flex flex-row justify-center space-x-5">
              <FormLabel tw="text-3xl">OUTCOME {index + 1}</FormLabel>
              <Button colorScheme="red" onClick={() => removeBet(index)}>
                Remove
              </Button>
            </Box>

            <FormControl id={`bets[${index}].description`} isRequired>
              <FormLabel>Description</FormLabel>
              <Input
                type="text"
                value={betItems[index].description}
                onChange={(e) => {
                  const updatedBetItems = [...betItems]
                  updatedBetItems[index].description = e.target.value
                  setBetItems(updatedBetItems)
                }}
              />
            </FormControl>

            <FormControl id={`bets.${index}.totalSupply`} isRequired>
              <FormLabel>Total Supply</FormLabel>
              <Input
                type="number"
                value={betItems[index].totalSupply}
                onChange={(e) => {
                  const updatedBetItems = [...betItems]
                  updatedBetItems[index].totalSupply = parseInt(e.target.value)
                  setBetItems(updatedBetItems)
                }}
              />
            </FormControl>

            <FormControl id={`bets.${index}.depositPerSupply`} isRequired>
              <FormLabel>Deposit per Supply</FormLabel>
              <Input
                type="number"
                value={betItems[index].depositPerSupply}
                onChange={(e) => {
                  const updatedBetItems = [...betItems]
                  updatedBetItems[index].depositPerSupply = parseInt(e.target.value)
                  setBetItems(updatedBetItems)
                }}
              />
            </FormControl>
          </Box>
        ))}

        <Button colorScheme="blue" type="submit">
          Submit
        </Button>
      </VStack>
    </form>
  )
}

export default CreateForm
