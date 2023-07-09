import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { defaultTheme, ChainProvider } from '@cosmos-kit/react';
import { ChakraProvider } from '@chakra-ui/react';
import { wallets as keplrWallets } from '@cosmos-kit/keplr';
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation';
import { wallets as leapWallets } from '@cosmos-kit/leap';

import { SignerOptions } from '@cosmos-kit/core';
import { chains, assets } from 'chain-registry';
import { BurnerClientProvider } from '../components/BurnerClientProvider'
import { GasPrice } from '@cosmjs/stargate'
import { WalletProvider } from '../components/WalletContext'

function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const signerOptions: SignerOptions = {
    // @ts-ignore
    signingCosmwasm: ({ chain_name }) => {
      let gasTokenName: string | undefined
      switch (chain_name) {
        case 'localjuno':
        case 'junotestnet':
          gasTokenName = 'ujunox'
          break
        case 'juno':
          gasTokenName = 'ujuno'
          break
        case 'harpoon':
        case 'kujiratestnet':
          gasTokenName = 'ukuji'
          break
        case 'neutron':
        case 'neutrontestnet':
          gasTokenName = 'untrn'
          break
        case 'archwaytestnet':
          gasTokenName = 'uconst'
          break
        case 'terra':
        case 'terratestnet':
        case 'terra2':
        case 'terra2testnet':
          gasTokenName = 'uluna'
          return { gasPrice: GasPrice.fromString(`0.025${gasTokenName}`) }
        case 'archway':
          gasTokenName = 'uarch'
          break
      }
      // @ts-ignore messed up dependencies
      return gasTokenName ? { gasPrice: GasPrice.fromString(`0.0025${gasTokenName}`) } : undefined
    },
    signingStargate: ({ chain_name }) => {
      let gasTokenName: string | undefined
      switch (chain_name) {
        case 'localjuno':
        case 'junotestnet':
          gasTokenName = 'ujunox'
          break
        case 'juno':
          gasTokenName = 'ujuno'
          break
        case 'harpoon':
        case 'kujiratestnet':
          gasTokenName = 'ukuji'
          break
        case 'neutron':
        case 'neutrontestnet':
          gasTokenName = 'untrn'
          break
        case 'archwaytestnet':
          gasTokenName = 'uconst'
          break
        case 'terra':
        case 'terratestnet':
        case 'terra2':
        case 'terra2testnet':
          gasTokenName = 'uluna'
          return { gasPrice: GasPrice.fromString(`0.025${gasTokenName}`) }
        case 'archway':
          gasTokenName = 'uarch'
          break
      }
      // @ts-ignore messed up dependencies
      return gasTokenName ? { gasPrice: GasPrice.fromString(`0.0025${gasTokenName}`) } : undefined
    }
    // signingStargate: (_chain: Chain) => {
    //   return getSigningCosmosClientOptions();
    // }
  };

  return (
    <ChakraProvider theme={defaultTheme}>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={[...keplrWallets]}
        walletConnectOptions={{
          signClient: {
            projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
            relayUrl: 'wss://relay.walletconnect.org',
            metadata: {
              name: 'CosmosKit Template',
              description: 'CosmosKit dapp template',
              url: 'https://docs.cosmoskit.com/',
              icons: [],
            },
          },
        }}
        wrappedWithChakra={true}
        signerOptions={signerOptions}
      >
        <WalletProvider>
        <BurnerClientProvider>
          <Component {...pageProps} />
        </BurnerClientProvider>
        </WalletProvider>
      </ChainProvider>
    </ChakraProvider>
  );
}

export default CreateCosmosApp;
