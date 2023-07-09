import React, { FC, useEffect, useState } from 'react'
import { Button, HStack, Text, VStack } from '@chakra-ui/react'
import useTempClient from './TemplClientProvider'
import { MsgExec, MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { GenericAuthorization, Grant } from 'cosmjs-types/cosmos/authz/v1beta1/authz'
import { Coin, QueryClient, setupAuthzExtension } from '@cosmjs/stargate'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { AuthzExtension } from '@cosmjs/stargate/build/modules/authz/queries'
import { Json } from './JSON'
import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx'
import { BasicAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/feegrant'
import { Timestamp } from 'cosmjs-types/google/protobuf/timestamp'
import { TRANSACTION_TYPE_ENUM } from '../utils/transactionTypes'
import useWallet from './WalletContext'
import { SendAuthorization } from 'cosmjs-types/cosmos/bank/v1beta1/authz'

interface SignButtonProps {

}

/**
 * https://github.com/PinkDiamond1/aurascan/blob/3d2951e8a4d28de4f21d02c7ed10ae5eb0af9859/src/app/core/utils/signing/messages.ts#L243C1-L271C2
 * @param expiration
 * @param spendLimit
 * @param network
 */
export function setBasicAllowance({
                                    expiration,
                                    spendLimit,
                                  }: { expiration?: number, spendLimit: Coin[] }) {
  let timestamp: Timestamp | undefined = undefined

  if (expiration) {
    timestamp = Timestamp.fromPartial({
      seconds: expiration / 1000,
      nanos: 0,
    })
  }

  const allowanceValue: BasicAllowance = {
    spendLimit: spendLimit ?? [],
    expiration: timestamp ? timestamp : undefined,
  }

  const basicAllowance = {
    typeUrl: TRANSACTION_TYPE_ENUM.BasicAllowance,
    value: Uint8Array.from(BasicAllowance.encode(allowanceValue).finish()),
  }

  return basicAllowance
}

const grantedMsg = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward'


export const SignButton: FC<SignButtonProps> = () => {
  const {signingClient, rpcEndpoint, address, isWalletConnected, connect} = useWallet()
  const {tempAddress, tempBalance, tempSigningClient} = useTempClient()
  const [authZQueryClient, setAuthZQueryClient] = useState<QueryClient & AuthzExtension>()
  const [grants, setGrants] = useState<Grant[]>()
  const [granted, setGranted] = useState(false)

// Setup the authz query client to check for the grant
  useEffect(() => {
    (async () => {
      if (!authZQueryClient && rpcEndpoint) {
        const tmClient = await Tendermint34Client.connect(rpcEndpoint)
        const queryClient = QueryClient.withExtensions(tmClient,
          setupAuthzExtension,
        )

        setAuthZQueryClient(queryClient)
      }
    })()
  }, [authZQueryClient, rpcEndpoint])


  useEffect(() => {
    (async () => {
      if (authZQueryClient && address && tempAddress) {
        const {grants} = await
          authZQueryClient.authz.granteeGrants(tempAddress)
        setGrants(grants)
      }
    })()
  }, [address, authZQueryClient, tempAddress])


  const authZCallback = async () => {
    if (!isWalletConnected || !address || !signingClient) {
      throw new Error('Wallet not connected')
    }

    // We create the account by sending some of our balance to the new account
    // THis sets it up on the chain and allows for it to send
    const sendGas = {
      typeUrl: TRANSACTION_TYPE_ENUM.Send,
      value: MsgSend.fromPartial({
        fromAddress: address,
        toAddress: tempAddress,
        amount: [
          {
            denom: 'ujunox',
            amount: '1000',
          }],
      }),
    }


    console.log(signingClient.registry)

    const authorization = {
      typeUrl: TRANSACTION_TYPE_ENUM.GenericAuthorization,
      value: GenericAuthorization.encode(
        GenericAuthorization.fromPartial({
          msg: TRANSACTION_TYPE_ENUM.Send,
        }),
      ).finish(),
    }

    // const authorization = {
    //   typeUrl: "/cosmos.bank.v1beta1.SendAuthorization",
    //   value: SendAuthorization.encode(
    //     SendAuthorization.fromPartial({
    //       spendLimit: [
    //         {
    //           denom: 'ujunox',
    //           amount: '1000',
    //         }
    //       ],
    //     })
    //   ).finish()
    // }

    const msgGrant = {
      typeUrl: TRANSACTION_TYPE_ENUM.AuthZMsgGrant, value: MsgGrant.fromPartial({
        granter: address,
        grantee: tempAddress,
        grant: {
          authorization,
          expiration: {
            seconds: 99999999999
          }
        },
      }),
    }

    const txResult = await signingClient.signAndBroadcast(address, [sendGas, msgGrant], 'auto')
    // trigger a rerender
    setGranted(true)
  }

  return (<>
      <VStack>
        {!isWalletConnected ? <Button onClick={connect}>Wallet Connected</Button> : <></>}
        <Button
          onClick={() => {
            try {
              authZCallback()
            } catch (error) {
              console.log(error)
            }
          }
          }
        >
          Create Temp Wallet
        </Button>
        <HStack>
          <Text>Temp address</Text>
          <Json data={tempAddress}/>
        </HStack>
        <Json data={tempBalance}/>
        <HStack>
          <Text>Grants</Text>
          <Json data={grants}/>
        </HStack>
        <Button
          onClick={() => {
            if (signingClient && address) {
              console.log('signingClient amino Types', signingClient['aminoTypes'])

              signingClient.signAndBroadcast(address!, [
                {
                  typeUrl: '/cosmos.feegrant.v1beta1.MsgGrantAllowance',
                  value: MsgGrantAllowance.fromPartial({
                    granter: address,
                    grantee: tempAddress,
                    allowance: setBasicAllowance({
                      spendLimit: [{denom: 'ujunox', amount: '100'}],
                    }),
                  }),
                }
                ,
              ], {
                amount: [{denom: 'ujunox', amount: '250'}],
                gas: '100000',
              })
            }
          }}
        >FeeGrant</Button>
        <Button
          onClick={async () => {
            if (tempSigningClient && tempAddress) {

              await tempSigningClient.sendTokens(tempAddress, address!, [{denom: 'ujunox', amount: '3'}], {
                amount: [{denom: 'ujunox', amount: '250'}],
                gas: '100000',
              })

              console.log("sent tokens normally")
          }}}
        >Send tokens</Button>
        <Button
          onClick={async () => {
            if (tempSigningClient && tempAddress) {
              console.log('tempSigningClient', tempSigningClient['aminoTypes'])

              /*
              Error: Broadcasting transaction failed with code 4 (codespace: sdk). Log: signature verification failed;
              please verify account number (56517), sequence (0) and chain-id (uni-6): unauthorized
               */

              const { accountNumber, sequence } = await tempSigningClient.getSequence(tempAddress);

              console.log('tempAccount', tempAddress, accountNumber, sequence)

              const authzTx = await tempSigningClient.signAndBroadcast(tempAddress, [
                {
                  typeUrl: TRANSACTION_TYPE_ENUM.AuthZMsgExec,
                  value: MsgExec.fromPartial({
                    grantee: tempAddress,
                    msgs: [
                      // Send some funds from the logged in account to the temp address via authz
                      {
                        typeUrl: TRANSACTION_TYPE_ENUM.Send,
                        value: MsgSend.encode(MsgSend.fromPartial({
                          fromAddress: address,
                          toAddress: tempAddress,
                          amount: [{denom: 'ujunox', amount: '3'}],
                        })).finish(),
                      },
                    ],
                  }),
                }
                ,
              ], {
                amount: [{denom: 'ujunox', amount: '250'}],
                gas: '100000',
              })

              console.log('Completed the authz tx!')
            }
          }}
        >Send as temp</Button>

      </VStack>
    </>
  )
}
