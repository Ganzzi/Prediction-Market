import CreateForm from '@/components/fund/CreateForm'
import { CenterBody } from '@/components/layout/CenterBody'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
  // Display `useInkathon` error messages (optional)
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <CenterBody tw="px-5">
        <div tw="mt-6 flex w-full flex-row items-center justify-start space-x-3 px-20 text-3xl">
          <Link href={'/fund'} tw="text-blue-700 hover:text-purple-700">
            Investment funds
          </Link>
          <p>{' > '}</p> <p>Create</p>
        </div>
        <CreateForm />
      </CenterBody>
    </>
  )
}

export default HomePage
