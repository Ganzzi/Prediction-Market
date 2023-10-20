#![cfg_attr(not(feature = "std"), no_std, no_main)]
mod types;
use crate::types::*;
use ink::prelude::string::String;
use ink::prelude::vec::Vec;
use ink::primitives::AccountId;
use ink::storage::Mapping;

#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum Error {
    DepositTooLow,
    EventNotFound,
    NotOwner,
    ResolveDateNotMatch,
    WrongEventOutCome,
    NotDivisibleBy100,
    NotEnoughShare,
    OutOfSupply,
    TooMuchOutcomeSupply,
    FundNotFound,
}

pub type Result<T> = core::result::Result<T, Error>;

#[ink::trait_definition]
pub trait EventCore {
    #[ink(message, payable)]
    fn create_event(
        &mut self,
        question: String,
        resolve_date: Timestamp,
        total_supply: Supply,
        bets: Option<Vec<OutComePayload>>,
        metadata: EventMetadata,
    ) -> Result<EventId>;

    #[ink(message)]
    fn create_outcome(&mut self, event_id: EventId, payload: OutComePayload) -> Result<OutComeId>;

    #[ink(message)]
    fn resolve_event(&mut self, event_id: EventId, winner: OutComeId) -> Result<()>;

    #[ink(message)]
    fn get_events(&self) -> Result<Vec<(Event, EventMarket)>>;

    #[ink(message)]
    fn get_outcomes(
        &self,
        event_id: EventId,
    ) -> Result<Vec<(OutCome, MarketOutCome, Vec<InvestmentFund>)>>;
}

#[ink::trait_definition]
pub trait FundCore {
    #[ink(message, payable)]
    fn create_fund(
        &mut self,
        total_share: Share,
        metadata: FundMetadata,
    ) -> Result<InvestmentFundId>;

    #[ink(message)]
    fn transfer_share(
        &mut self,
        fund_id: InvestmentFundId,
        recipient: AccountId,
        amount: Share,
    ) -> Result<(AccountId, Share)>;

    #[ink(message, payable)]
    fn bet(
        &mut self,
        outcome_id: OutComeId,
        fund_id: InvestmentFundId,
        supplies: Supply,
    ) -> Result<()>;

    #[ink(message)]
    fn create_proposal(&mut self) -> Result<TradeId>;

    #[ink(message, payable)]
    fn accept_proposal(&mut self) -> Result<()>;

    #[ink(message)]
    fn get_funds(
        &self,
        owner: Option<AccountId>,
    ) -> Result<Vec<(InvestmentFund, Vec<OutCome>, Option<Share>)>>;
}

impl ink::env::Environment for MyEnvironment {
    const MAX_EVENT_TOPICS: usize = 3;
    type AccountId = AccountId;
    type Balance = Balance;
    type Hash = Hash;
    type Timestamp = Timestamp;
    type BlockNumber = BlockNumber;
    type ChainExtension = ink::env::NoChainExtension;
}

#[ink::contract(env = MyEnvironment)]
mod prediction_market {
    use crate::*;

    #[ink(storage)]
    #[derive(Default)]
    pub struct PredictionMarket {
        pub events: Mapping<EventId, Event>,
        pub event_markets: Mapping<EventId, EventMarket>,
        pub outcomes: Mapping<OutComeId, OutCome>,
        pub market_outcomes: Mapping<OutComeId, MarketOutCome>,
        pub investment_funds: Mapping<InvestmentFundId, InvestmentFund>,
        pub fund_trades: Mapping<TradeId, FundTrade>,

        pub event_to_outcomes: Mapping<EventId, Vec<OutComeId>>,
        pub outcome_fund_to_supplies: Mapping<(OutComeId, InvestmentFundId), Supply>,
        pub outcome_to_funds: Mapping<OutComeId, Vec<InvestmentFundId>>,
        pub fund_to_outcomes: Mapping<InvestmentFundId, Vec<OutComeId>>,
        pub fund_owner_to_shares: Mapping<(InvestmentFundId, AccountId), Share>,
        pub fund_to_trades: Mapping<InvestmentFundId, Vec<TradeId>>,
        pub trader_to_trade: Mapping<AccountId, TradeId>,

        pub next_fund_id: InvestmentFundId,
        pub next_event_id: EventId,
        pub next_outcome_id: OutComeId,
        pub next_trade_id: TradeId,
    }

