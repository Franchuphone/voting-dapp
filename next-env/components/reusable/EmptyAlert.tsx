import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertOctagonIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const EmptyAlert = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <Alert variant="destructive" className={cn("m-auto w-fit p-6", className)}>
      <AlertOctagonIcon className="size-10" />
      <AlertTitle className="text-2xl">{text}</AlertTitle>
    </Alert>
  );
};

export default EmptyAlert;
