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
  burnerSigningClient: SigningStargateClient | undefined
  burnerAddress: string | undefined
  burnerBalance: Coin | undefined
}
const [useBurnerClient, _BurnerClientProvider] = createContext<Return>('')

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

const BurnerClientProvider: FC<PropsWithChildren> = ({ children }) => {
  const [burnerSigningClient, setBurnerSigningClient] = useState<SigningStargateClient>()
  const [burnerAddress, setBurnerAddress] = useState<string>()
  const [burnerBalance, setBurnerBalance] = useState<Coin>()
  const [burnerMnemonic, setBurnerMnemonic] = useLocalStorage('mnemonic', '')


  useEffect(() => {
    ;(async function init() {
      if (!burnerSigningClient) {

        let burnerWallet
        if (burnerMnemonic) {
          burnerWallet = await Secp256k1HdWallet.fromMnemonic(burnerMnemonic, { prefix: 'juno'})
        } else {
          burnerWallet = await Secp256k1HdWallet.generate(12, { prefix: 'juno'})
          setBurnerMnemonic(await burnerWallet.mnemonic)
        }


        const tempSigningClient = await SigningStargateClient.connectWithSigner('https://rpc.testcosmos.directory/junotestnet', burnerWallet, {
          gasPrice: JUNO_GAS_PRICE,
          // @ts-ignore
          registry: REGISTRY,
          aminoTypes: AMINO_TYPES
        })

        let accounts = await burnerWallet.getAccounts()
        setBurnerAddress(accounts[0].address)

        setBurnerSigningClient(tempSigningClient)

        setBurnerBalance(await tempSigningClient.getBalance(accounts[0].address, 'ujunox'))
      }
    })()
  }, [burnerMnemonic, setBurnerMnemonic, burnerSigningClient])

  const contextValue = useMemo<Return>(
    () => ({
      burnerSigningClient: burnerSigningClient,
      burnerAddress: burnerAddress,
      burnerBalance: burnerBalance
    }),
    [burnerAddress, burnerBalance, burnerSigningClient]
  )

  return <_BurnerClientProvider value={contextValue}>{children}</_BurnerClientProvider>
}
export {
  useBurnerClient,
  BurnerClientProvider
}
