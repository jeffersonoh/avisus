"use client";

import { useLinkStatus } from "next/link";

import { AppIcon, type AppIconName } from "@/components/AppIcon";

type LinkLeadingGlyphProps = {
  iconName?: AppIconName;
  size?: number;
  stroke?: string;
};

export function LinkLeadingGlyph({
  iconName,
  size = 15,
  stroke = "currentColor",
}: LinkLeadingGlyphProps) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid color-mix(in srgb, currentColor 30%, transparent)",
          borderTopColor: "currentColor",
          animation: "navPendingSpin 0.7s linear infinite",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }

  if (!iconName) return null;

  return <AppIcon name={iconName} size={size} stroke={stroke} />;
}

type ButtonSpinnerProps = {
  size?: number;
};

export function ButtonSpinner({ size = 12 }: ButtonSpinnerProps) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid color-mix(in srgb, currentColor 30%, transparent)",
        borderTopColor: "currentColor",
        animation: "navPendingSpin 0.7s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}
