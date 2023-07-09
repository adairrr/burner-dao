import createContext from '../utils/createContext'
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { Registry, Secp256k1HdWallet } from 'cosmwasm'
import { AminoTypes, Coin, createBankAminoConverters, GasPrice, SigningStargateClient } from '@cosmjs/stargate'
import { useLocalStorage } from 'usehooks-ts'
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import { MsgExec, MsgGrant, MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { createAuthzAminoConverters } from '../utils/amino/authz'
import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx'
import { createFeegrantAminoConverters } from '../utils/amino/feegrant'
import { TRANSACTION_TYPE_ENUM } from '../utils/transactionTypes'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz'

interface Return {
  tempSigningClient: SigningStargateClient | undefined
  tempAddress: string | undefined
  tempBalance: Coin | undefined
}
const [useTempClient, _TempClientProvider] = createContext<Return>('')

export const AMINO_TYPES = new AminoTypes(
  {...createAuthzAminoConverters(), ...createFeegrantAminoConverters(), ...createBankAminoConverters()},
)

export const REGISTRY = new Registry([
  [TRANSACTION_TYPE_ENUM.GenericAuthorization, GenericAuthorization],
  [TRANSACTION_TYPE_ENUM.SendAuthorization, SendAuthorization],
  ['/cosmos.authz.v1beta1.MsgGrant', MsgGrant],
  ['/cosmos.authz.v1beta1.MsgRevoke', MsgRevoke],
  [TRANSACTION_TYPE_ENUM.MsgGrantAllowance, MsgGrantAllowance],
  [TRANSACTION_TYPE_ENUM.AuthZMsgExec, MsgExec],
  [TRANSACTION_TYPE_ENUM.Send, MsgSend]
])

export const JUNO_GAS_PRICE = GasPrice.fromString('0.0025ujuno')

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
          gasPrice: JUNO_GAS_PRICE,
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
