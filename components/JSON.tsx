import React, { FC } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { fromBase64, fromUtf8 } from 'cosmwasm'

interface JsonProps {
  data: any
}

export const binaryToJson = (binary: string): string => fromUtf8(fromBase64(binary))

/**
 * replace the base64 messages in the response (currently hardcoded but maybe we could detect?)
 */
export const base64MsgReplacer = (name: string, val: any) => {
  if (['msg', 'exec_msg', 'init_msg', 'migrate_msg', 'value'].includes(name) && typeof val === 'string') {
    try {
      return JSON.parse(binaryToJson(val))
    } catch (ignored) {
      return val
    }
  } else {
    return val // return as is
  }
}

export type RecordsOrArrayRecords = readonly Record<string, unknown>[] | Record<string, unknown>

/**
 * Take the messages and replace the base64 messages in the response.
 * @param msgs
 */
export const humanizeMessages = (msgs: RecordsOrArrayRecords) =>
  JSON.parse(JSON.stringify(msgs, base64MsgReplacer, 2))

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
