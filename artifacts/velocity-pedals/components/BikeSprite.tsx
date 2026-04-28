import React from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  frame?: string;
  rider?: string;
};

export function BikeSprite({
  size = 64,
  color = "#c6ff3a",
  frame = "#0a0e27",
  rider = "#ffffff",
}: Props) {
  const w = size;
  const h = size;
  return (
    <Svg width={w} height={h} viewBox="0 0 64 64">
      {/* Wheels */}
      <Circle
        cx={14}
        cy={48}
        r={10}
        stroke={color}
        strokeWidth={2.5}
        fill="transparent"
      />
      <Circle cx={14} cy={48} r={2} fill={color} />
      <Circle
        cx={50}
        cy={48}
        r={10}
        stroke={color}
        strokeWidth={2.5}
        fill="transparent"
      />
      <Circle cx={50} cy={48} r={2} fill={color} />

      {/* Frame */}
      <Path
        d="M14 48 L30 28 L46 28 L50 48 M30 28 L42 48 M30 28 L24 48"
        stroke={frame}
        strokeWidth={3}
        fill="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Handlebars */}
      <Line
        x1={42}
        y1={28}
        x2={50}
        y2={22}
        stroke={frame}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Line
        x1={50}
        y1={22}
        x2={56}
        y2={22}
        stroke={frame}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Seat */}
      <Line
        x1={26}
        y1={26}
        x2={32}
        y2={26}
        stroke={frame}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Rider body */}
      <Path
        d="M30 18 L34 26 L42 22"
        stroke={rider}
        strokeWidth={3.5}
        fill="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Helmet */}
      <Circle cx={30} cy={14} r={5} fill={rider} />
      <Path
        d="M27 14 Q30 9 33 14"
        stroke={color}
        strokeWidth={2}
        fill="transparent"
      />
    </Svg>
  );
}
