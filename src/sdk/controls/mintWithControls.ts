import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import BN from "bn.js";

import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "spl-token-4";
import { getProgramInstanceEditions } from "../../anchor/editions/getProgramInstanceEditions";
import { getEditionsPda } from "../../anchor/editions/pdas/getEditionsPda";
import { IExecutorParams } from "../../cli/IExecutorParams";
import { sendSignedTransaction } from "../tx_utils";
import { getHashlistPda } from "../../anchor/editions/pdas/getHashlistPda";
import { getProgramInstanceEditionsControls } from "anchor/controls/getProgramInstanceEditionsControls";
import { getEditionsControlsPda } from "anchor/controls/pdas/getEditionsControlsPda";
import { getHashlistMarkerPda } from "anchor/editions/pdas/getHashlistMarkerPda";
import { decodeEditions } from "anchor/editions/accounts";
import { getMinterStatsPda } from "anchor/controls/pdas/getMinterStatsPda";
import { getMinterStatsPhasePda } from "anchor/controls/pdas/getMinterStatsPhasePda";
import { decodeEditionsControls } from "anchor/controls/accounts";
import { PROGRAM_ID_GROUP_EXTENSIONS } from "sdk/editions/createDeployment";

export interface IMintWithControls {
  phaseIndex: number;
  editionsId: string;
  numberOfMints: number;
}

const MAX_MINTS_PER_TRANSACTION = 3;

export const mintWithControls = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IMintWithControls>) => {
  const { phaseIndex, editionsId, numberOfMints } = params;

  const editionsControlsProgram =
    getProgramInstanceEditionsControls(connection);

  const editions = new PublicKey(editionsId);

  const editionsData = await connection.getAccountInfo(editions);

  if (!editionsData) {
    throw Error("Editions not found");
  }

  const libreplexEditionsProgram = getProgramInstanceEditions(connection);

  const editionsObj = decodeEditions(libreplexEditionsProgram)(
    editionsData.data,
    editions
  );

  const editionsControlsPda = getEditionsControlsPda(editions);

  const editionsControlsData = await connection.getAccountInfo(
    editionsControlsPda
  );

  const editionsControlsObj = decodeEditionsControls(editionsControlsProgram)(
    editionsControlsData.data,
    editionsControlsPda
  );

  const hashlist = getHashlistPda(editions)[0];

  const minterStats = getMinterStatsPda(editions, wallet.publicKey)[0];

  const minterStatsPhase = getMinterStatsPhasePda(
    editions,
    wallet.publicKey,
    phaseIndex
  )[0];

  let remainingMints = numberOfMints;

  let txs: Transaction[] = [];

  while (remainingMints > 0) {
    const instructions: TransactionInstruction[] = [];
    /// creates an open editions launch

    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 850_000,
      })
    );

    const mints: Keypair[] = [];
    const members: Keypair[] = [];

    for (let i = 0; i < Math.min(MAX_MINTS_PER_TRANSACTION, remainingMints); ++i) {
      const mint = Keypair.generate();
      const member = Keypair.generate();

      mints.push(mint);
      members.push(member);

      const tokenAccount = getAssociatedTokenAddressSync(
        mint.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const hashlistMarker = getHashlistMarkerPda(editions, mint.publicKey)[0];

      instructions.push(
        await editionsControlsProgram.methods
          .mintWithControls({
            phaseIndex,
          })
          .accounts({
            editionsDeployment: editions,
            editionsControls: editionsControlsPda,
            hashlist,
            hashlistMarker,
            payer: wallet.publicKey,
            mint: mint.publicKey,
            member: member.publicKey,
            signer: wallet.publicKey,
            minter: wallet.publicKey,
            minterStats,
            minterStatsPhase,
            group: editionsObj.item.group,
            groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS,
            tokenAccount,
            treasury: editionsControlsObj.item.treasury,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            libreplexEditionsProgram: libreplexEditionsProgram.programId,
          })
          .signers([mint, member])
          .instruction()
      );
    }

    remainingMints -= MAX_MINTS_PER_TRANSACTION;

    // transaction boilerplate - ignore for now
    const tx = new Transaction().add(...instructions);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(...mints, ...members);
    txs.push(tx);
  }

  await wallet.signAllTransactions(txs);

  const promises = txs.map((item) =>
    sendSignedTransaction({
      signedTransaction: item,
      connection,
      skipPreflight: false,
    })
  );

  await Promise.all(promises);

  return { editions, editionsControls: editionsControlsPda };
};
