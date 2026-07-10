"use client";

import { votingAbi } from "@/constants/voting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2Icon, SendIcon } from "lucide-react";
import { useConnection, useReadContract } from "wagmi";
import { isAddress } from "viem";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type ReadCallCardProps = {
  address: `0x${string}`;
  functionName:
    | "owner"
    | "getOneProposal"
    | "getVoter"
    | "winningProposalID"
    | "workflowStatus";
  label?: string;
  description: string;
  disabled?: boolean;
  pattern?: RegExp;
};

// Flatten a read result (bigint or struct) into a display string.
const formatReturnedData = (v: unknown): string => {
  let formattedData = "";
  if (v === undefined || v === null) return "";
  if (typeof v === "bigint") formattedData = v.toString();
  if (typeof v === "object") {
    for (const [key, value] of Object.entries(v)) {
      switch (key) {
        case "description":
          formattedData += `\nProposal\n${value}\n`;
          break;
        case "voteCount":
          formattedData += `\nNumber of votes\n${value}\n`;
          break;
        case "isRegistered":
          formattedData += `\nVoter registered\n${value ? "Yes" : "No"}\n`;
          break;
        case "hasVoted":
          formattedData += `\nVoter has voted\n${value ? "Yes" : "No"}\n`;
          break;
        case "votedProposalId":
          formattedData += `\nFor Proposal\n${value == 0 ? "---" : value}\n`;
          break;
        default:
          return formattedData;
      }
    }
  }
  return formattedData;
};

// A single Voting read call: an arg input plus a button that shows the result in a dialog.
const ReadCallCard = ({
  address,
  functionName,
  label,
  description,
  disabled,
  pattern,
}: ReadCallCardProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState("");
  const { address: userAddress } = useConnection();

  const invalidInput = pattern ? !pattern.test(value) : false;

  // getVoter takes an address, getOneProposal a uint; the rest take no arg.
  const callArg: `0x${string}` | bigint | undefined = isAddress(value)
    ? value
    : /^\d+$/.test(value)
      ? BigInt(value)
      : undefined;

  const {
    data,
    isFetching: isConfirming,
    refetch,
  } = useReadContract({
    address,
    abi: votingAbi,
    functionName,
    account: userAddress,
    args: callArg !== undefined ? [callArg] : undefined,
    query: { enabled: label ? false : true },
  });

  async function handleClick() {
    const { error } = await refetch();
    if (error) {
      toast.error(
        `An error occured during your query process\nPlease check your request`,
        {
          id: `read-error-${functionName}`,
        },
      );
    } else {
      dialogRef.current?.showModal();
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="flex gap-4 items-center">
          <CardDescription className="w-full text-left text-2xl">
            {label ? (
              <Input
                aria-invalid={value.length > 0 && invalidInput}
                disabled={disabled || isConfirming}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={description}
                className="font-semibold"
              />
            ) : (
              <span className="font-extrabold">{description}</span>
            )}
          </CardDescription>
          {label ? (
            <Button
              className="w-1/5 justify-self-end font-extrabold"
              aria-label={label}
              disabled={disabled || isConfirming || invalidInput}
              onClick={handleClick}
            >
              {isConfirming ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <>
                  {/* Icon-only under 800px, label text at/above */}
                  <SendIcon className="min-[800px]:hidden" />
                  <span className="hidden min-[800px]:inline">{label}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="pointer-events-none h-auto py-2 text-4xl w-1/5 justify-self-end font-extrabold"
              tabIndex={-1}
            >
              {formatReturnedData(data)}
            </Button>
          )}
        </CardContent>
      </Card>
      <dialog
        ref={dialogRef}
        className="m-auto max-w-lg rounded-xl bg-card p-10 text-card-foreground ring-1 ring-foreground/10 backdrop:bg-black/50"
      >
        <p className="mb-2 text-sm text-muted-foreground">{label}</p>
        <pre className="mb-6 font-mono text-2xl break-all whitespace-pre-wrap">
          {formatReturnedData(data)}
        </pre>
        <Button
          onClick={() => {
            dialogRef.current?.close();
            setValue("");
          }}
        >
          Close
        </Button>
      </dialog>
    </>
  );
};

export default ReadCallCard;
