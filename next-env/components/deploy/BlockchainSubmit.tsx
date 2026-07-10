"use client";
import { CheckCircle2, CircleX, Loader2, Send } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { useWaitForTransactionReceipt } from "wagmi";
import { Button } from "../ui/button";
import { BaseError, parseEventLogs } from "viem";
import { useRouter } from "next/navigation";
import CustomButton from "../reusable/CustomButton";
import { votingFactoryConfig } from "@/constants/votingFactory";

const BlockchainSubmit = ({
  hash,
  submitError,
  reset,
}: {
  hash: `0x${string}` | undefined;
  submitError: Error | null;
  reset: () => void;
}) => {
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });
  const error = submitError ?? receiptError;

  // The new Voting address isn't in receipt.contractAddress (this is a factory
  // *call*, not a deploy) — pull it from the VotingCreated event.
  const created =
    isSuccess && receipt
      ? parseEventLogs({
          abi: votingFactoryConfig.abi,
          eventName: "VotingCreated",
          logs: receipt.logs,
        })[0]?.args
      : undefined;

  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className="text-3xl font-semibold">Deploying your voting contract</h2>

      {/* 1 — submitted (hidden once the tx is registered) */}
      {!isSuccess && (
        <Alert>
          {hash ? <Send /> : <Loader2 className="animate-spin" />}
          <AlertTitle className="text-lg">
            {hash ? "Transaction submitted" : "Waiting for wallet confirmation"}
          </AlertTitle>
          <AlertDescription className="break-all">
            {hash
              ? `Tx hash: ${hash}`
              : "Confirm the deployment in your wallet"}
          </AlertDescription>
        </Alert>
      )}

      {/* 2 — in progress */}
      {isConfirming && (
        <Alert>
          <Loader2 className="animate-spin" />
          <AlertTitle className="text-lg">Transaction in progress</AlertTitle>
          <AlertDescription>
            Waiting for the network to validate your transaction
          </AlertDescription>
        </Alert>
      )}

      {/* 3a — registered */}
      {isSuccess && receipt && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle className="text-lg">Transaction registered 🎉</AlertTitle>
          <AlertDescription className="space-y-1 break-all">
            {created && (
              <>
                <div>
                  <b>Voting contract:</b> {created.voting}
                </div>
                <div>
                  <b>Registry index:</b> {created.index.toString()}
                </div>
                <div>
                  <b>Name:</b> {created.name}
                </div>
              </>
            )}
            <div>
              <b>Transaction:</b> {receipt.transactionHash}
            </div>
            <div>
              <b>Block:</b> {receipt.blockNumber.toString()}
            </div>
            <div>
              <b>Gas used:</b> {receipt.gasUsed.toString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 3b — not registered */}
      {error && (
        <Alert variant="destructive">
          <CircleX />
          <AlertTitle className="text-lg">
            Transaction not registered
          </AlertTitle>
          <AlertDescription className="break-all">
            {error instanceof BaseError ? error.shortMessage : error.message}
          </AlertDescription>
        </Alert>
      )}

      {(isSuccess || error) && (
        <div className="flex gap-4 mt-2">
          <CustomButton
            path="/new-vote"
            text="Create more"
            variant="outline"
            onClick={() => reset()}
          />
          <CustomButton path="/dashboard" text="Dashboard" />
        </div>
      )}
    </div>
  );
};

export default BlockchainSubmit;
