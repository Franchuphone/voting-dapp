# 🗳️ Voting DApp

A full-stack decentralized voting platform built around a Solidity `Voting` contract
and a `VotingFactory`. Anyone can spin up a new on-chain voting session, register
voters, collect proposals, run a voting round, and tally the winner — all from a
modern web UI.

The repo is a two-workspace monorepo:

| Workspace       | Stack                                                                 | Purpose                                              |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| `hardhat-env/`  | Hardhat 3 · Solidity 0.8.28 · viem · OpenZeppelin · Foundry + node:test | Smart contracts, tests, and deployment (Ignition)    |
| `next-env/`     | Next.js 16 · React 19 · wagmi 3 · Reown AppKit · viem · shadcn/ui · Tailwind 4 | Web frontend that talks to the deployed contracts    |

---

## Contracts

### `Voting.sol`
An `Ownable` voting contract that walks through a fixed workflow:

```
RegisteringVoters
  → ProposalsRegistrationStarted
  → ProposalsRegistrationEnded
  → VotingSessionStarted
  → VotingSessionEnded
  → VotesTallied
```

- **Owner** registers voters (`addVoter`) and drives the workflow state transitions.
- **Registered voters** submit proposals (`addProposal`) and cast a single vote (`setVote`).
- `tallyVotes()` computes `winningProposalID` once the session ends.

### `VotingFactory.sol`
Deploys `Voting` contracts on demand and keeps an on-chain registry:

- `createVoting(name)` deploys a new `Voting`, transfers ownership to the caller,
  records it in `deployments(index)`, and emits `VotingCreated(index, voting, creator, name)`.
- The frontend lists sessions by reading `VotingCreated` logs (a single `getLogs` call),
  then uses the emitted `index` as a stable key into the registry.

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) (both workspaces use pnpm lockfiles)

### 1. Contracts (`hardhat-env/`)

```bash
cd hardhat-env
pnpm install

# Run the full test suite (Solidity + node:test)
npx hardhat test
npx hardhat test solidity   # Foundry-style Solidity tests only
npx hardhat test nodejs     # TypeScript integration tests only
```

**Deploy the factory to a local node**

```bash
# Terminal 1 — start a local chain (chainId 31337)
npx hardhat node

# Terminal 2 — deploy the factory
npx hardhat ignition deploy ignition/modules/VotingFactory.ts --network localnode
```

**Deploy to Sepolia**

```bash
# Provide the RPC URL and a funded private key as config variables
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY

npx hardhat ignition deploy ignition/modules/VotingFactory.ts --network sepolia
```

### 2. Frontend (`next-env/`)

```bash
cd next-env
pnpm install

# Copy the example env and fill in your values
cp .env.example .env.local

pnpm dev          # http://localhost:3000  (webpack)
pnpm dev:turbo    # Turbopack variant
```

---

## Environment variables (`next-env/.env.local`)

| Variable                                    | Description                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_PROJECT_ID`                    | [Reown / WalletConnect](https://cloud.reown.com) project ID        |
| `NEXT_PUBLIC_INFURA_SEPOLIA`                | Sepolia RPC URL (Infura, Alchemy, …)                               |
| `NEXT_PUBLIC_VOTING_FACTORY_ADDRESS`        | Deployed `VotingFactory` address for the target network            |
| `NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK` | Block the factory was deployed at (bounds the `getLogs` scan)      |
| `NEXT_PUBLIC_APP_URL`                        | (optional) Pins the wallet-metadata origin                         |

> ⚠️ **Never commit real keys.** `.env.local` is git-ignored; only `.env.example`
> (with placeholder values) belongs in version control.

---

## How the app works

1. **Connect a wallet** via the Reown AppKit modal (Sepolia + local Hardhat networks).
2. **Create a voting session** — calls `VotingFactory.createVoting(name)`; you become its owner.
3. **Dashboard** lists every session from the factory's `VotingCreated` events and shows
   your role (owner / voter) per session.
4. **Run the workflow** — register voters, open proposals, vote, and tally, each step
   gated by the contract's `WorkflowStatus`.

Contract ABIs/addresses consumed by the frontend live in `next-env/constants/`
(`voting.ts`, `votingFactory.ts`) and are extracted from the Hardhat build artifacts.

---

## Project layout

```
.
├── hardhat-env/            # Smart contracts & tooling
│   ├── contracts/          # voting.sol, votingFactory.sol (+ Foundry tests)
│   ├── ignition/modules/   # Ignition deployment modules
│   ├── test/               # node:test integration tests
│   └── hardhat.config.ts
├── next-env/               # Next.js frontend
│   ├── app/                # App Router pages & providers
│   ├── components/         # UI (connection, deploy, layout, reusable)
│   ├── constants/          # Contract ABIs + addresses
│   └── utils/              # viem client & chain config
└── .claude/                # Claude Code skills & slash commands for this repo
```

## License

MIT
