import Link from 'next/link'
import 'twin.macro'

const Bar = () => {
  return (
    <div tw="my-5 flex w-full flex-row items-center justify-between px-20">
      <p tw="text-3xl">Market</p>
      <Link tw="mx-2 rounded-3xl bg-blue-400 px-5 py-2 hover:bg-blue-600" href={'/market/create'}>
        Create
      </Link>
    </div>
  )
}

export default Bar
