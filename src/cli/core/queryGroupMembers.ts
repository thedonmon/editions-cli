export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import {
  PROGRAM_ID_GROUP_EXTENSIONS,
  createDeployment,
} from "sdk/editions/createDeployment";
import fs from "fs";
import { Command } from "commander";
import { LibreWallet } from "anchor/LibreWallet";
import { decodeEditions } from "anchor/editions/accounts";
import { getProgramInstanceEditions } from "anchor/editions/getProgramInstanceEditions";
import { getEditionsControlsPda } from "anchor/controls/pdas/getEditionsControlsPda";
import { decodeEditionsControls } from "anchor/controls/accounts";
import { getProgramInstanceEditionsControls } from "anchor/controls/getProgramInstanceEditionsControls";
import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";
import bs58 from "bs58";
import { sha256 } from "js-sha256";
import { decodeMint2022 } from "anchor/mints";
import { decodeMember2022 } from "anchor/members";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Query members of a deployment")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .requiredOption("-i, --deploymentId <deploymentId>", "deployment ID")

  .parse(process.argv);
// get all fair launches

const opts = cli.opts();

(async () => {
  const connection = new Connection(opts.rpc);

  const deploymentPubkey = new PublicKey(opts.deploymentId);
  try {
    const accountData = await connection.getAccountInfo(deploymentPubkey);

    const editionProgram = getProgramInstanceEditions(connection);
    if (!accountData) {
      throw Error(`Deployment ${opts.deploymentId} not found`);
    }
    const deploymentObj = decodeEditions(editionProgram)(
      accountData.data,
      deploymentPubkey
    );

    console.log({ group: deploymentObj.item.group.toBase58() });

    const members = await connection.getProgramAccounts(
      PROGRAM_ID_GROUP_EXTENSIONS,
      {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(
                sha256.array("spl_token_group_interface:member").slice(0, 8)
              ),
            },
          },
          {
            memcmp: {
              offset: 44,
              bytes: deploymentObj.item.group.toBase58(),
            },
          },
        ],
      }
    );

    console.log({
      members: members.map((item) => ({
        member: item.pubkey.toBase58(),
        mint: decodeMember2022(item.account, item.pubkey)?.item?.mint.toBase58()
      })),
    });
  } catch (e) {
    console.log({ e });
  }
})();
