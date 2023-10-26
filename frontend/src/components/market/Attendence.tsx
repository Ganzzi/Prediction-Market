import { OutComeData } from '@/types'
import { fromDecimal, shorttenAddress } from '@/utils'
import Router from 'next/router'
import 'twin.macro'

type Props = {
  data: OutComeData
}

const Attendence = ({ data }: Props) => {
  return (
    <div tw="mt-10 flex w-full flex-col items-center justify-start">
      <div tw="flex w-full flex-row flex-wrap justify-between">
        {data?.map(([outcome, marketOutcome, investmentFunds], index) => (
          <div key={index} tw="m-2 flex flex-1 flex-col items-center justify-start py-2 px-5">
            <div tw="w-full rounded-3xl bg-green-300 py-2 text-center">
              <p>{outcome.description}</p>
            </div>
            {investmentFunds?.map((fund, index) => (
              <div
                key={index}
                tw="my-1 flex w-full flex-row justify-between space-x-10 rounded-2xl bg-blue-200 p-3 hover:bg-blue-400"
                onClick={() =>
                  Router.push({
                    pathname: `/fund`,
                    query: {
                      fundId: fund[0].investmentFundId,
                    },
                  })
                }
              >
                <div tw="">
                  <p tw="text-2xl">{fund[0].metadata?.name}</p>
                  <p tw="text-gray-700">Trader @{shorttenAddress(fund[0].trader, 10, 10)}</p>
                </div>
                <div tw="flex flex-col items-end justify-start">
                  <p>{fund[0].totalShare} share</p>
                  <p>{fromDecimal(fund[0].totalFund, 12)} TZERO</p>
                </div>
              </div>
            ))}

            {investmentFunds.length == 0 && <p>No Attendence</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Attendence
