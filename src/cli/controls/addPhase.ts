export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { createDeployment } from "../../sdk/controls/createControlDeployment";
import { Wallet as AnchorWallet, Program } from "@coral-xyz/anchor";
import fs from "fs";
import { Command } from "commander";
import { LibreWallet } from "../../anchor/LibreWallet";
import { addPhase } from "sdk/controls/addPhase";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Add phase to a control deployment")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .requiredOption("-d, --deploymentId <deploymentId>", "controls ID")
  .option("-s, --startTime <startTime>", "start time")
  .option("-e, --endTime <endTime>", "end time")
  .requiredOption("--maxMintsPerWallet <maxMintsPerWallet>", "Max mints per wallet (total), 0 for unlimited")
  .requiredOption("--maxMintsTotal <maxMintsTotal>", "Max mints per phase (total across all wallets), 0 for unlimited")
  .requiredOption("--priceAmount <priceAmount>", "Price per mint in lamports, can be 0")
 
  .parse(process.argv);

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);
  const keyfile = JSON.parse(fs.readFileSync(opts.keypairPath, "utf8"));

  const signerKeypair = Keypair.fromSecretKey(new Uint8Array(keyfile));
  const wallet = new LibreWallet(signerKeypair);
  
  console.log(opts)
  try {
    const {txid} = await addPhase({
      wallet,
      params: {
        maxMintsPerWallet: +opts.maxMintsPerWallet,
        priceAmount: +opts.priceAmount,
        maxMintsTotal: +opts.maxMintsTotal,
        deploymentId: opts.deploymentId,
        startTime: opts.startTime ? +opts.startTime : undefined,
        endTime: opts.endTime ? +opts.endTime : undefined,
         

      },
      connection,
    });

    console.log(`txid: ${txid}`);
  } catch (e) {
    console.log({ e });
  }
})();
