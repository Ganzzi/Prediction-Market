import Link from 'next/link'
import styled from 'styled-components'
import 'twin.macro'

type Props = {
  onClose: () => void
}

function Guideline({ onClose }: Props) {
  return (
    <ContainerOverlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <div tw="flex flex-col items-center justify-start">
          <p>Step to participate in prediction market </p>
          <div tw="my-10 flex flex-row items-start justify-between">
            <div tw="flex w-96 flex-col items-center justify-start">
              <p>Step 1</p>
              <div tw="flex flex-col">
                <p>create a polkadot wallet & connect to the site</p>
                <Link
                  tw="my-2 w-fit border-2 border-white border-l-2 border-l-blue-500 px-1 text-blue-700 hover:(border-b-2 border-b-blue-500)"
                  href="https://polkadot.js.org/extension/"
                >
                  PolkadotJs Extension
                </Link>
              </div>
            </div>
            <div tw="flex w-96 flex-col items-center justify-start">
              <p>Step 2</p>
              <div tw="flex flex-col">
                <p>create or buy share from a fund</p>
                <Link
                  tw="my-2 w-fit border-2 border-white border-l-2 border-l-blue-500 px-1 text-blue-700 hover:(border-b-2 border-b-blue-500)"
                  href="/fund/create"
                >
                  Create your fund
                </Link>
                <Link
                  tw="my-2 w-fit border-2 border-white border-l-2 border-l-blue-500 px-1 text-blue-700 hover:(border-b-2 border-b-blue-500)"
                  href="/fund"
                >
                  Be a shareholder
                </Link>
              </div>
            </div>
            <div tw="flex w-96 flex-col items-center justify-start">
              <p>Step 3</p>
              <div tw="flex flex-col">
                <p>create or bet from a market</p>
                <Link
                  tw="my-2 w-fit border-2 border-white border-l-2 border-l-blue-500 px-1 text-blue-700 hover:(border-b-2 border-b-blue-500)"
                  href="/market/create"
                >
                  Create your event & open market
                </Link>
                <Link
                  tw="my-2 w-fit border-2 border-white border-l-2 border-l-blue-500 px-1 text-blue-700 hover:(border-b-2 border-b-blue-500)"
                  href="/market"
                >
                  Start betting!
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </ContainerOverlay>
  )
}

export default Guideline

const ContainerOverlay = styled.div`
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  color: black;
`

const Container = styled.div`
  border: 1px solid #ccc;
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: fit-content;
  margin: 0 auto;
  margin-top: 20px;
`
