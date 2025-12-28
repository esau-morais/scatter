import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  colorVariation: string;
  Icon: ElementType;
  description: string;
  cta: string;
}

export const BentoGrid = ({
  children,
  className,
  ...props
}: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  name,
  className,
  colorVariation,
  Icon,
  description,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-(--card-color)/30 hover:bg-card/80",
      className,
    )}
    style={{ "--card-color": colorVariation } as CSSProperties}
    {...props}
  >
    <div>
      <div className="absolute inset-0 bg-linear-to-br from-(--card-color)/20 via-transparent to-transparent" />
    </div>
    <div className="p-6">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-3 transition-all duration-300 lg:group-hover:-translate-y-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-(--card-color)/10 text-(--card-color) transition-all duration-300 group-hover:bg-(--card-color) group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>

    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-(--card-color)/5" />
  </div>
);
