import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { styles } from "../styles/home.styles";
import { COLORS } from "../constants/colors";
import { useTotpClock } from "../services/totp-clock";
import { getTotpCountdown } from "../services/totp-time";

type CountdownRingProps = {
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

// Each dot is encoded as a subpath in one SVG Path. Precompute every possible
// completed/inactive arrangement once so countdown renders create at most two
// compound paths plus the single fractional Circle, rather than 24 Circle nodes.
function createDotPath(start: number, end: number, radius: number) {
  let path = "";
  for (let index = start; index < end; index += 1) {
    const { x, y } = RING_SEGMENTS[index];
    const diameter = radius * 2;
    path += `M ${x - radius} ${y} a ${radius} ${radius} 0 1 0 ${diameter} 0 a ${radius} ${radius} 0 1 0 ${-diameter} 0 `;
  }
  return path.trim();
}

const ACTIVE_DOT_PATHS = Array.from({ length: SEGMENT_COUNT + 1 }, (_, completed) =>
  createDotPath(0, completed, DOT_RADIUS),
);

const INACTIVE_DOT_PATHS = Array.from({ length: SEGMENT_COUNT + 1 }, (_, completed) => [
  createDotPath(completed, SEGMENT_COUNT, DOT_RADIUS * 0.82),
  createDotPath(Math.min(SEGMENT_COUNT, completed + 1), SEGMENT_COUNT, DOT_RADIUS * 0.82),
]);

function CountdownRing({ period }: CountdownRingProps) {
  const now = useTotpClock();
  const { secondsRemaining } = getTotpCountdown(now, period);
  const progress = secondsRemaining / Math.max(1, period);
  const countdownColor = secondsRemaining <= 5 ? COLORS.danger : COLORS.indiaGreen;
  const numberColor = secondsRemaining <= 5 ? COLORS.danger : COLORS.textPrimary;
  // Keep the countdown's color style stable between ticks. The ring itself
  // does not need a per-second native animation to display accurate progress.
  const numberColorStyle = useMemo(() => ({ color: numberColor }), [numberColor]);

  // Split progress into completed dots and one fractional dot. The completed
  // dot layout changes only when progress crosses a segment boundary, not on
  // every one-second countdown update.
  const segmentPosition = Math.max(0, Math.min(SEGMENT_COUNT, progress * SEGMENT_COUNT));
  const completedSegments = Math.floor(segmentPosition);
  const partialProgress = segmentPosition - completedSegments;
  const hasPartialSegment = partialProgress > 0;
  const partialSegment =
    completedSegments < SEGMENT_COUNT ? RING_SEGMENTS[completedSegments] : undefined;

  // The compound path strings are precomputed at module initialization. A
  // countdown render only selects the appropriate strings; it never maps 24
  // segments or creates 24 individual SVG Circle elements.
  const activeDotPath = ACTIVE_DOT_PATHS[completedSegments];
  const inactiveDotPath = INACTIVE_DOT_PATHS[completedSegments][hasPartialSegment ? 1 : 0];

  return (
    <View
      style={[styles.countdownRing, RING_CONTAINER_ALIGNMENT_STYLE]}
      accessibilityLabel={`${secondsRemaining} seconds until code refreshes`}
    >
      <Svg width={54} height={54} viewBox="0 0 54 54">
        {activeDotPath ? <Path d={activeDotPath} fill={countdownColor} /> : null}
        {inactiveDotPath ? <Path d={inactiveDotPath} fill="#CBD3DE" opacity={0.58} /> : null}
        {partialSegment && hasPartialSegment ? (
          <Circle
            cx={partialSegment.x}
            cy={partialSegment.y}
            r={DOT_RADIUS * (0.82 + partialProgress * 0.18)}
            fill={countdownColor}
            opacity={0.35 + partialProgress * 0.65}
          />
        ) : null}
      </Svg>
      <Text style={[styles.countdownNumber, numberColorStyle, COUNTDOWN_TEXT_LAYOUT_STYLE]}>
        {secondsRemaining}
      </Text>
    </View>
  );
}

export default memo(CountdownRing);
