import { Balance, EventId, OutComeId, Supply } from '.'

type OutCome = {
  eventId: EventId
  outcomeId: OutComeId
  description: string
  depositPerSupply: Balance
  totalSupply: Supply
}

type MarketOutcome = {
  eventId: EventId
  outcomeId: OutComeId
  availableSupply: Supply
}

interface OutComePayload {
  description: string
  depositPerSupply: Balance
  totalSupply: Supply
}

export type { MarketOutcome, OutCome, OutComePayload }
