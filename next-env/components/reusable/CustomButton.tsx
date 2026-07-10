import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CustomButton = ({
  path,
  text,
  variant,
  onClick,
}: {
  path: string;
  text: string;
  variant?:
    | "link"
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive";
  onClick?: () => void;
}) => {
  const router = useRouter();
  return (
    <Button
      type="button"
      onClick={() => {
        onClick?.();
        router.push(path);
      }}
      variant={variant}
      className="h-auto self-start px-4 py-2 text-xl"
    >
      {text}
    </Button>
  );
};

export default CustomButton;
