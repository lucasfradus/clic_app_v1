// Isotipo como watermark posicionado (port de components/brand/Watermark.tsx).
import { Image, View } from 'react-native';
import { brandAssets } from '../../theme';

type Color = 'white' | 'black' | 'accent';

interface Props {
  color?: Color;
  size?: number;
  opacity?: number;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
  inline?: boolean;
}

const srcMap = {
  white: brandAssets.isoWhite,
  black: brandAssets.isoBlack,
  accent: brandAssets.isoAccent,
} as const;

export default function Watermark({
  color = 'white',
  size = 180,
  opacity = 0.07,
  position = { bottom: -24, right: -24 },
  inline = false,
}: Props) {
  if (inline) {
    return (
      <Image
        source={srcMap[color]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        zIndex: 0,
        ...position,
      }}
    >
      <Image
        source={srcMap[color]}
        style={{ width: size, height: size, opacity }}
        resizeMode="contain"
      />
    </View>
  );
}
