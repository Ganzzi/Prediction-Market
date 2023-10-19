#![cfg_attr(not(feature = "std"), no_std, no_main)]
mod types;
use crate::types::*;
use ink::primitives::AccountId;

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
    use crate::types::*;
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    #[ink(storage)]
    #[derive(Default)]
    pub struct PredictionMarket {
        pub events: Mapping<EventId, Event>,
        pub event_markets: Mapping<EventId, EventMarket>,
        pub outcomes: Mapping<OutComeId, OutCome>,
        pub market_outcomes: Mapping<OutComeId, MarketOutCome>,
        pub investment_funds: Mapping<InvestmentFundId, InvestmentFund>,
        pub fund_trades: Mapping<TradeId, FundTrade>,

        pub outcome_fund_to_supplies: Mapping<(OutComeId, InvestmentFundId), Supply>,
        pub fund_owner_to_shares: Mapping<(InvestmentFundId, AccountId), Share>,

        pub next_fund_id: InvestmentFundId,
        pub next_event_id: EventId,
        pub next_outcome_id: OutComeId,
        pub next_trade_id: TradeId,
    }

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
    }

    impl PredictionMarket {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn default() -> Self {
            Default::default()
        }

        #[ink(message, payable)]
        pub fn create_event(
            &mut self,
            name: String,
            resolve_date: Timestamp,
            total_supply: Supply,
            bets: Option<Vec<OutComePayload>>,
        ) -> Result<EventId, Error> {
            let creation_deposit = self.env().transferred_value();
            if creation_deposit < MIN_EVENT_DEPOSIT {
                return Err(Error::DepositTooLow);
            }

            let new_event = self.new_event(
                self.env().caller(),
                name,
                resolve_date,
                total_supply,
                bets,
                creation_deposit,
            )?;
            let new_market = self.new_market(new_event.event_id, &new_event.bets, creation_deposit);

            self.events.insert(new_event.event_id, &new_event);
            self.event_markets.insert(new_event.event_id, &new_market);

            Ok(new_event.event_id)
        }

        #[ink(message)]
        pub fn create_outcome(
            &mut self,
            event_id: EventId,
            payload: OutComePayload,
        ) -> Result<OutComeId, Error> {
            match self.events.get(event_id) {
                Some(mut event) => {
                    if self.env().caller() != event.owner {
                        return Err(Error::NotOwner);
                    }

                    let mut event_supply = event.total_supply as i64;
                    for oid in &event.bets {
                        let supply_each_existing_outcome =
                            self.outcomes.get(!oid).unwrap().total_supply as i64;
                        event_supply -= supply_each_existing_outcome;
                    }

                    if event_supply < 0 {
                        return Err(Error::TooMuchOutcomeSupply);
                    }

                    let outcome = self.new_outcome(event_id, payload);
                    let market_outcome =
                        self.new_market_outcome(event_id, outcome.outcome_id, outcome.total_supply);
                    let mut market = self.event_markets.get(event_id).unwrap();
                    market.outcomes.push(outcome.outcome_id);
                    event.bets.push(outcome.outcome_id);

                    self.outcomes.insert(outcome.outcome_id, &outcome);
                    self.market_outcomes
                        .insert(outcome.outcome_id, &market_outcome);
                    self.event_markets.insert(event_id, &market);
                    self.events.insert(event_id, &event);

                    return Ok(outcome.outcome_id);
                }
                None => return Err(Error::EventNotFound),
            }
        }

        #[ink(message)]
        pub fn resolve_event(&mut self, event_id: EventId, winner: OutComeId) -> Result<(), Error> {
            let mut event = self.events.get(event_id).unwrap();
            if self.env().block_timestamp() < event.resolve_date {
                return Err(Error::ResolveDateNotMatch);
            }
            if !event.bets.contains(&winner)
                || self.outcomes.get(winner).unwrap().event_id != event_id
            {
                return Err(Error::WrongEventOutCome);
            }
            event.winning_outcome = Some(winner);

            let mut market = self.event_markets.get(event_id).unwrap();
            market.is_resolved = true;

            self.events.insert(event_id, &event);
            self.event_markets.insert(event_id, &market);

            Ok(())
        }

        #[ink(message, payable)]
        pub fn create_fund(
            &mut self,
            total_share: Share,
            metadata: FundMetadata,
        ) -> Result<InvestmentFundId, Error> {
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
        pub fn transfer_share(
            &mut self,
            fund_id: InvestmentFundId,
            recipient: AccountId,
            amount: Share,
        ) -> Result<(AccountId, Share), Error> {
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

        #[ink(message)]
        pub fn bet(
            &mut self,
            outcome_id: OutComeId,
            fund_id: InvestmentFundId,
            supplies: Supply,
        ) -> Result<(), Error> {
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
            self.market_outcomes.insert(outcome_id, &market_outcomes);
            self.outcome_fund_to_supplies
                .insert((outcome_id, fund_id), &supplies);

            Ok(())
        }

        #[ink(message)]
        pub fn create_proposal(&mut self) -> Result<TradeId, Error> {
            Ok(0)
        }

        #[ink(message, payable)]
        pub fn accept_proposal(&mut self) -> Result<(), Error> {
            Ok(())
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
            name: String,
            resolve_date: Timestamp,
            total_supply: Supply,
            bets: Option<Vec<OutComePayload>>,
            creation_deposit: Balance,
        ) -> Result<Event, Error> {
            let mut event_bets: Vec<OutComeId> = Vec::new();
            let event_id = self.next_event_id;
            self.next_event_id += 1;

            match bets {
                Some(outcome) => {
                    let mut available_event_supply = total_supply as i64;
                    for oc in outcome.into_iter() {
                        available_event_supply -= oc.total_supply as i64;

                        if available_event_supply < 0 {
                            return Err(Error::TooMuchOutcomeSupply);
                        }
                        let new_outcome = self.new_outcome(event_id, oc);
                        event_bets.push(new_outcome.outcome_id);
                        self.outcomes.insert(new_outcome.outcome_id, &new_outcome);
                    }
                }
                None => (),
            }
            let new_event = Event {
                event_id,
                owner,
                name,
                resolve_date,
                total_supply,
                bets: event_bets,
                creation_deposit,
                winning_outcome: None,
            };

            Ok(new_event)
        }

        fn new_market(
            &mut self,
            event_id: EventId,
            bets: &Vec<OutComeId>,
            deposit: Balance,
        ) -> EventMarket {
            let mut event_bets: Vec<OutComeId> = Vec::new();

            for outcome_id in bets.into_iter() {
                let market_outcome = self.new_market_outcome(
                    event_id,
                    !outcome_id,
                    self.outcomes.get(outcome_id).unwrap().total_supply,
                );

                event_bets.push(market_outcome.outcome_id);
                self.market_outcomes.insert(outcome_id, &market_outcome);
            }

            let new_market = EventMarket {
                event_id,
                pool: deposit,
                is_resolved: false,
                outcomes: event_bets,
            };

            new_market
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
