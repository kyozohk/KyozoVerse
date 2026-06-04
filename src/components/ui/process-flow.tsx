'use client';

/**
 * ProcessFlow — reusable step-by-step process chrome for multi-step flows
 * (wizards / guided dialogs). It owns ONLY the presentation: the numbered
 * step rail + a content slot. The parent owns step state and what each step
 * renders, so the same component drives a full-screen wizard or a flow embedded
 * inside a dialog.
 *
 * First consumer: the "Automatically Integrate" contact-import wizard.
 *
 * Usage:
 *   <ProcessFlow steps={STEPS} current={i} onStepClick={maybeGoTo}>
 *     <ProcessStepHeader eyebrow="Step 2" title="Review your contacts." onBack={back} />
 *     ...step body...
 *   </ProcessFlow>
 */

import React from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

export interface ProcessStep {
  key: string;
  label: string;
}

export interface ProcessFlowProps {
  steps: ProcessStep[];
  /** Index of the active step. */
  current: number;
  /** Optional: allow clicking a completed step to jump back to it. */
  onStepClick?: (index: number) => void;
  /** Step content. */
  children: React.ReactNode;
  /** Accent color for the active step + progress (defaults to terracotta). */
  accent?: string;
  doneColor?: string;
  className?: string;
}

const DEFAULT_ACCENT = '#BF5B30';
const DEFAULT_DONE = '#2D6A7E';

export function ProcessFlow({
  steps,
  current,
  onStepClick,
  children,
  accent = DEFAULT_ACCENT,
  doneColor = DEFAULT_DONE,
  className,
}: ProcessFlowProps) {
  return (
    <div className={`flex flex-col min-h-0 ${className ?? ''}`}>
      {/* Step rail */}
      <div className="border-b border-[#E7DFD2] flex-shrink-0">
        <div className="flex gap-3 overflow-x-auto px-6 py-5">
          {steps.map((s, i) => {
            const isActive = i === current;
            const isDone = i < current;
            const clickable = !!onStepClick && isDone;
            return (
              <button
                type="button"
                key={s.key}
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                className="flex-1 min-w-[120px] rounded-xl px-4 py-3 text-left transition-opacity disabled:cursor-default"
                style={{
                  backgroundColor: isActive ? accent : '#FFFFFF',
                  border: `1px solid ${isActive ? accent : '#E7DFD2'}`,
                  opacity: !isActive && !isDone ? 0.6 : 1,
                  cursor: clickable ? 'pointer' : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: isActive ? 'rgba(255,255,255,0.85)' : '#7C7468' }}
                  >
                    Step {i + 1}
                  </span>
                  {isDone ? (
                    <span
                      className="h-4 w-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: doneColor }}
                    >
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  ) : null}
                </div>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: isActive ? '#fff' : '#1E2A47' }}
                >
                  {s.label}
                </p>
                <div
                  className="mt-2 h-1 rounded-full"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.6)'
                      : isDone
                        ? doneColor
                        : '#E7DFD2',
                    width: isActive ? '40%' : '100%',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Content (scrolls within a fixed-height container; fills otherwise) */}
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}

/** Standard step heading: eyebrow + serif title + subtitle + optional Back. */
export function ProcessStepHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  accent = DEFAULT_ACCENT,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  accent?: string;
}) {
  return (
    <div className="mb-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:opacity-70 transition-opacity"
          style={{ color: '#3D2E1E' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      {eyebrow && (
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-5xl md:text-6xl leading-tight" style={{ color: '#1E2A47' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-lg" style={{ color: '#7C7468' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Primary action button matching the flow's accent. */
export function ProcessButton({
  children,
  onClick,
  disabled,
  loading,
  accent = DEFAULT_ACCENT,
  className,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accent?: string;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 ${className ?? ''}`}
      style={{ backgroundColor: accent }}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
