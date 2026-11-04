import { memo, useEffect, useMemo, useState } from "react";
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

// Static styles are shared across countdown renders.
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

type RingSegmentProps = {
  x: number;
  y: number;
  radius: number;
  fill: string;
  opacity: number;
};

// Most ring dots keep identical visual props between one-second updates.
// Memoization lets React Native SVG skip those unchanged Circle components.
const RingSegment = memo(function RingSegment({ x, y, radius, fill, opacity }: RingSegmentProps) {
  return <Circle cx={x} cy={y} r={radius} fill={fill} opacity={opacity} />;
});

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

  // Split progress into completed dots and one fractional dot. The completed
  // dot layout changes only when progress crosses a segment boundary, not on
  // every one-second countdown update.
  const segmentPosition = Math.max(0, Math.min(SEGMENT_COUNT, progress * SEGMENT_COUNT));
  const completedSegments = Math.floor(segmentPosition);
  const partialProgress = segmentPosition - completedSegments;
  const hasPartialSegment = partialProgress > 0;
  const partialSegment =
    completedSegments < SEGMENT_COUNT ? RING_SEGMENTS[completedSegments] : undefined;

  // Keep the 23 unaffected SVG elements (plus the inactive partial slot when
  // needed) stable between ticks. React receives the same children array until
  // a segment boundary or warning-color change occurs.
  const staticSegments = useMemo(
    () =>
      RING_SEGMENTS.map(({ x, y }, index) => {
        const isPartialSegment = index === completedSegments && hasPartialSegment;
        if (isPartialSegment) return null;

        const active = index < completedSegments;
        return (
          <RingSegment
            key={index}
            x={x}
            y={y}
            radius={DOT_RADIUS * (active ? 1 : 0.82)}
            fill={active ? countdownColor : "#CBD3DE"}
            opacity={active ? 1 : 0.58}
          />
        );
      }),
    [completedSegments, hasPartialSegment, countdownColor],
  );

  return (
    <Animated.View
      style={[styles.countdownRing, dynamicStyles.pulse, RING_CONTAINER_ALIGNMENT_STYLE]}
      accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
    >
      <Svg width={54} height={54} viewBox="0 0 54 54">
        {staticSegments}
        {partialSegment && hasPartialSegment ? (
          <RingSegment
            x={partialSegment.x}
            y={partialSegment.y}
            radius={DOT_RADIUS * (0.82 + partialProgress * 0.18)}
            fill={countdownColor}
            opacity={0.35 + partialProgress * 0.65}
          />
        ) : null}
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