    impl PredictionMarket {
        #[ink(constructor)]
        pub fn default() -> Self {
            Default::default()
        }
    }

    impl super::EventCore for PredictionMarket {
        #[ink(message, payable)]
        fn create_event(
            &mut self,
            question: String,
            resolve_date: Timestamp,
            total_supply: Supply,
            bets: Option<Vec<OutComePayload>>,
            metadata: EventMetadata,
        ) -> Result<EventId> {
            let creation_deposit = self.env().transferred_value();
            if creation_deposit < MIN_EVENT_DEPOSIT {
                return Err(Error::DepositTooLow);
            }

            let new_event =
                self.new_event(self.env().caller(), question, bets, total_supply, metadata)?;

            let new_market = self.new_market(
                new_event.0.event_id,
                creation_deposit,
                resolve_date,
                total_supply,
            )?;

            self.event_to_outcomes
                .insert(new_event.0.event_id, &new_event.1);
            self.events.insert(new_event.0.event_id, &new_event.0);
            self.event_markets.insert(new_event.0.event_id, &new_market);

            Ok(new_event.0.event_id)
        }

        #[ink(message)]
        fn create_outcome(
            &mut self,
            event_id: EventId,
            payload: OutComePayload,
        ) -> Result<OutComeId> {
            let market = self.event_markets.get(event_id).unwrap();
            let event = self.events.get(event_id).unwrap();
            let mut event_outcomes = self.event_to_outcomes.get(event_id).unwrap_or_default();

            if self.env().caller() != event.owner {
                return Err(Error::NotOwner);
            }

            let mut event_supplies = market.total_supply as i64;
            for oid in &event_outcomes {
                let supply_each_existing_outcome =
                    self.outcomes.get(!oid).unwrap().total_supply as i64;
                event_supplies -= supply_each_existing_outcome;
            }

            if event_supplies < 0 {
                return Err(Error::TooMuchOutcomeSupply);
            }

            let outcome = self.new_outcome(event_id, payload);
            let m_outcome =
                self.new_market_outcome(event_id, outcome.outcome_id, outcome.total_supply);
            event_outcomes.push(outcome.outcome_id);

            self.outcomes.insert(outcome.outcome_id, &outcome);
            self.market_outcomes.insert(outcome.outcome_id, &m_outcome);
            self.event_to_outcomes.insert(event_id, &event_outcomes);

            return Ok(outcome.outcome_id);
        }

        #[ink(message)]
        fn resolve_event(&mut self, event_id: EventId, winner: OutComeId) -> Result<()> {
            let mut event = self.event_markets.get(event_id).unwrap();
            if self.env().block_timestamp() < event.resolve_date {
                return Err(Error::ResolveDateNotMatch);
            }
            if !self
                .event_to_outcomes
                .get(event_id)
                .unwrap_or_default()
                .contains(&winner)
                || self.outcomes.get(winner).unwrap().event_id != event_id
            {
                return Err(Error::WrongEventOutCome);
            }
            event.winning_outcome = Some(winner);

            let mut market = self.event_markets.get(event_id).unwrap();
            market.is_resolved = true;

            self.event_markets.insert(event_id, &market);

            Ok(())
        }

        #[ink(message)]
        fn get_events(&self) -> Result<Vec<(Event, EventMarket)>> {
            let mut events = Vec::new();
            for i in 0..self.next_event_id {
                events.push(self.get_event_by_id(i)?)
            }
            Ok(events)
        }

        #[ink(message)]
        fn get_outcomes(
            &self,
            event_id: EventId,
        ) -> Result<Vec<(OutCome, MarketOutCome, Vec<InvestmentFund>)>> {
            let event_outcome_ids = self.event_to_outcomes.get(event_id).unwrap_or_default();
            let mut rs = Vec::new();

            for i in event_outcome_ids {
                let outcome = self.get_outcome_by_id(i)?;
                let outcome_funds = self.get_outcome_funds(i)?;

                rs.push((outcome.0, outcome.1, outcome_funds));
            }

            Ok(rs)
        }
    }

    impl super::FundCore for PredictionMarket {
        #[ink(message, payable)]
        fn create_fund(
            &mut self,
            total_share: Share,
            metadata: FundMetadata,
        ) -> Result<InvestmentFundId> {
            let trader = self.env().caller();
            let total_fund = self.env().transferred_value();

            if total_share < MIN_FUND_SHARE {
                return Err(Error::NotDivisibleBy100);
            }
            if total_fund < MIN_FUND_DEPOSIT {
                return Err(Error::DepositTooLow);
            }

            let new_fund = self.new_fund(trader, total_share, total_fund, metadata);
            self.investment_funds
                .insert(new_fund.investment_fund_id, &new_fund);
            self.fund_owner_to_shares
                .insert((new_fund.investment_fund_id, trader), &(total_share));

            Ok(new_fund.investment_fund_id)
        }

