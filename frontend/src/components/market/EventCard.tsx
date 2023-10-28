import { EventData } from '@/types'
import { milisecondsToDate, parsePrice, shorttenAddress } from '@/utils'
import Router from 'next/router'
import React from 'react'
import 'twin.macro'

type Props = {
  EventData: EventData
}

const EventCard: React.FC<Props> = ({ EventData }) => {
  const event = EventData[0]
  const market = EventData[1]

  return (
    <div tw={'flex-1 basis-1/3 p-3 hover:p-1'}>
      <div
        tw="flex h-48 flex-col rounded-2xl bg-blue-200 p-3 hover:bg-green-400"
        onClick={() =>
          Router.push({
            pathname: `/market/${event.eventId}`,
          })
        }
      >
        <div>
          <p>{event.question}</p>
          <p> by @{shorttenAddress(event.owner, 6, 4)}</p>
        </div>
        <div>
          <p>{parsePrice(market.pool.toString(), 12)} TZERO</p>
        </div>
        <div>
          <p>{EventData[2]} supplies</p>
          <p>{milisecondsToDate(market.resolveDate)} ends</p>
        </div>
      </div>
    </div>
  )
}

export default EventCard
