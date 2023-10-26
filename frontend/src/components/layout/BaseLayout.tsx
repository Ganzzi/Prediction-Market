import 'twin.macro'
import { FC, PropsWithChildren, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useInkathon } from '@scio-labs/use-inkathon'

import Header from './Header'

export const BaseLayout: FC<PropsWithChildren> = ({ children }) => {
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <div tw="relative flex min-h-full flex-col bg-white text-black">
        <Header />
        <main tw="relative flex grow flex-col">{children}</main>
      </div>
    </>
  )
}
