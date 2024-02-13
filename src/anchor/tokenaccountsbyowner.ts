import { Idl } from "@coral-xyz/anchor";
import {
  AccountInfo,
  Connection,
  GetProgramAccountsFilter,
  KeyedAccountInfo,
  ProgramAccountChangeCallback,
  PublicKey,
} from "@solana/web3.js";
import {AccountLayout, TOKEN_PROGRAM_ID} from "spl-token-4"


import { useEffect, useMemo } from "react";
import { QueryClient, useQuery, useQueryClient } from "react-query";
import { Updater } from "react-query/types/core/utils";
import { IRpcObject } from "utils/executor";
import { useFetchSingleAccount } from "utils/singleAccountInfo";


export const fetchTokenAccountsByOwner = <T extends unknown, P extends Idl>(
  owner: PublicKey,
  connection: Connection,
  programId: PublicKey
) => ({
  fetcher: async () => {
    const _items: IRpcObject<Buffer>[] = [];
    const results = await connection?.getTokenAccountsByOwner(owner, {
      programId
    });

    for (const result of results.value) {
    
      // const obj = decode(result.account.data, result.pubkey);

      _items.push({
        item: result.account.data,
        pubkey: result.pubkey,
      });
    }
    return _items;
  },
  listener: {
      add: (onAccountChange: ProgramAccountChangeCallback, programId: PublicKey) =>{},
      // owner ? connection?.onProgramAccountChange(
      //     programId,
      //     onAccountChange,
      //     "processed",
      //     [
      //       {
      //         memcmp: {
      //           offset: 32,
      //           bytes: owner?.toBase58()??'',
      //         },
      //       }
      //     ]
      //   ) : null,
      remove: (i: number) => {
        // connection?.removeProgramAccountChangeListener(i);
      },
  },
});

export const useTokenAccountsByOwner = (
  owner: PublicKey,
  connection: Connection,
  programId: PublicKey,
) => {
 
  const q = useTokenAccountBuffers(owner, connection, programId)
  const decoded = useMemo(
    () => ({
      ...q,
      data:
        q?.data
          ?.map((item) => ({item: (item?.item?.length ?? 0) > 0 ? AccountLayout.decode(item.item) : null, pubkey: item.pubkey}))
          .filter((item) => (item?.item?.amount ??0) > 0) ?? [],
    }),

    [q]
  );

  return decoded;
};

export const useTokenAccountBuffers = (
  owner: PublicKey,
  connection: Connection,
  programId: PublicKey,
) => {
  const { fetcher, listener } = useMemo(
    () => owner ? fetchTokenAccountsByOwner(owner, connection, programId) : 
    {fetcher: ()=>[] as any[], listener: {add: ()=>{}, remove: ()=>{}}},

    [connection, owner, programId]
  );
  
  const key = useMemo(()=>`tokenaccountsbyowner-${owner?.toBase58()}-${connection.rpcEndpoint}-${programId.toBase58()}`,[owner, connection])

  const q = useQuery<IRpcObject<Buffer>[]>(key, fetcher, {refetchOnMount: false});

  return q;
};


export const useTokenAccountById = (
  tokenAccountId: PublicKey | null,
  connection: Connection
) => {
  
  const q = useFetchSingleAccount(tokenAccountId, connection);

  
  const decoded = useMemo(() => {
    try {
      const obj = q?.data?.item ? AccountLayout.decode(q?.data?.item.data) : null;
      return obj;
    } catch (e) {
      return null;
    }
  }, [q.data?.item]);

  return decoded;

};
