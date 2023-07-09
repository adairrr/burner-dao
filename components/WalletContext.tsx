import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { GasPrice, SigningStargateClient } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { chainName } from '../config'
import { AMINO_TYPES, JUNO_GAS_PRICE, REGISTRY } from './BurnerClientProvider'
import { ExtendedHttpEndpoint } from '@cosmos-kit/core/types/types/manager'
import createContext from '../utils/createContext'

interface WalletReturn {
  signingClient: SigningStargateClient | undefined
  address: string | undefined
  isWalletConnected: boolean
  connect: () => Promise<void>
  rpcEndpoint: string | ExtendedHttpEndpoint | undefined
}
const [useWallet, _WalletProvider] = createContext<WalletReturn>('')

const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  const {
    isWalletConnected,
    connect,
    address,
    getOfflineSignerDirect: getOfflineSigner,
    getRpcEndpoint,
  } = useChain(chainName)

  const [signingClient, setSigningClient] = useState<SigningStargateClient>()
  const [rpcEndpoint, setRpcEndpoint] = useState<string | ExtendedHttpEndpoint>()

  useEffect(() => {
    ;(async function init() {
      if (signingClient) return

      const offlineSigner = await getOfflineSigner()

      const endpoint = await getRpcEndpoint()
      setRpcEndpoint(endpoint)
      setSigningClient(await SigningStargateClient.connectWithSigner(
        endpoint,
        offlineSigner,
        {
          // @ts-ignore
          registry: REGISTRY,
          aminoTypes: AMINO_TYPES,
          gasPrice: JUNO_GAS_PRICE
        },
      ))

    })()
  }, [getOfflineSigner, getRpcEndpoint, signingClient])

  const contextValue = useMemo<WalletReturn>(
    () => ({
      signingClient,
      address,
      connect,
      isWalletConnected,
      rpcEndpoint
    }),
    [address, connect, isWalletConnected, signingClient]
  )

  return <_WalletProvider value={contextValue}>{children}</_WalletProvider>
}

export default useWallet
export { WalletProvider }
