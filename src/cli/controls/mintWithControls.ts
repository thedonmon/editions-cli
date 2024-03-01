export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import fs from "fs";
import { Command } from "commander";
import { decodeEditions } from "../../anchor/editions/accounts";
import { getProgramInstanceEditions } from "../../anchor/editions/getProgramInstanceEditions";
import { LibreWallet } from "../../anchor/LibreWallet";
import { mintWithControls } from "sdk/controls/mintWithControls";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Mint from controls deployment")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-d, --deploymentId <deploymentId>", "Deployment id")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .requiredOption("-p, --phaseIndex <phaseIndex>", "Phase index")
  .requiredOption("-n, --numberOfMints <numberOfMints>", "Number of mints")
  .parse(process.argv);
// get all fair launches

const opts = cli.opts();

(async () => {
  console.log("test");

  const connection = new Connection(opts.rpc);

  const keyfile = JSON.parse(fs.readFileSync(opts.keypairPath, "utf8"));

  const signerKeypair = Keypair.fromSecretKey(new Uint8Array(keyfile));

  await mintWithControls({
    wallet: new LibreWallet(signerKeypair),
    params: {
      editionsId: opts.deploymentId,
      phaseIndex: +opts.phaseIndex,
      numberOfMints: +opts.numberOfMints
    },
    connection,
  }).finally(()=>{
    console.log("Finished")
  });
})();
