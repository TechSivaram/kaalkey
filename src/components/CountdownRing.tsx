import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { styles } from "../styles/home.styles";

type CountdownRingProps = {
  secondsRemaining: number;
  period: number;
};

export default function CountdownRing({ secondsRemaining, period }: CountdownRingProps) {
  const [pulse] = useState(() => new Animated.Value(1));
  const progress = secondsRemaining / Math.max(1, period);
  const countdownColor = secondsRemaining <= 5 ? "#D94841" : "#138808";

  useEffect(() => {
    pulse.setValue(0.94);
    Animated.timing(pulse, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [secondsRemaining, pulse]);

  return (
    <Animated.View
      style={[styles.countdownRing, { transform: [{ scale: pulse }] }]}
      accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
    >
      {Array.from({ length: 24 }, (_, index) => {
        const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
        const radius = 23;
        const segmentProgress = Math.max(0, Math.min(1, progress * 24 - index));
        return (
          <View
            key={index}
            style={[
              styles.countdownDot,
              {
                left: 27 + Math.cos(angle) * radius - 2,
                top: 27 + Math.sin(angle) * radius - 2,
                backgroundColor: segmentProgress > 0 ? countdownColor : "#CBD3DE",
                opacity: segmentProgress > 0 ? 0.35 + segmentProgress * 0.65 : 0.58,
                transform: [{ scale: segmentProgress > 0 ? 0.82 + segmentProgress * 0.18 : 0.82 }],
              },
            ]}
          />
        );
      })}
      <Animated.Text
        style={[styles.countdownNumber, { color: secondsRemaining <= 5 ? "#D94841" : "#172033" }]}
      >
        {secondsRemaining}
      </Animated.Text>
    </Animated.View>
  );
}
