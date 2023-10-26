import { ContractIds } from '@/deployments/deployments'
import { EventData } from '@/types'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import 'twin.macro'
import EventCard from './EventCard'

const EventGrid = () => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(
    ContractIds.prediction_market,
  )
  const [eventData, setEventData] = useState<Array<EventData>>([])
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()

  // Fetch Greeting
  const fetchEvents = async () => {
    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'eventCore::getEvents')

      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'eventCore::getEvents',
      )
      if (isError) throw new Error(decodedOutput)
      setEventData(output.Ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setEventData([])
    } finally {
      setFetchIsLoading(false)
    }
  }
  useEffect(() => {
    fetchEvents()
  }, [contract])
  return (
    <div tw="w-full">
      {fetchIsLoading ? (
        <div>Loading contract...</div>
      ) : (
        <div tw="flex flex-row flex-wrap justify-center px-20">
          {(eventData || []).map((event) => (
            <>
              <EventCard EventData={event} key={event[0].eventId} />
            </>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventGrid
