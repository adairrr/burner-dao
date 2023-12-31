import Head from 'next/head'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Spacer,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react'
import { BsFillMoonStarsFill, BsFillSunFill } from 'react-icons/bs'
import { WalletSection } from '../components'
import { SignButton } from '../components/SignButton'

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode();

  // 1. Cerate private key in browser
  return (
    <Flex py={10} w={'full'}>
      <Head>
        <title>Create Cosmos App</title>
        <meta name="description" content="Generated by create cosmos app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex justifyContent="end" mb={4}>
        <Button variant="outline" px={0} onClick={toggleColorMode}>
          <Icon
            as={colorMode === 'light' ? BsFillMoonStarsFill : BsFillSunFill}
          />
        </Button>
      </Flex>
      <Box>
        <Heading
          as="h1"
          fontSize={{ base: '3xl', sm: '4xl', md: '5xl' }}
          fontWeight="extrabold"
          mb={3}
        >
          Create Cosmos App
        </Heading>
        <SignButton />
      </Box>
      <Spacer />
      <WalletSection />
    </Flex>
  );
}
