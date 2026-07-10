"use client";

import { votingAbi } from "@/constants/voting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2Icon, type LucideIcon } from "lucide-react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type WriteCallCardProps = {
  address: `0x${string}`;
  functionName: string;
  args?: readonly unknown[];
  label: string;
  description: string;
  disabled?: boolean;
  icon: LucideIcon;
  pattern?: RegExp;
  toaster: string;
};

const WriteCallCard = ({
  address,
  functionName,
  args,
  label,
  description,
  disabled,
  icon: Icon,
  pattern,
  toaster,
}: WriteCallCardProps) => {
  const {
    mutate: writeContract,
    data: writeData,
    isPending,
    error: writeError,
  } = useWriteContract();

  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  // A pattern means this is an input card; block the call until it matches
  const invalidInput = !!pattern && !pattern.test(value);

  const callArgs = pattern
    ? [/^\d+$/.test(value) ? BigInt(value) : value]
    : args;
  // For Toaster display
  const {
    isLoading: isConfirming,
    isSuccess,
    error,
    status,
  } = useWaitForTransactionReceipt({ hash: writeData });

  useEffect(() => {
    if (!writeData) return;
    if (isConfirming) {
      toast.loading("Transaction is being processed", { id: writeData });
    } else if (isSuccess && status === "success") {
      toast.success(pattern ? toaster : "Transaction confirmed", {
        id: writeData,
      });
      // Reset the input after a confirmed write (reaction to the tx event).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (pattern) setValue("");
      // Refetch all reads so the UI reflects the new on-chain state after this write.
      queryClient.invalidateQueries();
    } else if (error) {
      toast.error(error.message ?? "Transaction aborted", {
        id: writeData,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeData, isConfirming, isSuccess, error, status]);

  // Handle tx reverted before been sent
  useEffect(() => {
    if (writeError) {
      toast.error(
        "shortMessage" in writeError
          ? writeError.shortMessage
          : writeError.message,
        { id: `write-error-${functionName}` },
      );
    }
  }, [writeError, functionName]);

  return (
    <Card className="w-full">
      <CardContent className="flex gap-4 items-center">
        <CardDescription className="w-full text-left text-2xl">
          {pattern ? (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={description}
              className="font-semibold"
              disabled={disabled || isPending || isConfirming}
              aria-invalid={value.length > 0 && invalidInput}
            />
          ) : (
            description
          )}
        </CardDescription>
        <Button
          className="w-1/5 justify-self-end font-extrabold"
          aria-label={label}
          disabled={disabled || isPending || isConfirming || invalidInput}
          onClick={() =>
            writeContract({
              address,
              abi: votingAbi,
              functionName,
              args: callArgs,
            } as never)
          }
        >
          {isPending || isConfirming ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <>
              {/* Icon-only under 800px, label text at/above */}
              <Icon className="min-[800px]:hidden" />
              <span className="hidden min-[800px]:inline">{label}</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WriteCallCard;
