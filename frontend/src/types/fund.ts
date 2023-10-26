import { AccountId, Balance, InvestmentFundId, Share } from '.'

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

export type { FundMetadata, InvestmentFund }
