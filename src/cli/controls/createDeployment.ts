export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { createDeployment } from "../../sdk/controls/createControlDeployment";
import { Wallet as AnchorWallet, Program } from "@coral-xyz/anchor";
import fs from "fs";
import { Command } from "commander";
import { LibreWallet } from "../../anchor/LibreWallet";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Create an editions account with controls")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-s, --symbol <symbol>", "Symbol")
  .requiredOption(
    "-n, --name <name>",
    "Name (can include a template string: {})"
  )
  .requiredOption(
    "-j, --jsonUrl <jsonUrl>",
    "Json URL (can include a template string: {})"
  )
  .requiredOption("-t, --treasuryWallet <treasuryWallet>", "Treasury wallet")
  .requiredOption(
    "--maxMintsPerWallet <maxMintsPerWallet>",
    "Max mints per wallet (total), 0 for unlimited"
  )
  .requiredOption(
    "--maxNumberOfTokens <maxNumberOfTokens>",
    "Max number of tokens (total), 0 for unlimited"
  )

  .requiredOption("-r, --rpc <rpc>", "RPC")
  .parse(process.argv);
// get all fair launches

const opts = cli.opts();

(async () => {
  console.log("test");

  const connection = new Connection(opts.rpc);

  const keyfile = JSON.parse(fs.readFileSync(opts.keypairPath, "utf8"));

  const signerKeypair = Keypair.fromSecretKey(new Uint8Array(keyfile));
  const wallet = new LibreWallet(signerKeypair);

  try {
    const { editions, editionsControls } = await createDeployment({
      wallet,
      params: {
        name: opts.name,
        symbol: opts.symbol,
        jsonUrl: opts.jsonUrl,
        treasury: opts.treasuryWallet,
        maxMintsPerWallet: +opts.maxMintsPerWallet,
        maxNumberOfTokens: +opts.maxNumberOfTokens,
      },
      connection,
    });

    console.log(
      `New edition id: ${editions.toBase58()}, controls: ${editionsControls.toBase58()}}`
    );
  } catch (e) {
    console.log({ e });
  }
})();
