import {
  AccountMeta,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "spl-token-4";
import { getProgramInstanceEditions } from "../../anchor/editions/getProgramInstanceEditions";
import { EditionsDeployment } from "../../anchor/editions/accounts";
import { sendSignedTransaction } from "../tx_utils";
import { IExecutorParams } from "../../cli/IExecutorParams";
import { IRpcObject } from "../../utils/IRpcObject";
import { getHashlistPda } from "../../anchor/editions/pdas/getHashlistPda";
import { getHashlistMarkerPda } from "../../anchor/editions/pdas/getHashlistMarkerPda";
import { PROGRAM_ID_GROUP_EXTENSIONS } from "./createDeployment";

export const PROGRAM_ID_LEGACY_METADATA = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export interface IMint {
  editions: IRpcObject<EditionsDeployment>;
}

export const DEPLOYMENT_TYPE_2022 = 3;
export const DEPLOYMENT_TYPE_LEGACY = 0;

export const mint = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IMint>) => {
  
  const { editions } = params;

  const tokenProgram = TOKEN_2022_PROGRAM_ID;

  const instructions: TransactionInstruction[] = [];

  const hashlist = getHashlistPda(editions.pubkey)[0];

  const mint = Keypair.generate();
  const member = Keypair.generate();

  const hashlistMarker = getHashlistMarkerPda(
    editions.pubkey,
    mint.publicKey
  )[0];

  const editionsProgram = getProgramInstanceEditions(connection);

  const tokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    wallet.publicKey,
    false,
    tokenProgram
  );

  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 850_000,
    })
  );

  // console.log('LKJHLKJHLKJH', deploymentConfig?.item?.cosignerProgramId?.toString());
  const remainingAccounts: AccountMeta[] = [];

  console.log({
    editionsDeployment: editions.pubkey.toBase58(),
    payer: wallet.publicKey.toBase58(),
    signer: wallet.publicKey.toBase58(),
    minter: wallet.publicKey.toBase58(),
    mint: mint.publicKey.toBase58(),
    member: member.publicKey.toBase58(),
    hashlist: hashlist.toBase58(),
    hashlistMarker: hashlistMarker.toBase58(),
    groupMint: editions.item.groupMint.toBase58(),
    tokenAccount: tokenAccount.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
    systemProgram: SystemProgram.programId.toBase58(),
    groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS.toBase58()})

  const ix = await editionsProgram.methods
    .mint()
    .accounts({
      editionsDeployment: editions.pubkey,
      payer: wallet.publicKey,
      signer: wallet.publicKey,
      minter: wallet.publicKey,
      mint: mint.publicKey,
      member: member.publicKey,
      hashlist,
      hashlistMarker,
      group: editions.item.group,
      tokenAccount,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS
    })
    .signers([mint, member])
    .remainingAccounts(remainingAccounts)
    .instruction();

  instructions.push(ix);
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(mint, member);

  await wallet.signTransaction(tx);
  await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false
  }).catch((e) => {
    console.log({ e });
  });

};
