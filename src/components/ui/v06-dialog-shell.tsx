'use client';

/**
 * V06DialogShell — shared dialog chrome for the Kyozo Pro design system.
 *
 * Every dialog in the app sits inside this shell so the header / footer /
 * spacing / palette stay consistent. The body is composable:
 *
 *   Single-pane (simple forms, confirmations):
 *     <V06DialogShell title="..." onClose={...}>
 *       <form>…</form>
 *     </V06DialogShell>
 *
 *   Two-pane (complex flows — Tag Members, Import, Broadcast):
 *     <V06DialogShell
 *       title="..." onClose={...}
 *       leftPanel={<Filters/>}
 *       rightPanel={<Table/>}
 *     />
 *
 *   Destructive (delete, revoke, remove):
 *     <V06DialogShell tone="destructive" title="..." onClose={...}>
 *       <p>This cannot be undone.</p>
 *     </V06DialogShell>
 *
 * The shell handles: dialog framing, gradient header, close button, optional
 * vertical divider, sticky footer, palette tokens. Pages own their content.
 */

import React, { type ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle, VisuallyHidden } from './dialog';
import { X, Zap, AlertTriangle, type LucideIcon } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Palette                                                                   */
/* -------------------------------------------------------------------------- */

export const V06 = {
  bgPage: '#EDE4D6',
  bgModal: '#FFFFFF',
  bgCard: '#FCFAF6',
  bgSoft: '#F3EDE2',
  ruleSoft: '#ECE3D2',
  rule: '#DDD2BD',
  divider: '#E5DCC9',
  ink: '#1F1B17',
  warmDeep: '#3D2E20',
  warmMid: '#6B5F52',
  warmLight: '#A89C8E',
  // Header gradients
  gradPurpleFrom: '#6366F1',
  gradPurpleTo: '#A855F7',
  gradDangerFrom: '#DC2626',
  gradDangerTo: '#9F1239',
  // Buttons
  btnPrimaryBg: '#3D2E20',
  btnActionBg: '#D4C8B8',
  btnActionInk: '#5C4F40',
  btnDangerBg: '#B91C1C',
  navy: '#1E3A5F',
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type DialogTone = 'default' | 'destructive';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

interface CommonProps {
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog wants to close (X click, overlay click, Escape). */
  onClose: () => void;
  /** Header title (large text). */
  title: string;
  /** Optional subtitle under the title. */
  subtitle?: string;
  /** Header tone — purple for default flows, red for destructive ones. */
  tone?: DialogTone;
  /** Header icon override. Defaults to Zap (purple) / AlertTriangle (destructive). */
  Icon?: LucideIcon;
  /** Dialog width. sm ~440 / md ~720 / lg ~960 / xl ~1180. Default: lg. */
  size?: DialogSize;
  /** Footer content (typically action buttons). Right-aligned by default. */
  footer?: ReactNode;
  /** Left-aligned hint text in the footer (e.g. "3 selected · 2 excluded"). */
  footerHint?: ReactNode;
  /** Hide the X close button (some flows want only explicit buttons). */
  hideCloseButton?: boolean;
}

interface SinglePaneProps extends CommonProps {
  children: ReactNode;
  leftPanel?: never;
  rightPanel?: never;
}

interface TwoPaneProps extends CommonProps {
  /** Left panel (filters / source list / summary). Fixed width, scrolls independently. */
  leftPanel: ReactNode;
  /** Right panel (the working surface — table, form, content). */
  rightPanel: ReactNode;
  /** Left panel width in px. Default 300. */
  leftPanelWidth?: number;
  children?: never;
}

export type V06DialogShellProps = SinglePaneProps | TwoPaneProps;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const SIZE_TO_CLASS: Record<DialogSize, string> = {
  sm: '!max-w-[440px]',
  md: '!max-w-[720px]',
  lg: '!max-w-[960px]',
  xl: '!max-w-[1180px]',
};

export function V06DialogShell(props: V06DialogShellProps) {
  const {
    open,
    onClose,
    title,
    subtitle,
    tone = 'default',
    Icon,
    size = 'lg',
    footer,
    footerHint,
    hideCloseButton = false,
  } = props;
  const isTwoPane = 'leftPanel' in props && props.leftPanel != null;

  // Layout invariants:
  //   - DialogContent is `flex flex-col`, capped at 92vh so it never exceeds
  //     the viewport. Header and footer are flex-shrink-0 (their natural size);
  //     the body section gets `flex: 1; min-height: 0` so it scrolls internally
  //     while the footer stays glued to the bottom.
  //   - Each pane inside the body is its own overflow-auto scroll area.
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`!p-0 !overflow-hidden !w-[95vw] !max-h-[92vh] !flex !flex-col ${SIZE_TO_CLASS[size]}`}
        style={{ background: V06.bgModal, borderRadius: 16 }}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>

        <Header
          title={title}
          subtitle={subtitle}
          tone={tone}
          Icon={Icon}
          onClose={onClose}
          hideCloseButton={hideCloseButton}
        />

        <div className="flex flex-1 min-h-0">
          {isTwoPane ? (
            <>
              <div
                className="flex-shrink-0 p-6 flex flex-col gap-4 overflow-auto"
                style={{
                  background: V06.bgCard,
                  width: (props as TwoPaneProps).leftPanelWidth ?? 300,
                }}
              >
                {(props as TwoPaneProps).leftPanel}
              </div>
              <div className="w-px flex-shrink-0" style={{ background: V06.divider }} />
              <div className="flex-1 p-6 overflow-auto min-w-0">
                {(props as TwoPaneProps).rightPanel}
              </div>
            </>
          ) : (
            <div className="flex-1 p-6 overflow-auto">{(props as SinglePaneProps).children}</div>
          )}
        </div>

        {(footer || footerHint) && (
          <div
            className="flex items-center justify-between gap-3 px-6 py-3.5 border-t flex-shrink-0"
            style={{ background: V06.bgCard, borderColor: V06.ruleSoft }}
          >
            <span className="text-xs" style={{ color: V06.warmMid }}>
              {footerHint || ''}
            </span>
            <div className="flex items-center gap-2">{footer}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function Header({
  title,
  subtitle,
  tone,
  Icon,
  onClose,
  hideCloseButton,
}: {
  title: string;
  subtitle?: string;
  tone: DialogTone;
  Icon?: LucideIcon;
  onClose: () => void;
  hideCloseButton: boolean;
}) {
  const ResolvedIcon = Icon || (tone === 'destructive' ? AlertTriangle : Zap);
  const gradient =
    tone === 'destructive'
      ? `linear-gradient(110deg, ${V06.gradDangerFrom} 0%, ${V06.gradDangerTo} 100%)`
      : `linear-gradient(110deg, ${V06.gradPurpleFrom} 0%, ${V06.gradPurpleTo} 100%)`;

  return (
    <div
      className="flex items-center gap-4 px-6 py-5 text-white flex-shrink-0"
      style={{ background: gradient }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.18)' }}
      >
        <ResolvedIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[20px] font-bold leading-tight">{title}</div>
        {subtitle && <div className="text-[13px] opacity-85 mt-0.5">{subtitle}</div>}
      </div>
      {!hideCloseButton && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/15 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers — buttons styled consistently for use in `footer`                 */
/* -------------------------------------------------------------------------- */

export function V06PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2.5 rounded-lg text-sm font-bold disabled:cursor-not-allowed transition-opacity"
      style={{
        background: disabled ? V06.warmLight : V06.btnPrimaryBg,
        color: 'white',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function V06DangerButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2.5 rounded-lg text-sm font-bold disabled:cursor-not-allowed transition-opacity"
      style={{
        background: V06.btnDangerBg,
        color: 'white',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function V06SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm font-semibold disabled:cursor-not-allowed transition-colors hover:opacity-80"
      style={{ background: V06.bgSoft, color: V06.warmMid }}
    >
      {children}
    </button>
  );
}

export function V06ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2.5 rounded-lg text-sm font-bold disabled:cursor-not-allowed transition-opacity"
      style={{
        background: V06.btnActionBg,
        color: V06.btnActionInk,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
