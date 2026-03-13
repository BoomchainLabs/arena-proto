import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useContractTx(successMsg?: string, errorMsg?: string) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { toast } = useToast();

  useEffect(() => {
    if (isSuccess && successMsg) {
      toast({ title: "SUCCESS", description: successMsg });
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      const msg = (error as any)?.shortMessage ?? (error as any)?.message ?? "Transaction failed";
      toast({ title: errorMsg ?? "ERROR", description: msg, variant: "destructive" });
      reset();
    }
  }, [error]);

  return {
    writeContract,
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    reset,
  };
}
