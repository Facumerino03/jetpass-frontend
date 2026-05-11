import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as React from "react";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}

export { Label };
