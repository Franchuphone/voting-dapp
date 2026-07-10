---
description: Deploy VotingFactory to a local Hardhat node and wire the address into the frontend
---

Deploy the `VotingFactory` to a local chain and connect the frontend to it.

Steps:

1. From `hardhat-env/`, ensure a local node is running (`npx hardhat node`).
   If the user hasn't started one, tell them to run it in a separate terminal —
   it must stay running.
2. Deploy the factory:
   ```
   npx hardhat ignition deploy ignition/modules/VotingFactory.ts --network localnode
   ```
3. Read the deployed address from
   `hardhat-env/ignition/deployments/chain-31337/deployed_addresses.json`
   (key `VotingFactoryModule#VotingFactory`).
4. Update `next-env/.env.local`:
   - `NEXT_PUBLIC_VOTING_FACTORY_ADDRESS` → the deployed address
   - `NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK` → the deployment block (usually `0`
     for a fresh local node)
5. Remind the user to restart `pnpm dev` so Next.js picks up the new env values.

If the contract ABI changed, also run `/sync-contracts` to refresh the frontend constants.
