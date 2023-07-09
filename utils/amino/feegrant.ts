import { AminoConverter } from '@cosmjs/stargate'
import { Any } from 'cosmjs-types/google/protobuf/any'
import { MsgGrantAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx'

export function createFeegrantAminoConverters(): Record<string, AminoConverter> {
  return {
    '/cosmos.feegrant.v1beta1.MsgGrantAllowance': {
      aminoType: 'cosmos-sdk/MsgGrantAllowance',
      toAmino: ({granter, grantee, allowance}: MsgGrantAllowance) => ({
        grantee,
        granter,
        allowance,
      }),
      /* eslint-disable camelcase */
      fromAmino: ({grantee, granter, allowance}: {
        granter: string, grantee: string, allowance?: Any
      }): MsgGrantAllowance => MsgGrantAllowance.fromPartial({
        grantee,
        granter,
        allowance,
      }),
      /* eslint-enable camelcase */
    },
  }
}
