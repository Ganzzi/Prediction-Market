use ink::prelude::string::String;
use ink::prelude::vec::Vec;
use ink::primitives::AccountId;

pub type OutComeId = u64;
pub type InvestmentFundId = u64;
pub type TradeId = u64;
pub type EventId = u64;
pub type Share = u64;
pub type Supply = u64;
pub type Balance = u128;
pub type Timestamp = u64;
pub type Hash = [u8; 32];
pub type BlockNumber = u32;

pub const MIN_EVENT_DEPOSIT: Balance = 1_000_000_000_000;
pub const MIN_FUND_DEPOSIT: Balance = 1_000_000_000_000;
pub const MIN_FUND_SHARE: Share = 100;

pub struct MyEnvironment;

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct Event {
    pub event_id: EventId,
    pub owner: AccountId,
    pub name: String,
    pub creation_deposit: Balance,
    pub total_supply: Supply,
    pub bets: Vec<OutComeId>,
    pub resolve_date: Timestamp,
    pub winning_outcome: Option<OutComeId>,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct OutCome {
    pub event_id: EventId,
    pub outcome_id: OutComeId,
    pub description: String,
    pub deposit_per_supply: Balance,
    pub total_supply: Supply,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct OutComePayload {
    pub description: String,
    pub deposit_per_supply: Balance,
    pub total_supply: Supply,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct EventMarket {
    pub event_id: EventId,
    pub pool: Balance,
    pub is_resolved: bool,
    pub outcomes: Vec<OutComeId>,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct MarketOutCome {
    pub event_id: EventId,
    pub outcome_id: OutComeId,
    pub available_supply: Supply,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct InvestmentFund {
    pub investment_fund_id: InvestmentFundId,
    pub metadata: FundMetadata,
    pub total_share: Share,
    pub total_fund: Balance,
    pub trader: AccountId,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct FundMetadata {
    pub name: Option<String>,
    pub image_url: Option<String>,
}

#[derive(scale::Decode, scale::Encode)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
)]
pub struct FundTrade {
    pub investment_fund_id: InvestmentFundId,
    pub trade_id: TradeId,
    pub proponent: AccountId,
    pub proposed_person: Option<AccountId>,
    pub share: Share,
    pub fund: Balance,
    pub close_time: Timestamp,
}