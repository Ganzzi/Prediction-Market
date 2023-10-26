import FundGrid from '@/components/fund/FundGrid'
import { CenterBody } from '@/components/layout/CenterBody'
import Link from 'next/link'
import 'twin.macro'

const FundPage = () => {
  return (
    <CenterBody>
      <div tw="my-5 flex w-full flex-row items-center justify-between px-20">
        <p tw="text-2xl text-black">Investment Funds</p>
        <Link tw="mx-2 rounded-3xl bg-blue-400 px-5 py-2 hover:bg-blue-600" href={'/fund/create'}>
          Create
        </Link>
      </div>
      <FundGrid></FundGrid>
    </CenterBody>
  )
}

export default FundPage
