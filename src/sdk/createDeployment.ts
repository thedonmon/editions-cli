import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey
} from "@solana/web3.js";
import BN from "bn.js";

import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";
import { getProgramInstanceEditions } from "../anchor/editions/getProgramInstanceEditions";
import { getEditionsPda } from "../anchor/editions/pdas/getEditionsPda";
import { IExecutorParams } from "../cli/IExecutorParams";
import { sendSignedTransaction } from "./tx_utils";
import { getHashlistPda } from "../anchor/editions/pdas/getHashlistPda";

export interface IInitializeLaunch {
  symbol: string;
  jsonUrl: string;
}

export const createDeployment = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IInitializeLaunch>) => {

  const {
    symbol,
    jsonUrl,
  } = params;

  const editionProgram = getProgramInstanceEditions(connection);

  const editionsPda = getEditionsPda(symbol);

  const groupMint = Keypair.generate();

  console.log({groupMint: groupMint.publicKey.toBase58()})

  const hashlist = getHashlistPda(editionsPda)[0];

  const instructions: TransactionInstruction[] = [];
  /// creates an open editions launch
  instructions.push(
    await editionProgram.methods
      .initialise({
        maxNumberOfTokens: new BN(0), // 0 means open edition i.e. no max tokens
        symbol,
        name: symbol,
        offchainUrl: jsonUrl, // this points to ERC721 compliant JSON metadata
        creatorCosignProgramId: null,
      })
      .accounts({
        systemProgram: SystemProgram.programId,
        payer: wallet.publicKey,
        groupMint: groupMint.publicKey,
        hashlist,
        editionsDeployment: editionsPda,
        creator: wallet.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([groupMint])
      .instruction()
  );

  // transaction boilerplate - ignore for now
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(groupMint);
  await wallet.signTransaction(tx);

  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: true
  });;

  return {editionsPda}
};
