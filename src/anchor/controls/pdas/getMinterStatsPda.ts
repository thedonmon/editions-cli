import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID_CONTROLS } from "../constants";


export const getMintStatsPda = (minter: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter_stats"), minter.toBuffer()],
    new PublicKey(PROGRAM_ID_CONTROLS)
  );
};
