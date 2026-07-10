---
description: Re-sync the frontend contract ABIs/constants from the Hardhat build artifacts
---

Keep `next-env/constants/` in sync with the compiled contracts after a Solidity change.

Steps:

1. Recompile in `hardhat-env/`: `npx hardhat compile`.
2. The compiled ABIs live under `hardhat-env/artifacts/contracts/`:
   - `voting.sol/Voting.json`
   - `votingFactory.sol/VotingFactory.json`
3. Update the frontend constants to match:
   - `next-env/constants/voting.ts` (exports `votingAbi`)
   - `next-env/constants/votingFactory.ts` (exports `votingFactoryConfig` — address + abi)
     Replace only the `abi` array; keep the surrounding config (the address is read from
     `process.env.NEXT_PUBLIC_VOTING_FACTORY_ADDRESS`, don't hardcode it).
4. If any ABI signature the frontend calls changed (function/event name, args, or
   the `VotingCreated` event shape), grep the components/hooks in `next-env/` for the
   affected names and update the call sites.
5. Run `pnpm lint` in `next-env/` to catch type breakage.
