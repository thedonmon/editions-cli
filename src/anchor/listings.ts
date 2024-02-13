
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import {
  Field,
  unpack as unpackTokenMetadata,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import { useFetchSingleAccount } from "utils/singleAccountInfo";
import { useConnection } from "@solana/wallet-adapter-react";
import { toBigIntLE } from "bigint-buffer";

export interface ListingIndex {
  mint: PublicKey;
  lister: PublicKey;
  priceInLamports: number;
  creationTime: number;
  listerIndex: number;
  amountToSell: number;
  bump: number;
}

export interface ActivityCounters {
  actor: PublicKey;
  listingCount: number;
  soldCount: number;
  purchaseCount: number;
  totalAmountSold: number;
  totalAmountBought: number;
}





export const decodeActivityCounters = (buffer: Buffer | undefined) => {
  // skip the first 8 bytes - discriminator. We could validate this?
  if (buffer) {
    // authority: 8
    const actor = new PublicKey(buffer.subarray(8, 40));

      // 8 + 32 + 32
      const listingCount = Number(toBigIntLE(buffer.subarray(40, 48)));

    // 8 + 32 + 32
    const soldCount = Number(toBigIntLE(buffer.subarray(48, 56)));

    // 8 + 32 + 32
    const purchaseCount = Number(toBigIntLE(buffer.subarray(56, 64)));

    // 8 + 32 + 32
    const totalAmountSold = Number(toBigIntLE(buffer.subarray(64, 72)));

    // 8 + 32 + 32
    const totalAmountBought = Number(toBigIntLE(buffer.subarray(72, 80)));

    const item: ActivityCounters = {
      actor,
      listingCount,
      soldCount,
      purchaseCount,
      totalAmountSold,
      totalAmountBought
  
    };

    return item;
  }
  return null;
};


export const decodeListingIndexBuffer = (buffer: Buffer | undefined) => {
  // skip the first 8 bytes - discriminator. We could validate this?
  if (buffer) {
    // authority: 8
    const mint = new PublicKey(buffer.subarray(8, 40));

    // 8 + 32
    const lister = new PublicKey(buffer.subarray(40, 72));

    // 8 + 32 + 32
    const priceInLamports = Number(toBigIntLE(buffer.subarray(72, 80)));

    // 8 + 32 + 32
    const creationTime = Number(toBigIntLE(buffer.subarray(80, 88)));

    // 8 + 32 + 32
    const listerIndex = Number(toBigIntLE(buffer.subarray(88, 89)));

    // 8 + 32 + 32
    const amountToSell = Number(toBigIntLE(buffer.subarray(89, 97)));

    // 8 + 32 + 32
    const bump = Number(toBigIntLE(buffer.subarray(97, 98)));

    const item: ListingIndex = {
      mint,
      lister,
      priceInLamports,
      creationTime,
      listerIndex,
      amountToSell,
      bump,
    };

    return item;
  }
  return null;
};

export const useListingIndex = (mintId: PublicKey | null, refetchInterval?: number) => {
  const { connection } = useConnection();
  const q = useFetchSingleAccount(mintId, connection,refetchInterval);

  const decoded = useMemo(() => {
    try {
      const obj = mintId && q?.data?.item
        ? {
            item: decodeListingIndexBuffer(q?.data?.item.data),
            publicKey: mintId,
          }
        : null;
      return obj;
    } catch (e) {
      return null;
    }
  }, [mintId, q.data?.item]);

  return {data: decoded, isFetching: q.isFetching};
};
