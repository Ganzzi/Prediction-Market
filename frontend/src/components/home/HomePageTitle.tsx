import Link from 'next/link'
import { FC, useState } from 'react'
import 'twin.macro'
import tw, { styled } from 'twin.macro'
import Guideline from './Guideline'

const StyledIconLink = styled(Link)(() => [
  tw`opacity-90 transition-all hover:(-translate-y-0.5 opacity-100)`,
])

export const HomePageTitle: FC = () => {
  const [showGuideline, setShowGuideline] = useState<boolean>(false)
  return (
    <>
      <div tw="flex w-full flex-col items-center text-center font-mono">
        <div tw="relative w-full">
          <img
            src="https://plus.unsplash.com/premium_photo-1661421687248-7bb863c60723?auto=format&fit=crop&q=80&w=2138&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
            tw="w-full"
          />
          <div tw="absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center">
            <button
              tw="rounded-2xl bg-green-400 px-5 py-2 hover:bg-green-500"
              onClick={() => setShowGuideline(true)}
            >
              Get Started
            </button>
          </div>
        </div>

        {showGuideline && <Guideline onClose={() => setShowGuideline(false)} />}
      </div>
    </>
  )
}
