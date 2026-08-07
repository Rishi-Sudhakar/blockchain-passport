import Svg, { Circle, Path, Rect } from "react-native-svg";

interface IconProps {
  color: string;
  active: boolean;
}

export function HomeIcon({ color, active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3a1 1 0 0 0 1-1v-9"
        stroke={color}
        strokeWidth={active ? 2.1 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PassportsIcon({ color, active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={4.5} y={3.5} width={15} height={17} rx={2.5} stroke={color} strokeWidth={active ? 2.1 : 1.7} />
      <Circle cx={12} cy={10} r={2.4} stroke={color} strokeWidth={active ? 2.1 : 1.7} />
      <Path d="M8 17c.5-1.8 2-2.6 4-2.6s3.5.8 4 2.6" stroke={color} strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function CertifyIcon({ color, active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="m9 12 2 2 4.5-5" stroke={color} strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={active ? 2.1 : 1.7} />
    </Svg>
  );
}

export function ProfileIcon({ color, active }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.2} r={3.4} stroke={color} strokeWidth={active ? 2.1 : 1.7} />
      <Path d="M5 19c1-3.4 3.8-5 7-5s6 1.6 7 5" stroke={color} strokeWidth={active ? 2.1 : 1.7} strokeLinecap="round" />
    </Svg>
  );
}
