import Link from 'next/link'
import 'twin.macro'
import { ConnectButton } from '../web3/ConnectButton'

const Header = () => {
  return (
    <div tw="flex flex-row items-center justify-between bg-black px-5 py-2 text-white">
      <div tw="flex flex-row space-x-8">
        <Link href={'/'}>Home</Link>
        <Link href={'/market'}>Market</Link>
        <Link href={'/fund'}>Fund</Link>
      </div>

      <ConnectButton />
    </div>
  )
}

export default Header
