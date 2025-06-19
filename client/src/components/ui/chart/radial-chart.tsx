"use client";

import { useEffect, useState } from "react";

interface RadialChartProps {
  value: number;
  maxValue: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function RadialChart({
  value,
  maxValue,
  label,
  size = 200,
  strokeWidth = 12,
  className = "",
}: RadialChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Calculate the radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / maxValue) * 100;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Animate the progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(strokeDashoffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [strokeDashoffset]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={size}
        height={size}
        className="transform  rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-700"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={animatedValue}
          strokeLinecap="round"
          className="text-teal-500 transition-all duration-1000 ease-out"
          style={{
            strokeDashoffset: animatedValue,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black rounded-full m-4">
        <span className="text-4xl font-bold text-white">
          {value.toLocaleString()}
          <span className="text-xs">%</span>
        </span>
        <span className="text-sm text-gray-400 mt-1">{label}</span>
      </div>
    </div>
  );
}
