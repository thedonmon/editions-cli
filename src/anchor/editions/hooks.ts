import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { BorshCoder, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

import { useContext, useEffect, useMemo } from "react";
import { useFetchSingleAccount } from "utils/singleAccountInfo";
import { decodeEditions } from "./accounts";
import { LibreplexEditions } from "./libreplex_editions";
import { EditionsProgramContext } from "./EditionsProgramContext";

export type EditionsDeployment  = IdlAccounts<LibreplexEditions>["editionsDeployment"];
export type Hashlist = IdlAccounts<LibreplexEditions>["hashlist"];
export type HashlistMarker = IdlAccounts<LibreplexEditions>["hashlistMarker"];

export const useEditionsById = (
  deploymentId: PublicKey | null,
  connection: Connection,
  refetchInterval?: number
) => {
  const { program } = useContext(EditionsProgramContext);

  const q = useFetchSingleAccount(deploymentId, connection, refetchInterval);

  const decoded = useMemo(() => {
    try {
      const obj =
        q?.data?.item && deploymentId
          ? decodeEditions(program)(q?.data?.item.data, deploymentId)
          : undefined;
      return obj;
    } catch (e) {
      console.log({e});
      return null;
    }
  }, [deploymentId, program, q?.data?.item]);

  return {
    ...q,
    data: decoded,
  };
};


export const decodeHashlistMarker =
  (program: Program<LibreplexEditions>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const inscription = buffer
      ? coder.accounts.decode<HashlistMarker>("hashlistMarker", buffer)
      : null;

    return {
      item: inscription,
      pubkey,
    };
  };


export const decodeHashlist =
  (program: Program<LibreplexEditions>) =>
  (buffer: Buffer | undefined, pubkey: PublicKey) => {
    const coder = new BorshCoder(program.idl);
    const inscription = buffer
      ? coder.accounts.decode<Hashlist>("hashlist", buffer)
      : null;

    return {
      item: inscription,
      pubkey,
    };
  };

export const useHashlistById = (
  hashlistId: PublicKey | null,
  connection: Connection,
  refetchInterval?: number
) => {
  const { program } = useContext(EditionsProgramContext);

  const q = useFetchSingleAccount(hashlistId, connection);

  const decoded = useMemo(() => {
    try {
      const obj =
        q?.data?.item && hashlistId
          ? decodeHashlist(program)(q?.data?.item.data, hashlistId)
          : undefined;
      return obj;
    } catch (e) {
      return null;
    }
  }, [hashlistId, program, q?.data?.item]);

  const hashlistIndex = useMemo(() => {
    const _hashlistIndex: { [key: string]: number } = {};
    for (const hashlistEntry of decoded?.item?.issues ?? []) {
      _hashlistIndex[hashlistEntry.mint.toBase58()] = Number(
        hashlistEntry.order
      );
    }
    return _hashlistIndex;
  }, [decoded]);

  return {
    data: decoded,
    refetch: q.refetch,
    isFetching: q.isFetching,
    index: hashlistIndex
  };
};
