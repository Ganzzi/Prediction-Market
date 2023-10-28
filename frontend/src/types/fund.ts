import { AccountId, Balance, InvestmentFundId, Share, Timestamp, TradeId } from '.'

type InvestmentFund = {
  investmentFundId: InvestmentFundId
  metadata: FundMetadata
  totalShare: Share
  totalFund: Balance
  trader: AccountId
}

type FundMetadata = {
  name: string | null
  imageUrl: string | null
}

type FundTrade = {
  investmentFundId: InvestmentFundId
  tradeId: TradeId
  proponent: AccountId
  proposedPerson: AccountId | null
  share: Share
  price: Balance
  closeTime: Timestamp
  isCompleted: boolean
}

export type { FundMetadata, FundTrade, InvestmentFund }
