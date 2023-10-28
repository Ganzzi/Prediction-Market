import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import 'twin.macro'
import { ConnectButton } from '../web3/ConnectButton'

const Header = () => {
  const router = useRouter()
  const [urlPath, setUrlPath] = useState('')

  useEffect(() => {
    setUrlPath(router.pathname.split('/')[1])
  }, [router.pathname])

  return (
    <div tw="flex flex-row items-center justify-between bg-black px-5 py-2 text-white">
      <div tw="flex flex-row space-x-8">
        <Link
          tw="hover:text-red-500"
          href={'/'}
          style={{
            color: `${urlPath == '' ? 'red' : ''}`,
          }}
        >
          Home
        </Link>
        <Link
          tw="hover:text-red-500"
          href={'/market'}
          style={{
            color: `${urlPath == 'market' ? 'red' : ''}`,
          }}
        >
          Market
        </Link>
        <Link
          tw="hover:text-red-500"
          href={'/fund'}
          style={{
            color: `${urlPath == 'fund' ? 'red' : ''}`,
          }}
        >
          Fund
        </Link>
      </div>

      <ConnectButton />
    </div>
  )
}

export default Header
