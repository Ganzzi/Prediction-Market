import { env } from '@/config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'
/**
 * Add or change your custom contract ids here
 * DOCS: https://github.com/scio-labs/inkathon#2-custom-contracts
 */

export enum ContractIds {
  prediction_market = 'prediction_market',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments: SubstrateDeployment[] = []

  for (const networkId of networks) {
    for (const contractId of Object.values(ContractIds)) {
      const abi = await import(`./prediction_market/prediction_market.json`)
      const { address } = await import(`./prediction_market/development`)

      deployments.push({ contractId, networkId, abi, address })
    }
  }

  return deployments
}
