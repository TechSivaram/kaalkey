import { useEffect, useMemo, useState } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { styles } from "../styles/home.styles";
import { COUNTDOWN_RING_ANIMATION_DURATION_MS } from "../constants/ui";
import { COLORS } from "../constants/colors";
import { getCountdownDynamicStyles } from "../styles/component.styles";

type CountdownRingProps = {
  secondsRemaining: number;
  period: number;
};

const SEGMENT_COUNT = 24;
const CENTER = 27;
const RING_RADIUS = 23;
const DOT_RADIUS = 2;

// Ring geometry is static; calculate trigonometry once instead of on every
// countdown tick for every account card.
const RING_SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
  const angle = (index / SEGMENT_COUNT) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * RING_RADIUS,
    y: CENTER + Math.sin(angle) * RING_RADIUS,
  };
});

// Static layout styles are shared across countdown renders.
const RING_CONTAINER_ALIGNMENT_STYLE = {
  alignItems: "center",
  justifyContent: "center",
} as const;

const COUNTDOWN_TEXT_LAYOUT_STYLE = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  textAlign: "center",
  textAlignVertical: "center",
  includeFontPadding: false,
  alignSelf: "center",
  lineHeight: 20,
} as const;

export default function CountdownRing({ secondsRemaining, period }: CountdownRingProps) {
  const [pulse] = useState(() => new Animated.Value(1));
  const progress = secondsRemaining / Math.max(1, period);
  const countdownColor = secondsRemaining <= 5 ? COLORS.danger : COLORS.indiaGreen;
  const numberColor = secondsRemaining <= 5 ? COLORS.danger : COLORS.textPrimary;
  // StyleSheet creation is avoided on every countdown tick; only recreate when
  // the pulse instance or warning color changes.
  const dynamicStyles = useMemo(
    () => getCountdownDynamicStyles(pulse, numberColor),
    [pulse, numberColor],
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
      style={[
        styles.countdownRing,
        dynamicStyles.pulse,
        RING_CONTAINER_ALIGNMENT_STYLE,
      ]}
      accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
    >
      <Svg width={54} height={54} viewBox="0 0 54 54">
        {RING_SEGMENTS.map(({ x, y }, index) => {
          const segmentProgress = Math.max(0, Math.min(1, progress * SEGMENT_COUNT - index));
          const active = segmentProgress > 0;

          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r={DOT_RADIUS * (active ? 0.82 + segmentProgress * 0.18 : 0.82)}
              fill={active ? countdownColor : "#CBD3DE"}
              opacity={active ? 0.35 + segmentProgress * 0.65 : 0.58}
            />
          );
        })}
      </Svg>
      <Animated.Text
        style={[
          styles.countdownNumber,
          dynamicStyles.countdownNumber,
          COUNTDOWN_TEXT_LAYOUT_STYLE,
          { transform: [{ translateY: 0 }] },
        ]}
      >
        {secondsRemaining}
      </Animated.Text>
    </Animated.View>
  );
}
