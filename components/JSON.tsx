import React, { FC } from 'react'
import { Box, Flex } from '@chakra-ui/react'

interface JsonProps {
  data: any
}

export const Json: FC<JsonProps> = ({data}) => {
  const json = JSON.stringify(data, null, 2)

  return (
    <Flex
      as="pre"
    >
      <Box
        as="code"
        whiteSpace="pre-wrap"
      >
        {json}
      </Box>

    </Flex>)
}