        #[ink(message)]
        fn transfer_share(
            &mut self,
            fund_id: InvestmentFundId,
            recipient: AccountId,
            amount: Share,
        ) -> Result<(AccountId, Share)> {
            let sender = self.env().caller();
            let share_of_sender = self
                .fund_owner_to_shares
                .get((fund_id, sender))
                .unwrap_or(0);
            let share_of_recipient = self
                .fund_owner_to_shares
                .get((fund_id, recipient))
                .unwrap_or(0);

            if amount < share_of_sender {
                return Err(Error::NotEnoughShare);
            }

            self.fund_owner_to_shares
                .insert((fund_id, sender), &(share_of_sender - amount));
            self.fund_owner_to_shares
                .insert((fund_id, sender), &(share_of_recipient + amount));

            Ok((recipient, share_of_recipient + amount))
        }

        #[ink(message, payable)]
        fn bet(
            &mut self,
            outcome_id: OutComeId,
            fund_id: InvestmentFundId,
            supplies: Supply,
        ) -> Result<()> {
            if self.investment_funds.get(fund_id).unwrap().trader != self.env().caller() {
                return Err(Error::NotOwner);
            }

            let outcome = self.outcomes.get(outcome_id).unwrap();
            let mut market_outcomes = self.market_outcomes.get(outcome_id).unwrap();

            if (market_outcomes.available_supply as i64 - supplies as i64) < 0 {
                return Err(Error::OutOfSupply);
            }
            if self.env().transferred_value() < (supplies as Balance * outcome.deposit_per_supply) {
                return Err(Error::DepositTooLow);
            }
            market_outcomes.available_supply -= supplies;

            let mut funds_of_outcome = self.outcome_to_funds.get(outcome_id).unwrap_or(Vec::new());
            let mut outcomes_of_fund = self.fund_to_outcomes.get(fund_id).unwrap_or(Vec::new());
            funds_of_outcome.push(fund_id);
            outcomes_of_fund.push(outcome_id);

            self.market_outcomes.insert(outcome_id, &market_outcomes);
            self.outcome_fund_to_supplies
                .insert((outcome_id, fund_id), &supplies);
            self.outcome_to_funds.insert(outcome_id, &funds_of_outcome);
            self.fund_to_outcomes.insert(fund_id, &outcomes_of_fund);

            Ok(())
        }

        #[ink(message)]
        fn create_proposal(&mut self) -> Result<TradeId> {
            Ok(0)
        }

        #[ink(message, payable)]
        fn accept_proposal(&mut self) -> Result<()> {
            Ok(())
        }

        #[ink(message)]
        fn get_funds(
            &self,
            owner: Option<AccountId>,
        ) -> Result<Vec<(InvestmentFund, Vec<OutCome>, Option<Share>)>> {
            let mut rs = Vec::new();

            for i in 0..self.next_fund_id {
                let fund = self.get_fund_by_id(i)?;
                let fund_outcomes = self.get_fund_outcomes(i)?;
                match owner {
                    Some(owner) => {
                        if owner == fund.trader {
                            let trader_share = self
                                .fund_owner_to_shares
                                .get((fund.investment_fund_id, owner))
                                .unwrap_or_default();

                            rs.push((fund, fund_outcomes, Some(trader_share)));
                        } else {
                            let owner_share = self
                                .fund_owner_to_shares
                                .get((fund.investment_fund_id, owner))
                                .unwrap_or_default();

                            if owner_share != 0 {
                                rs.push((fund, fund_outcomes, Some(owner_share)));
                            }
                        }
                    }
                    None => rs.push((fund, fund_outcomes, None)),
                }
            }

            Ok(rs)
        }
    }

    #[ink(impl)]
    impl PredictionMarket {
        fn get_event_by_id(&self, event_id: EventId) -> Result<(Event, EventMarket)> {
            let event = self.events.get(event_id);
            let event_markets = self.event_markets.get(event_id);
            if event.is_none() || event_markets.is_none() {
                return Err(Error::EventNotFound);
            }
            Ok((event.unwrap(), event_markets.unwrap()))
        }

