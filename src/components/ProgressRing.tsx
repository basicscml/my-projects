import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/**
 * Lightweight circular progress indicator built from two half-circle
 * rotations — no SVG dependency needed. `progress` is 0..1.
 */
export function ProgressRing({
  progress,
  size = 52,
  color,
  label,
}: {
  progress: number;
  size?: number;
  color: string;
  label?: string;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const deg = clamped * 360;
  const thickness = Math.max(4, size * 0.12);
  const inner = size - thickness * 2;

  const rightRotate = Math.min(deg, 180);
  const leftRotate = Math.max(deg - 180, 0);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.track,
          { width: size, height: size, borderRadius: size / 2, borderColor: theme.cardAlt, borderWidth: thickness },
        ]}
      />
      {/* Right half */}
      <View style={[styles.half, { width: size, height: size }]}>
        <View
          style={[
            styles.mask,
            { width: size / 2, height: size, left: size / 2, borderTopRightRadius: size / 2, borderBottomRightRadius: size / 2 },
          ]}
        >
          <View
            style={[
              styles.fill,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: thickness,
                borderColor: color,
                left: -size / 2,
                transform: [{ rotate: `${rightRotate}deg` }],
              },
            ]}
          />
        </View>
      </View>
      {/* Left half (only fills past 50%) */}
      {leftRotate > 0 && (
        <View style={[styles.half, { width: size, height: size }]}>
          <View
            style={[
              styles.mask,
              { width: size / 2, height: size, left: 0, borderTopLeftRadius: size / 2, borderBottomLeftRadius: size / 2 },
            ]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: thickness,
                  borderColor: color,
                  left: 0,
                  transform: [{ rotate: `${leftRotate}deg` }],
                },
              ]}
            />
          </View>
        </View>
      )}
      <View style={[styles.center, { width: inner, height: inner }]}>
        <Text style={[styles.label, { color: theme.text, fontSize: size * 0.24 }]}>
          {label ?? `${Math.round(clamped * 100)}%`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute' },
  half: { position: 'absolute', overflow: 'hidden' },
  mask: { position: 'absolute', overflow: 'hidden' },
  fill: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700' },
});
