# 📝 Résumé des modifications

## Modifications du contrat `Voting`

Plusieurs corrections de sécurité et de robustesse ont été apportées à `voting.sol` :

- **DOS out of gas** : l'ancien `tallyVotes()` bouclait sur tout
  le tableau des propositions (coût en gaz non borné : un votant pouvait rendre le
  dépouillement impossible). Le gagnant est désormais calculé **de façon incrémentale
  dans `setVote()`**, ce qui rend `tallyVotes()` en coût constant (O(1)).
- **Départage déterministe des égalités** : en cas d'égalité, c'est toujours la
  proposition d'**indice le plus bas** qui l'emporte, indépendamment de l'ordre des votes.
- **Rejet des propositions en double** : un `mapping` de hachages empêche d'enregistrer
  deux fois la même description (vérification en O(1), sans boucle).
- **Vote blanc** : l'ancienne proposition technique « GENESIS » (indice 0) est remplacée
  par une véritable option **« BLANK VOTE »** (abstention), dont le hachage est réservé.
- **address(0) Guard** : `addVoter()` refuse l'adresse `0x0`.
- **Protection « au moins une vraie proposition »** : `endProposalsRegistering()` refuse de
  clôturer l'enregistrement s'il n'existe aucune proposition réelle (hors vote blanc).
- **Protection « au moins un vote »** : `endVotingSession()` refuse de clôturer la session
  si aucun vote n'a été émis (compteur `totalVotes`).

## Création de la `VotingFactory`

(`votingFactory.sol`) a été ajoutée : `createVoting(name)`
déploie un nouveau contrat `Voting`, en transfère la propriété à l'appelant, l'enregistre
dans un registre on-chain (`deployments(index)`) et émet l'événement
`VotingCreated(index, voting, creator, name)`. Le frontend liste les sessions en lisant
ces événements en un seul appel `getLogs`.

## Utilisation de Claude

L'assistant **Claude (Claude Code)** a été utilisé pour :

- **Réécrire les tests vers `viem`** : migration de la suite de test depuis
  Mocha + ethers vers **viem + `node:test`**
- **Générer et exécuter les tests automatiquement** : écriture des cas de test,
  compilation et lancement de la suite complète.
- **Valider chaque modification** : après chaque correction ci-dessus, la suite de tests
  a été exécutée pour vérifier la non-régression (dont un test « crash » prouvant que le
  dépouillement reste à coût constant jusqu'à 10 000 propositions).
- **Automatisation backend** : déploiement et redéploiement de la factory sur diverses blockchains
  à travers des appels de commandes
- **Natspec** : entièrement automatisé, juste relu
- **Correction des hooks wagmi** : devant la complexité ( à mon niveau ) de certains hooks
  employé dans des composants comme RoleGuard, et leur bonne utilisation en contexte
- **Automatisation frontend** : une fois le design fixé, il m'a permis de l'appliquer
  et le reproduire rapidement sur de nouveaux composants
- **Animations** : la complexité de codage de certains effets animés s'en retrouvent
  totalement diminués, en le corrigeant et le freinant (overkill coding)
- **Réorganisation du repo** : après des heures de travail, l'arborescence commencait
  un peu à déraper, Claude m'a permis sans effort de tout organiser clairement
- **Déploiement** : skills intégrés à Vercel pour un réglage facilité

---

# 🗳️ Voting DApp

A full-stack decentralized voting platform built around a Solidity `Voting` contract
and a `VotingFactory`. Anyone can spin up a new on-chain voting session, register
voters, collect proposals, run a voting round, and tally the winner — all from a
modern web UI.

The repo is a two-workspace monorepo:

| Workspace      | Stack                                                                          | Purpose                                           |
| -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `hardhat-env/` | Hardhat 3 · Solidity 0.8.28 · viem · OpenZeppelin · Foundry + node:test        | Smart contracts, tests, and deployment (Ignition) |
| `next-env/`    | Next.js 16 · React 19 · wagmi 3 · Reown AppKit · viem · shadcn/ui · Tailwind 4 | Web frontend that talks to the deployed contracts |

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

| Variable                                    | Description                                                   |
| ------------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_PROJECT_ID`                    | [Reown / WalletConnect](https://cloud.reown.com) project ID   |
| `NEXT_PUBLIC_INFURA_SEPOLIA`                | Sepolia RPC URL (Infura, Alchemy, …)                          |
| `NEXT_PUBLIC_VOTING_FACTORY_ADDRESS`        | Deployed `VotingFactory` address for the target network       |
| `NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK` | Block the factory was deployed at (bounds the `getLogs` scan) |
| `NEXT_PUBLIC_APP_URL`                       | (optional) Pins the wallet-metadata origin                    |

> ⚠️ **Never commit real keys.** `.env.local` is git-ignored; only `.env.example`
> (with placeholder values) belongs in version control.

---

## How the app works

1. **Connection guard** keeps all app restricted behind a wallet connection mandatory
2. **Connect a wallet** via the Reown AppKit modal (Sepolia + local Hardhat networks) button on the homepage
3. **New voting session** calls `VotingFactory.createVoting(name)`; you become its owner
4. **Dashboard** lists every session from the factory's `VotingCreated` where connected wallet has a role (Admin or voter),
   keeps the others "private"
5. **Role guard** keeps a voting session private by restricting access uniquely to wallets having a role
6. **Run the workflow** register voters, open proposals, vote, and tally, each step
   gated by the contract's `WorkflowStatus`, each action not displayed or blocked if conditions not met
7. **Independent display** keeps admin and voters actions commands displayed depending on wallet roles

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
│   └── constants/          # Contract ABIs + addresses
└── .claude/                # Claude Code skills & slash commands for this repo
```

## License

MIT
