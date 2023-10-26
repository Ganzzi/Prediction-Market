import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ConnectButton } from '../web3/ConnectButton'
import 'twin.macro'

const Header = () => {
  return (
    <div tw="flex flex-row items-center justify-between bg-black px-5 py-2 text-white">
      <Link href={'/'}>Home</Link>
      <Link href={'/market'}>Market</Link>
      <Link href={'/fund'}>Fund</Link>

      <ConnectButton />
    </div>
  )
}

export default Header
