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
    AtLeastTwoOutcome,
    FundNotFound,
    AtLeast100Share,
    TimeExpired,
    TradeNotAvailable,
    TradeNotFound,
    SomethingWrong,
    NoBodyBetted,
    MoreThanOneSupply,
    NotEnoughBalance,
    TraderNotIdentitied,
}

pub type Result<T> = core::result::Result<T, Error>;

#[ink::trait_definition]
pub trait EventCore {
    #[ink(message, payable)]
    fn create_event(
        &mut self,
        question: String,
        resolve_date: Timestamp,
        bets: Vec<OutComePayload>,
        metadata: EventMetadata,
    ) -> Result<EventId>;

    #[ink(message)]
    fn resolve_event(&mut self, event_id: EventId, winner: OutComeId) -> Result<()>;

    #[ink(message)]
    fn get_events(&self) -> Result<Vec<(Event, EventMarket, Supply)>>;

    #[ink(message)]
    fn get_event_detail(
        &self,
        event_id: EventId,
    ) -> Result<(
        Event,
        EventMarket,
        Supply,
        Vec<(OutCome, MarketOutCome, Vec<(InvestmentFund, Supply)>)>,
    )>;
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
    fn create_proposal(
        &mut self,
        fund_id: InvestmentFundId,
        amount: Share,
        price: Balance,
        duration: Option<Timestamp>,
        proposed_person: Option<AccountId>,
    ) -> Result<TradeId>;

    #[ink(message, payable)]
    fn accept_proposal(&mut self, trade_id: TradeId) -> Result<()>;

    #[ink(message)]
    fn get_funds(
        &self,
        owner: Option<AccountId>,
    ) -> Result<Vec<(InvestmentFund, Vec<(OutCome, Supply)>, Option<Share>)>>;

    #[ink(message)]
    fn get_owner_share(&self, fund_id: InvestmentFundId, owner: AccountId) -> Result<Share>;

    #[ink(message)]
    fn get_proposals(
        &self,
        proponent: Option<AccountId>,
    ) -> Result<Vec<(InvestmentFund, FundTrade)>>;

