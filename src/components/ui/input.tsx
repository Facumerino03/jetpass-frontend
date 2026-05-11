import { cn } from "@/lib/utils";
import * as React from "react";
import { Platform, TextInput } from "react-native";

function Input({
  className,
  placeholderTextColor,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        "border-input bg-background text-foreground h-12 rounded-md border px-3 text-base",
        "placeholder:text-muted-foreground",
        props.editable === false && "opacity-50",
        Platform.select({
          web: "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
        }),
        className,
      )}
      placeholderTextColor={placeholderTextColor ?? "hsl(240 3.8% 46.1%)"}
      {...props}
    />
  );
}

export { Input };
