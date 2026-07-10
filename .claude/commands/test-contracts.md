---
description: Run the Hardhat contract test suite (Solidity + node:test)
---

Run the smart-contract tests in `hardhat-env/`.

1. `cd hardhat-env`
2. Run `npx hardhat test` (or `npx hardhat test solidity` / `npx hardhat test nodejs`
   if the user asked to scope it).
3. Summarize pass/fail counts and surface any failing test output verbatim.

If a test fails, investigate the relevant contract in `hardhat-env/contracts/`
and the test in `hardhat-env/test/` before proposing a fix. Do not edit tests to
make them pass unless the test itself is wrong.
