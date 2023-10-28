import { FundData } from '@/types'
import { fromDecimal, shorttenAddress } from '@/utils'
import Router from 'next/router'
import React from 'react'
import 'twin.macro'

type Props = {
  fundData: FundData
}

const FundCard: React.FC<Props> = ({ fundData }) => {
  const fund = fundData[0]
  const outcomes = fundData[1]

  return (
    <div tw={'flex-1 basis-1/3 p-3 hover:p-1'}>
      <div
        tw="flex h-52 flex-col rounded-2xl bg-blue-200 p-3 hover:bg-green-400"
        onClick={() =>
          Router.push({
            pathname: `/fund`,
            query: {
              fundId: fund.investmentFundId,
            },
          })
        }
      >
        <div tw="flex flex-row items-center justify-start">
          {fund.metadata.imageUrl ? (
            <div tw="flex h-20 w-20 items-center justify-center">
              <img
                src={`https://amethyst-disabled-tyrannosaurus-478.mypinata.cloud/ipfs/${fund.metadata.imageUrl}`}
                alt=""
                width={50}
                height={50}
                style={{
                  borderRadius: 50,
                }}
              />
            </div>
          ) : (
            <img
              src={`https://amethyst-disabled-tyrannosaurus-478.mypinata.cloud/ipfs/QmasJCYX7QC39kWzFwyAqpWARhMUbNdK8k9HZAkVoKQTKP`}
              alt=""
              style={{
                width: 50,
                height: 50,
                borderRadius: 50,
              }}
            />
          )}
          <div>
            <p tw="text-2xl">{fund.metadata.name}</p>
          </div>
        </div>
        <div>
          <p>trader: @{shorttenAddress(fund.trader, 12, 10)}</p>
          <p>{fund.totalShare} shares</p>
          <p>{fromDecimal(fund.totalFund, 12)} TZERO in pool</p>
        </div>
        <div>
          <p>betted {outcomes.length} times!</p>
        </div>
      </div>
    </div>
  )
}

export default FundCard