    #[ink(message)]
    fn get_fund_proposals(
        &self,
        fund_id: InvestmentFundId,
    ) -> Result<(InvestmentFund, Vec<FundTrade>)>;
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
        pub proponent_to_trades: Mapping<AccountId, Vec<TradeId>>,

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
            bets: Vec<OutComePayload>,
            metadata: EventMetadata,
        ) -> Result<EventId> {
            let creation_deposit = self.env().transferred_value();
            if creation_deposit < MIN_EVENT_DEPOSIT {
                return Err(Error::DepositTooLow);
            }

            let new_event = self.new_event(self.env().caller(), question, bets, metadata)?;

            let new_market =
                self.new_market(new_event.0.event_id, creation_deposit, resolve_date)?;

            self.event_to_outcomes
                .insert(new_event.0.event_id, &new_event.1);
            self.events.insert(new_event.0.event_id, &new_event.0);
            self.event_markets.insert(new_event.0.event_id, &new_market);

            Ok(new_event.0.event_id)
        }

        #[ink(message)]
        fn resolve_event(&mut self, event_id: EventId, winner: OutComeId) -> Result<()> {
            let caller = self.env().caller();
            let event = self.get_event_by_id(event_id)?;
            let winning_outcome = self.get_outcome_by_id(winner)?;

            if caller != event.0.owner {
                return Err(Error::NotOwner);
            }
            if self.env().block_timestamp() < event.1.resolve_date || event.1.is_resolved {
                return Err(Error::ResolveDateNotMatch);
            }
            if winning_outcome.0.event_id != event_id {
                return Err(Error::WrongEventOutCome);
            }

            let mut updated_market = event.1;
            let used_supply = winning_outcome.0.total_supply - winning_outcome.1.available_supply;
            if used_supply == 0 {
                return Err(Error::NoBodyBetted);
            }
            let prize_per_supply = updated_market.pool / (used_supply as Balance);

            let winning_funds = self.get_outcome_funds(winner)?;
            let mut updated_funds = Vec::new();

            for mut fund in winning_funds {
                let supply_holding = fund.1;
                if supply_holding == 0 {
                    return Err(Error::SomethingWrong);
                }

                let prize = supply_holding as Balance * prize_per_supply;

                updated_market.pool -= prize;
                fund.0.total_fund += prize;

                updated_funds.push(fund.0);
            }

            updated_market.winning_outcome = Some(winner);
            updated_market.is_resolved = true;

            self.event_markets.insert(event_id, &updated_market);
            for fund in updated_funds {
                self.investment_funds.insert(fund.investment_fund_id, &fund);
            }

            Ok(())
        }

        #[ink(message)]
        fn get_events(&self) -> Result<Vec<(Event, EventMarket, Supply)>> {
            let mut events = Vec::new();
            for i in 0..self.next_event_id {
                events.push(self.get_event_by_id(i)?)
            }
            Ok(events)
        }

        #[ink(message)]
        fn get_event_detail(
            &self,
            event_id: EventId,
        ) -> Result<(
            Event,
            EventMarket,
            Supply,
            Vec<(OutCome, MarketOutCome, Vec<(InvestmentFund, Supply)>)>,
        )> {
            let event = self.get_event_by_id(event_id)?;
            let event_outcome_ids = self.event_to_outcomes.get(event_id).unwrap_or_default();
            let mut rs = Vec::new();

            for i in event_outcome_ids {
                let outcome = self.get_outcome_by_id(i)?;
                let outcome_funds = self.get_outcome_funds(i)?;

                rs.push((outcome.0, outcome.1, outcome_funds));
            }

            Ok((event.0, event.1, event.2, rs))
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

            if total_share < 100 {
                return Err(Error::AtLeast100Share);
            }

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
            let mut fund = self.get_fund_by_id(fund_id)?;

            if amount > share_of_sender {
                return Err(Error::NotEnoughShare);
            }
            if sender == fund.trader {
                if ((amount as i64 * 100) / fund.total_share as i64) >= 51 {
                    fund.trader = recipient;
                } else if (((share_of_sender - amount) * 100 / fund.total_share) < 51)
                    && (((share_of_recipient + amount) * 100 / fund.total_share) < 51)
                {
                    return Err(Error::TraderNotIdentitied);
                }
            }

            self.fund_owner_to_shares
                .insert((fund_id, sender), &(share_of_sender - amount));
            self.fund_owner_to_shares
                .insert((fund_id, recipient), &(share_of_recipient + amount));
            self.investment_funds.insert(fund_id, &fund);
            Ok((recipient, share_of_recipient + amount))
        }

        #[ink(message, payable)]
        fn bet(
            &mut self,
            outcome_id: OutComeId,
            fund_id: InvestmentFundId,
            supplies: Supply,
        ) -> Result<()> {
            let deposit = self.env().transferred_value();
            if self.get_fund_by_id(fund_id)?.trader != self.env().caller() {
                return Err(Error::NotOwner);
            }

            let outcome = self.outcomes.get(outcome_id).unwrap();
            let mut market_outcomes = self.market_outcomes.get(outcome_id).unwrap();

            let mut market = self.get_event_by_id(outcome.event_id)?.1;
            let mut fund = self.get_fund_by_id(fund_id)?;
            if market.is_resolved || self.env().block_timestamp() < market.resolve_date {
                return Err(Error::ResolveDateNotMatch);
            }
            if (market_outcomes.available_supply as i64 - supplies as i64) < 0 {
                return Err(Error::OutOfSupply);
            }
            if supplies <= 0 {
                return Err(Error::MoreThanOneSupply);
            }
            if deposit < (supplies as Balance * outcome.deposit_per_supply) {
                return Err(Error::DepositTooLow);
            }
            if deposit > fund.total_fund {
                return Err(Error::NotEnoughBalance);
            }
            market_outcomes.available_supply -= supplies;

            let mut funds_of_outcome = self.outcome_to_funds.get(outcome_id).unwrap_or(Vec::new());
            let mut outcomes_of_fund = self.fund_to_outcomes.get(fund_id).unwrap_or(Vec::new());
            funds_of_outcome.push(fund_id);
            outcomes_of_fund.push(outcome_id);

            fund.total_fund -= deposit;
            market.pool += deposit;

            self.market_outcomes.insert(outcome_id, &market_outcomes);
            self.outcome_fund_to_supplies
                .insert((outcome_id, fund_id), &supplies);
            self.outcome_to_funds.insert(outcome_id, &funds_of_outcome);
            self.fund_to_outcomes.insert(fund_id, &outcomes_of_fund);
            self.event_markets.insert(outcome.event_id, &market);
            self.investment_funds.insert(fund_id, &fund);

            Ok(())
        }

        #[ink(message)]
        fn create_proposal(
            &mut self,
            fund_id: InvestmentFundId,
            amount: Share,
            price: Balance,
            duration: Option<Timestamp>,
            proposed_person: Option<AccountId>,
        ) -> Result<TradeId> {
            let caller = self.env().caller();
            let _ = self.get_fund_by_id(fund_id)?;

            let caller_share = self
                .fund_owner_to_shares
                .get((fund_id, caller))
                .unwrap_or_default();

            if caller_share < amount {
                return Err(Error::NotEnoughShare);
            }

            let close_time = self.env().block_timestamp() + duration.unwrap_or(DEFAULT_DURATION);

            let new_trade =
                self.new_trade(fund_id, caller, proposed_person, amount, price, close_time);

            let mut fund_trades = self.fund_to_trades.get(fund_id).unwrap_or(Vec::new());
            let mut proponent_trades = self.proponent_to_trades.get(caller).unwrap_or(Vec::new());

            fund_trades.push(new_trade.trade_id);
            proponent_trades.push(new_trade.trade_id);

            self.fund_trades.insert(new_trade.trade_id, &new_trade);
            self.fund_to_trades.insert(fund_id, &fund_trades);
            self.proponent_to_trades.insert(caller, &proponent_trades);

            Ok(new_trade.trade_id)
        }

        #[ink(message, payable)]
        fn accept_proposal(&mut self, trade_id: TradeId) -> Result<()> {
            let caller = self.env().caller();
            let transferred_value = self.env().transferred_value();

            let mut trade = self.get_trade_by_id(trade_id)?;

            if trade.is_completed {
                return Err(Error::TradeNotAvailable);
            }
            if self.env().block_timestamp() > trade.close_time {
                return Err(Error::TimeExpired);
            }
            if trade.proposed_person.is_some() && caller != trade.proposed_person.unwrap() {
                return Err(Error::NotOwner);
            }
            if transferred_value < trade.price {
                return Err(Error::DepositTooLow);
            }

            let proponent_share = self
                .fund_owner_to_shares
                .get((trade.investment_fund_id, trade.proponent))
                .unwrap_or_default();

            if proponent_share < trade.share {
                return Err(Error::NotEnoughShare);
            }

            let caller_share = self
                .fund_owner_to_shares
                .get((trade.investment_fund_id, caller))
                .unwrap_or_default();

            let mut fund = self.get_fund_by_id(trade.investment_fund_id)?;

            if trade.proponent == fund.trader {
                if ((trade.share as i64 * 100) / fund.total_share as i64) >= 51 {
                    fund.trader = caller;
                } else if (((proponent_share - trade.share) * 100 / fund.total_share) < 51)
                    && (((caller_share + trade.share) * 100 / fund.total_share) < 51)
                {
                    return Err(Error::TraderNotIdentitied);
                }
            }

            trade.is_completed = true;

            self.fund_trades.insert(trade_id, &trade);
            self.fund_owner_to_shares.insert(
                (trade.investment_fund_id, trade.proponent),
                &(proponent_share - trade.share),
            );
            self.fund_owner_to_shares.insert(
                (trade.investment_fund_id, caller),
                &(caller_share + trade.share),
            );
            self.investment_funds
                .insert(trade.investment_fund_id, &fund);
            Ok(())
        }

        #[ink(message)]
        fn get_funds(
            &self,
            owner: Option<AccountId>,
        ) -> Result<Vec<(InvestmentFund, Vec<(OutCome, Supply)>, Option<Share>)>> {
            let mut rs = Vec::new();

            for i in 0..self.next_fund_id {
                let fund = self.get_fund_by_id(i)?;
                let fund_outcomes = self.get_fund_outcomes(i)?;
                match owner {
                    Some(owner) => {
                        let owner_share = self
                            .fund_owner_to_shares
                            .get((fund.investment_fund_id, owner))
                            .unwrap_or_default();

                        if owner_share != 0 {
                            rs.push((fund, fund_outcomes, Some(owner_share)));
                        }
                    }
                    None => rs.push((fund, fund_outcomes, None)),
                }
            }

            Ok(rs)
        }

        #[ink(message)]
        fn get_owner_share(&self, fund_id: InvestmentFundId, owner: AccountId) -> Result<Share> {
            let owner_share = self
                .fund_owner_to_shares
                .get((fund_id, owner))
                .unwrap_or_default();

            Ok(owner_share)
        }

        #[ink(message)]
        fn get_proposals(
            &self,
            proponent: Option<AccountId>,
        ) -> Result<Vec<(InvestmentFund, FundTrade)>> {
            let mut rs = Vec::new();
            match proponent {
                Some(id) => {
                    let trade_ids = self.proponent_to_trades.get(id).unwrap_or(Vec::new());

                    for trade_id in trade_ids.into_iter() {
                        let fund = self.investment_funds.get(trade_id).unwrap();
                        let trade = self.get_trade_by_id(trade_id)?;

                        rs.push((fund, trade));
                    }
                }
                None => {
                    for trade_id in 0..self.next_trade_id {
                        let fund = self.investment_funds.get(trade_id).unwrap();
                        let trade = self.get_trade_by_id(trade_id)?;

                        rs.push((fund, trade));
                    }
                }
            }

            Ok(rs)
        }

        #[ink(message)]
        fn get_fund_proposals(
            &self,
            fund_id: InvestmentFundId,
        ) -> Result<(InvestmentFund, Vec<FundTrade>)> {
            let fund = self.get_fund_by_id(fund_id)?;
            let trade_ids = self.fund_to_trades.get(fund_id).unwrap_or(Vec::new());
            let mut trades = Vec::new();

            for trade_id in trade_ids.into_iter() {
                trades.push(self.get_trade_by_id(trade_id)?);
            }

            Ok((fund, trades))
        }
    }

    #[ink(impl)]
    impl PredictionMarket {
        fn get_event_by_id(&self, event_id: EventId) -> Result<(Event, EventMarket, Supply)> {
            let event = self.events.get(event_id);
            let event_markets = self.event_markets.get(event_id);
            if event.is_none() || event_markets.is_none() {
                return Err(Error::EventNotFound);
            }
            let mut total_supply = 0;
            for oid in self
                .event_to_outcomes
                .get(event_id)
                .unwrap_or(Vec::new())
                .into_iter()
            {
                total_supply += self.get_outcome_by_id(oid)?.0.total_supply;
            }
            Ok((event.unwrap(), event_markets.unwrap(), total_supply))
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

        fn get_trade_by_id(&self, trade_id: TradeId) -> Result<FundTrade> {
            let trade = self.fund_trades.get(trade_id);
            if trade.is_none() {
                return Err(Error::TradeNotFound);
            }
            Ok(trade.unwrap())
        }

        fn get_outcome_funds(
            &self,
            outcome_id: OutComeId,
        ) -> Result<Vec<(InvestmentFund, Supply)>> {
            let mut rs = Vec::new();
            for i in self.outcome_to_funds.get(outcome_id).unwrap_or(Vec::new()) {
                rs.push((
                    self.investment_funds.get(i).unwrap(),
                    self.outcome_fund_to_supplies
                        .get((outcome_id, i))
                        .unwrap_or_default(),
                ));
            }
            Ok(rs)
        }

        fn get_fund_outcomes(&self, fund_id: InvestmentFundId) -> Result<Vec<(OutCome, Supply)>> {
            let mut rs = Vec::new();
            for oid in self.fund_to_outcomes.get(fund_id).unwrap_or(Vec::new()) {
                rs.push((
                    self.outcomes.get(oid).unwrap(),
                    self.outcome_fund_to_supplies
                        .get((oid, fund_id))
                        .unwrap_or_default(),
                ));
            }
            Ok(rs)
        }

        fn get_event_outcomes(&self, event_id: EventId) -> Result<Vec<(OutCome, MarketOutCome)>> {
            let mut rs = Vec::new();
            for i in self.event_to_outcomes.get(event_id).unwrap_or(Vec::new()) {
                rs.push(self.get_outcome_by_id(i)?);
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
            bets: Vec<OutComePayload>,
            metadata: EventMetadata,
        ) -> Result<(Event, Vec<OutComeId>)> {
            let mut event_bets: Vec<OutComeId> = Vec::new();

            let event_id = self.next_event_id;
            self.next_event_id += 1;

            if bets.len() < 2 {
                return Err(Error::AtLeastTwoOutcome);
            }

            for payload in bets.into_iter() {
                let outcome_total_supply = payload.total_supply;

                let new_outcome = self.new_outcome(event_id, payload);
                let market_outcome =
                    self.new_market_outcome(event_id, new_outcome.outcome_id, outcome_total_supply);

                event_bets.push(new_outcome.outcome_id);
                self.outcomes.insert(new_outcome.outcome_id, &new_outcome);
                self.market_outcomes
                    .insert(new_outcome.outcome_id, &market_outcome);
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
        ) -> Result<EventMarket> {
            let new_market = EventMarket {
                event_id,
                pool: deposit,
                is_resolved: false,
                resolve_date,
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

        fn new_trade(
            &mut self,
            fund_id: InvestmentFundId,
            proponent: AccountId,
            proposed_person: Option<AccountId>,
            share: Share,
            price: Balance,
            close_time: Timestamp,
        ) -> FundTrade {
            let trade_id = self.next_trade_id;
            self.next_trade_id += 1;

            FundTrade {
                investment_fund_id: fund_id,
                trade_id,
                proponent,
                proposed_person,
                share,
                price,
                close_time,
                is_completed: false,
            }
        }
    }
}
