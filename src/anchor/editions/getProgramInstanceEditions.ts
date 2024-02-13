import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

import { IDL} from "./libreplex_editions";
import { PROGRAM_ID_EDITIONS } from "./constants";
import { LibreplexEditions } from "./libreplex_editions";
import { LibreWallet } from "../../anchor/LibreWallet";

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export function getProgramInstanceEditions(
  connection: Connection,
) {
  
  const provider = new anchor.AnchorProvider(
    connection,
    new LibreWallet(Keypair.generate()),
    anchor.AnchorProvider.defaultOptions()
  );
  const idl = IDL;
  const program = new anchor.Program<LibreplexEditions>(
    idl,
    PROGRAM_ID_EDITIONS,
    provider
  )!;
  return program;
}
