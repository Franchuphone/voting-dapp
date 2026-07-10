---
description: Deploy VotingFactory to the Sepolia testnet
---

Deploy the `VotingFactory` to Sepolia.

Prerequisites (verify before deploying):
- `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` are set as Hardhat config variables.
  Set them with `npx hardhat keystore set SEPOLIA_RPC_URL` /
  `npx hardhat keystore set SEPOLIA_PRIVATE_KEY`. Never print or hardcode the key.
- The deployer account holds Sepolia ETH for gas.

Steps:

1. From `hardhat-env/`:
   ```
   npx hardhat ignition deploy ignition/modules/VotingFactory.ts --network sepolia
   ```
2. Capture the deployed factory address and the deployment block number from the
   Ignition output.
3. Tell the user to update `next-env/.env.local` (or their Vercel env) with:
   - `NEXT_PUBLIC_VOTING_FACTORY_ADDRESS`
   - `NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK`
4. Suggest verifying the contract on Etherscan if the user wants a public source link.

Deployment sends a real on-chain transaction — confirm with the user before running.
