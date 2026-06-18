import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { View } from "react-native";
import { Text } from "./text";

const badgeVariants = cva(
  "flex-row items-center justify-center gap-1.5 self-start rounded-lg px-2.5 py-1",
  {
    variants: {
      variant: {
        default: "bg-zinc-100",
        blue: "bg-sky-50",
        green: "bg-green-50",
        amber: "bg-amber-50",
        red: "bg-red-50",
        purple: "bg-violet-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("text-xs font-semibold", {
  variants: {
    variant: {
      default: "text-zinc-700",
      blue: "text-sky-700",
      green: "text-green-700",
      amber: "text-amber-700",
      red: "text-red-700",
      purple: "text-violet-700",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BadgeProps = React.ComponentProps<typeof View> &
  VariantProps<typeof badgeVariants> & {
    children: React.ReactNode;
  };

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {typeof children === "string" ? (
        <Text className={badgeTextVariants({ variant })}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Badge, badgeVariants, badgeTextVariants };
export type { BadgeProps };
