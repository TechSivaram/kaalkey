import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { styles } from "../styles/home.styles";
import { COUNTDOWN_RING_ANIMATION_DURATION_MS } from "../constants/ui";
import { COLORS } from "../constants/colors";
import { getCountdownDynamicStyles, getCountdownSegmentStyle } from "../styles/component.styles";

type CountdownRingProps = {
  secondsRemaining: number;
  period: number;
};

export default function CountdownRing({ secondsRemaining, period }: CountdownRingProps) {
  const [pulse] = useState(() => new Animated.Value(1));
  const progress = secondsRemaining / Math.max(1, period);
  const countdownColor = secondsRemaining <= 5 ? COLORS.danger : COLORS.indiaGreen;
  const dynamicStyles = getCountdownDynamicStyles(
    pulse,
    secondsRemaining <= 5 ? COLORS.danger : COLORS.textPrimary,
  );

  useEffect(() => {
    pulse.setValue(0.94);
    Animated.timing(pulse, {
      toValue: 1,
      duration: COUNTDOWN_RING_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [secondsRemaining, pulse]);

  return (
    <Animated.View
      style={[styles.countdownRing, dynamicStyles.pulse]}
      accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
    >
      {Array.from({ length: 24 }, (_, index) => {
        const segmentStyle = getCountdownSegmentStyle(index, progress, countdownColor);
        return <View key={index} style={[styles.countdownDot, segmentStyle]} />;
      })}
      <Animated.Text style={[styles.countdownNumber, dynamicStyles.countdownNumber]}>
        {secondsRemaining}
      </Animated.Text>
    </Animated.View>
  );
}
