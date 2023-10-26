import Image from 'next/image'
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
          <Image
            src="https://media.licdn.com/dms/image/C5612AQG9TC3l74k-Nw/article-cover_image-shrink_720_1280/0/1549922697604?e=2147483647&v=beta&t=upbKWCdnlnFUUTD6IjzMOqQejHzKUhRS90zynTcloPo"
            alt=""
            tw="w-full"
          />
          <div tw="absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center">
            <button tw="rounded-2xl bg-green-400 px-5 py-2" onClick={() => setShowGuideline(true)}>
              Get Started
            </button>
          </div>
        </div>

        {showGuideline && <Guideline onClose={() => setShowGuideline(false)} />}
      </div>
    </>
  )
}
