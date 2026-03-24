'use client';

import React, { useState, useLayoutEffect, useRef } from 'react';

interface ChartWrapperProps {
  children: React.ReactElement;
  height?: number | string;
  minHeight?: number;
}

/**
 * ChartWrapper - Solução definitiva para o erro de dimensões do Recharts.
 * 
 * O ResponsiveContainer do Recharts é conhecido por falhar em containers flexíveis
 * ou animados, disparando avisos de width(-1).
 * 
 * Esta solução profissional:
 * 1. Usa ResizeObserver para medir o container real no DOM.
 * 2. Usa useLayoutEffect para garantir que a medição ocorra antes da pintura.
 * 3. Injeta as dimensões DIRETAMENTE no gráfico via React.cloneElement,
 *    ignorando completamente a lógica interna falha do ResponsiveContainer.
 */
export default function ChartWrapper({ children, height = "100%", minHeight = 300 }: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    };

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    updateDimensions(); // Chamada inicial imediata

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden"
      style={{ height, minHeight }}
    >
      {dimensions ? (
        // Clonamos o gráfico e injetamos largura e altura exatas em pixels.
        // Isso anula a necessidade do ResponsiveContainer e seus avisos.
        React.cloneElement(children, {
          width: dimensions.width,
          height: dimensions.height
        })
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/10 rounded-2xl animate-pulse">
          <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
