"use client";

import { type SyntheticEvent } from "react";
import { useWriteContract } from "wagmi";
import { votingFactoryConfig } from "@/constants/votingFactory";
import { InputFieldgroup } from "./InputFieldGroup";
import BlockchainSubmit from "./BlockchainSubmit";

const errorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    if ("shortMessage" in error && typeof error.shortMessage === "string") {
      return error.shortMessage;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return "Unknown error";
};

const DeployContract = () => {
  // Submit the deployment tx
  const {
    mutate: writeContract,
    data: hash,
    isPending,
    error: submitError,
    reset,
  } = useWriteContract();

  const started = isPending || Boolean(hash) || Boolean(submitError);

  const inputLabel = "Voting Session Name";

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    const name =
      new FormData(e.currentTarget as HTMLFormElement)
        .get(inputLabel)
        ?.toString() ?? "";
    // Deploy + register a new Voting via the factory (caller becomes its owner).
    writeContract({
      ...votingFactoryConfig,
      functionName: "createVoting",
      args: [name],
    });
  };

  // Idle: show the form.
  if (!started) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <InputFieldgroup
          name={inputLabel}
          placeholder="My first voting session"
          description="Give a name to your voting session : 20 characters max"
          required
          minLength={1}
          maxLength={20}
          pattern="^(?!\s)[A-Za-z0-9][A-Za-z0-9 ._\-]*"
        />
      </form>
    );
  }

  return (
    <>
      <BlockchainSubmit hash={hash} submitError={submitError} reset={reset} />
    </>
  );
};

export default DeployContract;
