import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type MenuCardProps = {
  title: string;
  link: string;
  description?: string;
};

const MenuCard = ({ title, link, description }: MenuCardProps) => {
  return (
    <Link href={link}>
      {/* col 1: title over description; col 2: button spanning both rows */}
      <Card className="mb-4 grid grid-cols-[1fr_auto] items-center gap-x-4 p-4 transition-shadow hover:ring-foreground/25">
        <CardTitle className="col-start-1 row-start-1 text-2xl">
          {title}
        </CardTitle>
        {description && (
          <p className="col-start-1 row-start-2 text-muted-foreground">
            {description}
          </p>
        )}
        <Button
          variant="secondary"
          className="col-start-2 row-span-2 self-center"
        >
          <ArrowRight />
        </Button>
      </Card>
    </Link>
  );
};

export default MenuCard;
