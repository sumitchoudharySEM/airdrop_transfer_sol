// import functionalities
import React from "react";
import logo from "./logo.svg";
import {Buffer} from "buffer";

import "./App.css";
import {
  PublicKey,
  Transaction,
  Connection,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import { Console } from "console";
//const Buffer = require("buffer/").Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";
window.Buffer = window.Buffer || Buffer;

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}


interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};


function App() {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );
  const [walletKey, setWalletKey] = useState<PublicKey | undefined>(undefined);
  const [from, setfrom] = useState<Keypair | undefined>(undefined);
  const [to, setto] = useState<Keypair | undefined>(undefined);

  useEffect(() => {
    const provider = getProvider();
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  // const buf = Buffer.from('hello', 'utf8');
  // console.log(buf);

  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;
    if (solana) {
      try {
        const response = await solana.connect();
        console.log(response);
        console.log(response.publicKey);
        console.log("wallet account ", response.publicKey.toBase58());
        setWalletKey(response.publicKey);
        setto(response.publicKey.toBase58());
      } catch (err) {
        console.error(err);
      }
    }
  };

  const createAirdrop = async () => {

    const connection: Connection = new Connection(
      clusterApiUrl("devnet"),
      "confirmed"
    );
    const from: Keypair = Keypair.generate();
    console.log("this is the from key");
    setfrom(from);

    //checking balance before airdrop
    const frommwalletBalance: number = await connection.getBalance(
      new PublicKey(from.publicKey)
    );
    console.log(
      `from Wallet balance before airdrop: ${
        parseInt(frommwalletBalance.toString()) / LAMPORTS_PER_SOL
      } SOL`
    );

    // Airdrop 2 SOL to Sender wallet
    console.log("Airdropping some SOL to Sender wallet!");
    const fromAirDropSignature: string = await connection.requestAirdrop(
      new PublicKey(from.publicKey),
      2 * LAMPORTS_PER_SOL
    );
    console.log("Airdropping complete! now conferming the transaction");
    // Latest blockhash (unique identifier of the block) of the cluster
    let latestBlockHash: any = await connection.getLatestBlockhash();

    // Confirm transaction using the last valid block height (refers to its time)
    // to check for transaction expiration
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: fromAirDropSignature,
    });

    //checking balance after airdrop
    const frommafterairwalletBalance: number = await connection.getBalance(
      new PublicKey(from.publicKey)
    );
    console.log(
      `from Wallet balance after airdrop: ${
        parseInt(frommafterairwalletBalance.toString()) / LAMPORTS_PER_SOL
      } SOL`
    );
  };

  const transferSOL = async () => {
    const connection: Connection = new Connection(
      clusterApiUrl("devnet"),
      "confirmed"
    );

    if (from !== undefined && to !== undefined) {
      // Send money from "from" wallet and into "to" wallet
      console.log("this is befour to key to key");
      //console.log(walletKey.publicKey);
      console.log("this is befour to key to key22");
      console.log(walletKey);
      console.log(from.publicKey);
      const LAMPORTS_PER_SOL = 1000000000;
      const toAccount = new PublicKey(to);

      const transaction: Transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: toAccount,
          lamports: LAMPORTS_PER_SOL / 10,
        })
      );
      console.log("transfer complete");

      // Sign transaction
      const signature: string = await sendAndConfirmTransaction(
        connection,
        transaction,
        [from]
      );
      console.log("Signature is", signature);
      const fromtranwalletBalance: number = await connection.getBalance(
        new PublicKey(from.publicKey)
      );
      const totranwalletBalance: number = await connection.getBalance(
        toAccount
      );

      console.log(
        `from Wallet balance after transaction: ${
          parseInt(fromtranwalletBalance.toString()) / LAMPORTS_PER_SOL
        } SOL`
      );
      console.log(
        `to Wallet balance after transaction: ${
          parseInt(totranwalletBalance.toString()) / LAMPORTS_PER_SOL
        } SOL`
      );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Connect to Phantom Wallet</h2>
      </header>
      {provider && !walletKey && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      {provider && walletKey && <p>Connected account</p>}

      {!provider && (
        <p>
          No provider found. Install{" "}
          <a href="https://phantom.app/">Phantom Browser extension</a>
        </p>
      )}
      <header className="App-header">
        <h2>CREATE a new wallet and airdrop 2 sol</h2>
      </header>
      <button onClick={createAirdrop}>Create Wallet & airdrop</button>
      <header className="App-header">
        <h2>transfer 2 sol</h2>
      </header>
      <button onClick={transferSOL}>transfer sol</button>
    </div>
  );
}

export default App;
