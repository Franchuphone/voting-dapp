# Working Log — Voting DApp with Claude Code

*A human-readable recap of how this project was built together with Claude Code.*
*Reconstructed on 2026-07-10 from Claude Code session transcripts.*

> **Note on scope.** Most of this work happened in the sibling repo `Solidity-works`
> (under `6. Dapp/dapp4/` and earlier `AppNextJS/`), which is where the Voting DApp —
> Alyra "Projet3" — was originally developed. This `voting-dapp` repo is the
> continuation/extraction of that work. The detailed session history lives with the
> `Solidity-works` project, not here, which is why this repo started with no memory.

---

## What we were building

A **decentralized voting application**:

- **Smart contracts** — `Voting` and `VotingFactory` in Solidity, with an on-chain
  workflow state machine (registering voters → proposals → voting → tallying) and
  access control (`onlyOwner` / voter-only rules).
- **Backend / tooling** — Hardhat 3, migrated from **Mocha + ethers** to **viem** and
  its TypeScript tooling.
- **Frontend** — a Next.js (App Router) app that reads and writes the voting contracts,
  with wallet connection via **Reown AppKit + wagmi** (earlier: RainbowKit), deployed
  to production with contract addresses tracked across deployments.

---

## Timeline (June 26 → July 10, 2026)

| Date | Focus of the session |
|------|----------------------|
| **Jun 26** | Project scaffolding; wiring RPC config (Infura/`INFURA_URL`), first frontend edits. |
| **Jun 27** | You'd hand-modified the ethers/viem setup and told me *"it's working, don't touch it."* Big task: **refactor the whole Hardhat test suite from Mocha+ethers to viem** + the TS tooling to match. |
| **Jun 28** | Next.js + Tailwind troubleshooting (`globals.css` unknown utility, the `!` important fix); confirmed a "bug" was actually fine once deployed. |
| **Jun 29** | UI polish: number formatting (`toFixed`), button sizing, and an **animation that pushes the Connect button to the top once a user connects** (centered when disconnected). |
| **Jul 1** | Bug-fixing pass "one by one with explanations"; added a **dark theme with a toggle + auto-switch on browser preference**; fixed a controlled/uncontrolled input warning; typography and input/button sizing. |
| **Jul 2** | Tried to port the web3 frontend setup into a new project (`dapp4/frontend`) from a saved config. It went sideways — *"nothing is working, stop and revert all you've done."* Ended in a full revert. |
| **Jul 8** | The **big one** (~55 exchanges). Mouse-glow effect, Lucide vote icon as logo + favicon, theme-switch hang fixes, package upgrades after RainbowKit, wagmi fixes for production (env defined server-side), ABI+bytecode extraction, **tracking all deployed contracts**, dropping the local Hardhat node for factory deployment, investigating a webpack full-reload-on-fast-refresh issue, and starting a **multi-role (admin / voter)** model. |
| **Jul 10** | Responsive buttons → icons under 800px, fixed a `<section>`-inside-`<html>` hydration error, restyled `formatReturnedData` as a button, extracted a reusable **Home button** onto the voting pages, made **Reown follow MetaMask account switches** live, and improved hover/outline visibility for buttons & links in both themes. |

---

## How you like to work (patterns I noticed)

These are now saved to my project memory so future sessions start with them:

1. **Don't erase in-progress work.** When you're mid-refactor, fix the specific thing —
   don't rewrite a file wholesale and collapse your structure. This came up hard on
   `WalletButton.tsx` (your deliberate two-button split got flattened) and echoes through
   many *"revert / rewind / reverse all"* moments.

2. **Show changes in one block before applying.** You repeatedly asked to see all proposed
   edits together so you can review and confirm them, and to have modifications explained.
   You value staying in control of the codebase.

3. **Validation has two layers.** Frontend checks are **UX only** — they stop "idiotic"
   mistakes. Anything genuinely harmful must be blocked in the **backend and/or on-chain**
   (`require`/`revert`, role checks). Never weaken the contract-side guard because the UI
   already checks it.

4. **You drive the architecture.** You'd already chosen viem over ethers, AppKit over
   RainbowKit, and env-vars defined server-side in prod — and you expect me to respect
   those decisions rather than re-litigate them.

---

## Where things stood on Jul 10

- Contracts (`Voting` / `VotingFactory`) and a deployed-contract tracking approach in place.
- Frontend on Next.js App Router with Reown AppKit + wagmi, dark/light theming, responsive
  buttons, reusable navigation (Home button), and live wallet-account syncing.
- Open threads carried into this repo: the **multi-role (admin/voter)** model, deployment
  flow (local node was dropped in favour of a real network), and the webpack fast-refresh
  full-reload investigation.

*This log is a reconstruction from session transcripts, not a substitute for git history.
For exact code changes, see the commits.*
