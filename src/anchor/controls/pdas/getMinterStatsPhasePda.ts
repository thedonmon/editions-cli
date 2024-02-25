import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID_CONTROLS } from "../constants";
import { toBufferLE } from "bigint-buffer";

export const getMintStatsPda = (minter: PublicKey, phaseIndex: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter_stats"), minter.toBuffer(), toBufferLE(BigInt(phaseIndex), 4)],
    new PublicKey(PROGRAM_ID_CONTROLS)
  );
};
