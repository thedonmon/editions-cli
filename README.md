
# Sample editions cli

libreplex_editions allows the creation of open editions (copies of identical mints). the core program does not allow whitelists / creator fees. Both WL and creator fees are added via a separate wrapper contract.

Responsive                     |  Desktop
:-------------------------:|:-------------------------:
![](scaffold-mobile.png)  |  ![](scaffold-desktop.png)

## Getting Started

It is highly recommended you check out libreplex_program_library (especially libreplex_editions for the rust source code).

## Installation

```bash
npm install
# or
yarn install
```

## Create a deployment

Create a deployment with symbol "eee" and json https://www.google.com on solana mainnet (make sure that you have used solana-keygen to generate a new identify key.
Also please make sure you have some SOL in the account to cover rent costs.

```bash
yarn createDeployment -k ~/.config/solana/id.json -s eee -j https://www.google.com -r https://api.mainnet-beta.solana.com
```
Note down the address id of your collection.

## Mint from deployment 5iXdJjVP2EBEEtbTEE4uh1zP8ZeyWgJBhwQcBrSxCMTz

Substite your own deployment ID obtained in the previous step to mint from your deployment

```bash
yarn mint -k ~/.config/solana/id.json  -r https://api.mainnet-beta.solana.com -d 5iXdJjVP2EBEEtbTEE4uh1zP8ZeyWgJBhwQcBrSxCMTz
```

