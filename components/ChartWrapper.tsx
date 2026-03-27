'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';

interface ChartWrapperProps {
  children: React.ReactElement;
  height?: number | string;
  minHeight?: number;
}

export default function ChartWrapper({
  children,
  height = '100%',
  minHeight = 300,
}: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const updateDimensions = () => {
      if (!containerRef.current) {
        return;
      }

      const { width, height: elementHeight } = containerRef.current.getBoundingClientRect();
      if (width > 0 && elementHeight > 0) {
        setDimensions({ width, height: elementHeight });
      }
    };

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) {
        return;
      }

      const { width, height: elementHeight } = entries[0].contentRect;
      if (width > 0 && elementHeight > 0) {
        setDimensions({ width, height: elementHeight });
      }
    });

    observer.observe(containerRef.current);
    updateDimensions();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ height, minHeight }}
    >
      {dimensions ? (
        React.cloneElement(children, {
          width: dimensions.width,
          height: dimensions.height,
        } as any)
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-zinc-900/10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-500" />
        </div>
      )}
    </div>
  );
}
