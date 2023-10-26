import { AccountId, EventId, OutComeId, Supply, Timestamp } from '.'

interface Event {
  eventId: string // Assuming EventId is represented as a string
  owner: AccountId // Assuming AccountId is represented as a string
  question: string
  metadata: EventMetadata // Assuming EventMetadata is another interface
}

interface EventMarket {
  eventId: EventId // Assuming EventId is represented as a string
  pool: number // Assuming Balance is represented as a number
  isResolved: boolean
  totalSupply: Supply // Assuming Supply is represented as a number
  resolveDate: Timestamp // Assuming Timestamp is represented as a number
  winningOutcome: OutComeId | null // Assuming OutComeId is represented as a string
}

interface EventMetadata {
  name?: string | null
  imageUrl?: string | null
  description?: string | null
}

export type { Event, EventMarket, EventMetadata }
