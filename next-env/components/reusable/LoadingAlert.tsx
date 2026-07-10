import { Alert, AlertTitle } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const LoadingAlert = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <Alert className={cn("m-auto w-fit p-6", className)}>
      <Loader2Icon className="size-10 animate-spin" />
      <AlertTitle className="text-2xl">{text}</AlertTitle>
    </Alert>
  );
};

export default LoadingAlert;