        fn get_outcome_by_id(&self, outcome_id: OutComeId) -> Result<(OutCome, MarketOutCome)> {
            let outcome = self.outcomes.get(outcome_id);
            let market_outcome = self.market_outcomes.get(outcome_id);
            if outcome.is_none() || market_outcome.is_none() {
                return Err(Error::WrongEventOutCome);
            }
            Ok((outcome.unwrap(), market_outcome.unwrap()))
        }

        fn get_fund_by_id(&self, fund_id: InvestmentFundId) -> Result<InvestmentFund> {
            let fund = self.investment_funds.get(fund_id);
            if fund.is_none() {
                return Err(Error::FundNotFound);
            }
            Ok(fund.unwrap())
        }

        fn get_outcome_funds(&self, outcome_id: OutComeId) -> Result<Vec<InvestmentFund>> {
            let mut rs = Vec::new();
            for i in self.outcome_to_funds.get(outcome_id).unwrap_or(Vec::new()) {
                rs.push(self.investment_funds.get(i).unwrap());
            }
            Ok(rs)
        }

        fn get_fund_outcomes(&self, fund_id: InvestmentFundId) -> Result<Vec<OutCome>> {
            let mut rs = Vec::new();
            for i in self.fund_to_outcomes.get(fund_id).unwrap_or(Vec::new()) {
                rs.push(self.outcomes.get(i).unwrap());
            }
            Ok(rs)
        }
    }

    #[ink(impl)]
    impl PredictionMarket {
        fn new_outcome(&mut self, event_id: EventId, payload: OutComePayload) -> OutCome {
            let outcome_id = self.next_outcome_id;
            self.next_outcome_id += 1;
            let outcome = OutCome {
                event_id,
                outcome_id,
                description: payload.description,
                deposit_per_supply: payload.deposit_per_supply,
                total_supply: payload.total_supply,
            };
            outcome
        }

        fn new_market_outcome(
            &mut self,
            event_id: EventId,
            outcome_id: OutComeId,
            supply: Supply,
        ) -> MarketOutCome {
            let outcome = MarketOutCome {
                event_id,
                outcome_id,
                available_supply: supply,
            };
            outcome
        }

        fn new_event(
            &mut self,
            owner: AccountId,
            question: String,
            bets: Option<Vec<OutComePayload>>,
            total_supply: Supply,
            metadata: EventMetadata,
        ) -> Result<(Event, Vec<OutComeId>)> {
            let mut event_bets: Vec<OutComeId> = Vec::new();

            let event_id = self.next_event_id;
            self.next_event_id += 1;

            match bets {
                Some(outcome) => {
                    let mut available_event_supply = total_supply as i64;
                    for payload in outcome.into_iter() {
                        available_event_supply -= payload.total_supply as i64;

                        if available_event_supply < 0 {
                            return Err(Error::TooMuchOutcomeSupply);
                        }
                        let new_outcome = self.new_outcome(event_id, payload);
                        event_bets.push(new_outcome.outcome_id);
                        self.outcomes.insert(new_outcome.outcome_id, &new_outcome);
                    }
                    for outcome_id in event_bets.clone().into_iter() {
                        let market_outcome = self.new_market_outcome(
                            event_id,
                            outcome_id,
                            self.outcomes.get(outcome_id).unwrap().total_supply,
                        );
                        self.market_outcomes.insert(outcome_id, &market_outcome);
                    }
                }
                None => (),
            }

            Ok((
                Event {
                    event_id,
                    owner,
                    question,
                    metadata,
                },
                event_bets,
            ))
        }

        fn new_market(
            &mut self,
            event_id: EventId,
            deposit: Balance,
            resolve_date: Timestamp,
            total_supply: Supply,
        ) -> Result<EventMarket> {
            let new_market = EventMarket {
                event_id,
                pool: deposit,
                is_resolved: false,
                resolve_date,
                total_supply,
                winning_outcome: None,
            };

            Ok(new_market)
        }

        fn new_fund(
            &mut self,
            trader: AccountId,
            total_share: Share,
            total_fund: Balance,
            metadata: FundMetadata,
        ) -> InvestmentFund {
            let investment_fund_id = self.next_fund_id;
            self.next_fund_id += 1;

            let new_fund = InvestmentFund {
                investment_fund_id,
                trader,
                total_fund,
                total_share,
                metadata,
            };

            new_fund
        }
    }
}
