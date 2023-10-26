import { Event, EventMarket } from './event'
import { InvestmentFund } from './fund'
import { MarketOutcome, OutCome } from './outcome'

type InvestmentFundId = number
type Share = number
type Balance = number
type EventId = string
type AccountId = string
type Supply = number
type Timestamp = number
type OutComeId = string

type EventData = [Event, EventMarket]
type OutComeData = Array<[OutCome, MarketOutcome, Array<[InvestmentFund, Supply]>]>
type EventDetailData = [Event, EventMarket, Supply, OutComeData]
type FundData = [InvestmentFund, Array<OutCome>, Share | null]

export type {
  AccountId,
  Balance,
  EventData,
  EventDetailData,
  EventId,
  FundData,
  InvestmentFundId,
  OutComeData,
  OutComeId,
  Share,
  Supply,
  Timestamp,
}
