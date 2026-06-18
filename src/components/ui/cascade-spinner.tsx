import * as React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

const FRAMES = [
  "⠀⠀⠀⠀",
  "⠀⠀⠀⠀",
  "⠁⠀⠀⠀",
  "⠋⠀⠀⠀",
  "⠞⠁⠀⠀",
  "⡴⠋⠀⠀",
  "⣠⠞⠁⠀",
  "⢀⡴⠋⠀",
  "⠀⣠⠞⠁",
  "⠀⢀⡴⠋",
  "⠀⠀⣠⠞",
  "⠀⠀⢀⡴",
  "⠀⠀⠀⣠",
  "⠀⠀⠀⢀",
];
const INTERVAL = 60;

interface CascadeSpinnerProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function CascadeSpinner({ size = 24, color = "#fff", style }: CascadeSpinnerProps) {
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setFrame((i) => (i + 1) % FRAMES.length), INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>
      <Text
        style={{
          fontSize: size,
          color,
          textAlign: "center",
          lineHeight: size * 1.3,
        }}
      >
        {FRAMES[frame]}
      </Text>
    </View>
  );
}
