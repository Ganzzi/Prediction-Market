import { CenterBody } from '@/components/layout/CenterBody'
import CreateForm from '@/components/market/CreateForm'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <CenterBody tw="px-5">
        <div tw="mt-6 flex w-full flex-row items-center justify-start space-x-3 px-20 text-3xl">
          <Link href={'/market'} tw="text-blue-700 hover:text-purple-700">
            Market
          </Link>
          <p>{' > '}</p> <p>Create</p>
        </div>
        <CreateForm />
      </CenterBody>
    </>
  )
}

export default HomePage
