
export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import fs from "fs";
import { Command } from "commander";
import { mint } from "sdk/mint";
import { decodeEditions } from "anchor/editions/accounts";
import { getProgramInstanceEditions } from "anchor/editions/getProgramInstanceEditions";
import { LibreWallet } from "anchor/LibreWallet";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Add node id to the database")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-d, --deployment <deployment>", "Deployment id")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .parse(process.argv);
// get all fair launches

const opts = cli.opts();

(async () => {
  console.log("test");

  const connection = new Connection(opts.rpc);

  const keyfile = JSON.parse(fs.readFileSync(opts.keypairPath, "utf8"));

  const signerKeypair = Keypair.fromSecretKey(new Uint8Array(keyfile));

  const editionsPubkey = new PublicKey(opts.deployment);
  const editionsAccount = await connection.getAccountInfo(editionsPubkey);

  const editionsProgram = getProgramInstanceEditions(connection);

  const editions = decodeEditions(editionsProgram)(
    editionsAccount.data,
    editionsPubkey
  );

  console.log(`Signing as ${signerKeypair.publicKey.toBase58()}`)

  await mint({
    wallet: new LibreWallet(signerKeypair),
    params: {
      editions,
    },
    connection,
  });
})();
