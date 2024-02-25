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
import { getEditionsPda } from "../../anchor/editions/pdas/getEditionsPda";
import { IExecutorParams } from "../../cli/IExecutorParams";
import { sendSignedTransaction } from "../tx_utils";
import { getHashlistPda } from "../../anchor/editions/pdas/getHashlistPda";
import { getProgramInstanceEditionsControls } from "anchor/controls/getProgramInstanceEditionsControls";

export interface IInitializeLaunch {
  symbol: string;
  jsonUrl: string;
  treasury: string;
  name: string;
  maxMintsPerWallet: number; // set to 0 for unlimited
  maxNumberOfTokens: number; // set to 0 for unlimited
}

export const createDeployment = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IInitializeLaunch>) => {
  const {
    symbol,
    jsonUrl,
    treasury,
    maxMintsPerWallet,
    maxNumberOfTokens,
    name
  } = params;

  const editionProgram = getProgramInstanceEditionsControls(connection);

  const editionsPda = getEditionsPda(symbol);

  const groupMint = Keypair.generate();

  const treasuryKey = new PublicKey(treasury);
  console.log({ groupMint: groupMint.publicKey.toBase58() });

  const hashlist = getHashlistPda(editionsPda)[0];

  const libreplexEditionsProgram = getProgramInstanceEditions(connection);
  const instructions: TransactionInstruction[] = [];
  /// creates an open editions launch
  instructions.push(
    await editionProgram.methods
      .initialiseEditionsControls(
        {
          maxNumberOfTokens: new BN(maxNumberOfTokens),
          symbol,
          name,
          offchainUrl: jsonUrl, // this points to ERC721 compliant JSON metadata
          creatorCosignProgramId: null,
          treasury: new PublicKey(treasury),
          maxMintsPerWallet: new BN(maxMintsPerWallet),
        }
      )
      .accounts({
        editionsDeployment: editionsPda,
        hashlist,
        payer: wallet.publicKey,
        creator: wallet.publicKey,
        groupMint: groupMint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        libreplexEditionsProgram: libreplexEditionsProgram.programId
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
    skipPreflight: false,
  });

  return { editionsPda };
};
