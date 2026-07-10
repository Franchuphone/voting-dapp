---
name: voting-dapp
description: Domain knowledge for this Voting DApp monorepo — the Voting/VotingFactory contracts, their workflow state machine, and how the Next.js frontend consumes them. Use when working on contracts, deployment, the ABIs in next-env/constants, or any UI that reads/writes the voting contracts.
---

# Voting DApp

Two-workspace monorepo:

- **`hardhat-env/`** — Solidity contracts (Hardhat 3, solc 0.8.28, viem, OpenZeppelin,
  Foundry + node:test). Networks in `hardhat.config.ts`: `hardhatMainnet`, `hardhatOp`,
  `localnode` (chainId 31337, manual mining), `sepolia`.
- **`next-env/`** — Next.js 16 / React 19 frontend. Wallet + chain via **Reown AppKit**
  (`app/AppKitProvider.tsx`) over **wagmi 3** + **viem**. UI is shadcn/ui + Tailwind 4.

## Contracts

### `Voting` (`hardhat-env/contracts/voting.sol`)
`Ownable`. Drives a linear `WorkflowStatus` state machine:
`RegisteringVoters → ProposalsRegistrationStarted → ProposalsRegistrationEnded →
VotingSessionStarted → VotingSessionEnded → VotesTallied`.

- Owner-only: `addVoter`, `startProposalsRegistering` (pushes a "GENESIS" proposal at
  index 0), `endProposalsRegistering`, `startVotingSession`, `endVotingSession`, `tallyVotes`.
- Voter-only (`onlyVoters`): `addProposal`, `setVote` (one vote each), `getVoter`,
  `getOneProposal`.
- `tallyVotes` sets `winningProposalID`. Each transition emits `WorkflowStatusChange`.

### `VotingFactory` (`hardhat-env/contracts/votingFactory.sol`)
- `createVoting(name)` → deploys a `Voting`, transfers ownership to `msg.sender`,
  records `deployments(index)`, emits `VotingCreated(index, voting, creator, name)`.
- The frontend enumerates sessions via `VotingCreated` logs (one `getLogs` bounded by
  `NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK`), then reads `deployments(index)`.

## Frontend integration points
- ABIs/config: `next-env/constants/voting.ts` (`votingAbi`) and
  `next-env/constants/votingFactory.ts` (`votingFactoryConfig` — address from
  `NEXT_PUBLIC_VOTING_FACTORY_ADDRESS`, never hardcoded).
- Chain/RPC: `utils/sepolia.ts`, `utils/client.ts`.
- Per-session role detection uses `getVoter` with `account: address`: because `getVoter`
  is `onlyVoters` (checks `msg.sender`), a successful read means the address is a
  registered voter on that session (see `app/dashboard/page.tsx`).

## Conventions
- After changing a contract, recompile and re-sync the ABIs into `next-env/constants/`
  (see the `/sync-contracts` command), then check the wagmi call sites.
- Env lives in `next-env/.env.local` (git-ignored); `.env.example` holds placeholders.
- Local deploy address is written to
  `hardhat-env/ignition/deployments/chain-31337/deployed_addresses.json`.
- Available slash commands: `/test-contracts`, `/deploy-local`, `/deploy-sepolia`,
  `/sync-contracts`.
