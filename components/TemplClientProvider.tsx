import createContext from '../utils/createContext'
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { Registry, Secp256k1HdWallet } from 'cosmwasm'
import { AminoTypes, Coin, GasPrice, SigningStargateClient } from '@cosmjs/stargate'
import { useLocalStorage } from 'usehooks-ts'
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import { MsgExec, MsgGrant, MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { createAuthzAminoConverters } from '../utils/amino/authz'
import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx'
import { createFeegrantAminoConverters } from '../utils/amino/feegrant'
import { TRANSACTION_TYPE_ENUM } from '../utils/transactionTypes'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'

interface Return {
  tempSigningClient: SigningStargateClient | undefined
  tempAddress: string | undefined
  tempBalance: Coin | undefined
}
const [useTempClient, _TempClientProvider] = createContext<Return>('')

export const AMINO_TYPES = new AminoTypes(
  {...createAuthzAminoConverters(), ...createFeegrantAminoConverters()},
)

export const REGISTRY = new Registry([
  ['/cosmos.authz.v1beta1.GenericAuthorization', GenericAuthorization],
  ['/cosmos.authz.v1beta1.MsgGrant', MsgGrant],
  ['/cosmos.authz.v1beta1.MsgRevoke', MsgRevoke],
  [TRANSACTION_TYPE_ENUM.MsgGrantAllowance, MsgGrantAllowance],
  [TRANSACTION_TYPE_ENUM.AuthZMsgExec, MsgExec],
  [TRANSACTION_TYPE_ENUM.Send, MsgSend]
])

const TempClientProvider: FC<PropsWithChildren> = ({ children }) => {
  const [tempSigningClient, setTempSigningClient] = useState<SigningStargateClient>()
  const [tempAddress, setTempAddress] = useState<string>()
  const [tempBalance, setTempBalance] = useState<Coin>()
  const [localMnemonic, setLocalMnemonic] = useLocalStorage('mnemonic', '')



  useEffect(() => {
    ;(async function init() {
      if (!tempSigningClient) {

        let tempWallet
        if (localMnemonic) {
          tempWallet = await Secp256k1HdWallet.fromMnemonic(localMnemonic, { prefix: 'juno'})
        } else {
          tempWallet = await Secp256k1HdWallet.generate(12, { prefix: 'juno'})
          setLocalMnemonic(await tempWallet.mnemonic)
        }


        const tempSigningClient = await SigningStargateClient.connectWithSigner('https://rpc.testcosmos.directory/junotestnet', tempWallet, {
          gasPrice: GasPrice.fromString('0.0025ujuno'),
          // @ts-ignore
          registry: REGISTRY,
          aminoTypes: AMINO_TYPES
        })

        let accounts = await tempWallet.getAccounts()
        setTempAddress(accounts[0].address)

        setTempSigningClient(tempSigningClient)

        setTempBalance(await tempSigningClient.getBalance(accounts[0].address, 'ujunox'))
      }
    })()
  }, [localMnemonic, setLocalMnemonic, tempSigningClient])

  const contextValue = useMemo<Return>(
    () => ({
      tempSigningClient,
      tempAddress,
      tempBalance
    }),
    [tempAddress, tempBalance, tempSigningClient]
  )

  return <_TempClientProvider value={contextValue}>{children}</_TempClientProvider>
}

export default useTempClient
export { TempClientProvider }
