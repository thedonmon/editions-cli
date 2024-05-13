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
import { getEditionsControlsPda } from "anchor/controls/pdas/getEditionsControlsPda";
import { PROGRAM_ID_GROUP_EXTENSIONS } from "sdk/editions/createDeployment";

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

  const editionsControlsProgram = getProgramInstanceEditionsControls(connection);

  const editions = getEditionsPda(symbol);

  const editionsControls = getEditionsControlsPda(editions)

  const groupMint = Keypair.generate();
  const group = Keypair.generate();
  console.log({ groupMint: groupMint.publicKey.toBase58() });

  const hashlist = getHashlistPda(editions)[0];

  const libreplexEditionsProgram = getProgramInstanceEditions(connection);
  const instructions: TransactionInstruction[] = [];
  /// creates an open editions launch
  instructions.push(
    await editionsControlsProgram.methods
      .initialiseEditionsControls(
        {
          maxNumberOfTokens: new BN(maxNumberOfTokens),
          symbol,
          name,
          offchainUrl: jsonUrl, // this points to ERC721 compliant JSON metadata
          cosignerProgramId: null,
          treasury: new PublicKey(treasury),
          maxMintsPerWallet: new BN(maxMintsPerWallet),
        }
      )
      .accounts({
        editionsControls,
        editionsDeployment: editions,
        hashlist,
        payer: wallet.publicKey,
        creator: wallet.publicKey,
        groupMint: groupMint.publicKey,
        group: group.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        libreplexEditionsProgram: libreplexEditionsProgram.programId,
        groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS,
      })
      .signers([groupMint, group])
      .instruction()
  );

  // transaction boilerplate - ignore for now
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(groupMint, group);
  await wallet.signTransaction(tx);

  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false,
  });

  return { editions, editionsControls };
};
