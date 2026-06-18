import { cn } from "@/lib/utils";
import * as React from "react";
import { Platform, Pressable, ScrollView, TextInput, View, type PressableProps, type ScrollViewProps, type TextInputProps } from "react-native";
import { Text } from "@/components/ui/text";

function Command({ className, children, ...props }: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-popover shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

const CommandInput = React.forwardRef<
  TextInput,
  TextInputProps & { icon?: React.ReactNode; rightIcon?: React.ReactNode; valueBadge?: React.ReactNode }
>(function CommandInput({ className, icon, rightIcon, valueBadge, onFocus, onBlur, ...props }, ref) {
  const [isFocused, setIsFocused] = React.useState(false);
  const showBadge = valueBadge && !isFocused;

  return (
    <View className="flex-row items-center gap-2 px-3">
      {icon}
      <View className="h-11 flex-1 justify-center">
        <TextInput
          ref={ref}
          className={cn(
            "text-sm text-foreground",
            showBadge ? "opacity-0" : "absolute inset-0 py-3",
            Platform.select({
              web: "outline-none",
            }),
            className,
          )}
          placeholderTextColor="hsl(240 3.8% 46.1%)"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {showBadge ? (
          <View className="absolute left-0 top-0 bottom-0 justify-center" pointerEvents="none">
            {valueBadge}
          </View>
        ) : null}
      </View>
      {rightIcon}
    </View>
  );
});

function CommandSeparator({ className }: { className?: string }) {
  return <View className={cn("h-px bg-border", className)} />;
}

function CommandList({
  className,
  children,
  ...props
}: ScrollViewProps & { children: React.ReactNode }) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      className={cn("max-h-72", className)}
      contentContainerClassName="p-1"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

function CommandGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn("gap-0.5", className)}>{children}</View>;
}

function CommandGroupHeading({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Text className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}>
      {children}
    </Text>
  );
}

function CommandItem({
  className,
  selected,
  children,
  ...props
}: PressableProps & { selected?: boolean; children: React.ReactNode }) {
  return (
    <Pressable
      className={cn(
        "flex-row items-center gap-3 rounded-sm px-2 py-2 active:bg-accent",
        selected ? "bg-accent" : undefined,
        className,
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}

function CommandEmpty({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Text className={cn("px-2 py-6 text-center text-sm text-muted-foreground", className)}>
      {children}
    </Text>
  );
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupHeading,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
