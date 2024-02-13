import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

export interface IExecutorParams<T> {
    wallet: AnchorWallet,
    params: T,
    connection: Connection
}