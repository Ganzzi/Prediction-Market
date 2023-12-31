import { HomePageTitle } from '@/components/home/HomePageTitle'
import { HomeTopBar } from '@/components/home/HomeTopBar'
import { CenterBody } from '@/components/layout/CenterBody'
import Header from '@/components/layout/Header'
import { ChainInfo } from '@/components/web3/ChainInfo'
import { ConnectButton } from '@/components/web3/ConnectButton'
import { GreeterContractInteractions } from '@/components/web3/GreeterContractInteractions'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import 'twin.macro'

const HomePage: NextPage = () => {
  return (
    <>
      <CenterBody>
        {/* Title */}
        <HomePageTitle />
      </CenterBody>
    </>
  )
}

export default HomePage
