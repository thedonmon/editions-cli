import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

import { IDL} from "./libreplex_editions_controls";
import { PROGRAM_ID_CONTROLS } from "./constants";
import { LibreplexEditionsControls } from "./libreplex_editions_controls";
import { LibreWallet } from "../LibreWallet";

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export function getProgramInstanceEditionsControls(
  connection: Connection,
) {
  
  const provider = new anchor.AnchorProvider(
    connection,
    new LibreWallet(Keypair.generate()),
    anchor.AnchorProvider.defaultOptions()
  );
  const idl = IDL;
  const program = new anchor.Program<LibreplexEditionsControls>(
    idl,
    PROGRAM_ID_CONTROLS,
    provider
  )!;
  return program;
}
