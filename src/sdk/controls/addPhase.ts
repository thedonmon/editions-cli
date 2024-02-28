import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";
import BN from "bn.js";

import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";
import { getProgramInstanceEditions } from "../../anchor/editions/getProgramInstanceEditions";
import { IExecutorParams } from "../../cli/IExecutorParams";
import { sendSignedTransaction } from "../tx_utils";
import { getProgramInstanceEditionsControls } from "anchor/controls/getProgramInstanceEditionsControls";
import { getEditionsControlsPda } from "anchor/controls/pdas/getEditionsControlsPda";

export interface IAddPhase {
  maxMintsPerWallet: number; // set to 0 for unlimited
  priceAmount: number,
  maxMintsTotal: number,
  deploymentId: string,
}

export const addPhase = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IAddPhase>) => {
  const {
    deploymentId,
    priceAmount,
    maxMintsTotal,
    maxMintsPerWallet,
  } = params;

  const editionProgram = getProgramInstanceEditionsControls(connection);

  const libreplexEditionsProgram = getProgramInstanceEditions(connection);
  const instructions: TransactionInstruction[] = [];
  /// creates an open editions launch

  const endTime = new BN(9007199254740991);


  const controls = getEditionsControlsPda(new PublicKey(deploymentId))

  instructions.push(
    await editionProgram.methods
      .addPhase(
        {
          priceAmount: new BN(priceAmount),
          priceToken: new PublicKey("So11111111111111111111111111111111111111112"),
          startTime: new BN(new Date().getTime()/1000),
          maxMintsPerWallet: new BN(maxMintsPerWallet),
          maxMintsTotal: new BN(maxMintsTotal),
          /// max i64 value - this is open ended
          endTime

        }
      )
      .accounts({
        editionsControls: controls,
        creator: wallet.publicKey,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        libreplexEditionsProgram: libreplexEditionsProgram.programId
      })
      .signers([])
      .instruction()
  );

  // transaction boilerplate - ignore for now
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  await wallet.signTransaction(tx);

  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false,
  });

  return { txid };
};
