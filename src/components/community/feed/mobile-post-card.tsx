'use client';

import React from 'react';
import { Heart, MessageCircle, Headphones, PlayCircle, Image as ImageIcon, BookOpen, Lock, Feather } from 'lucide-react';
import { type Post } from '@/lib/types';

// Mirrors kyozo_flutter's PostCard (lib/widgets/post_card.dart) and palette
// (lib/theme/app_theme.dart) for the mobile feed.
const KYOZO = {
  cardBorder: '#E7E7E6',
  background: '#FDFCFA',
  textMain: '#5B4A3A',
  textMuted: '#8A7255',
  primary: '#E8DFD1',
  toggleBg: '#F2EDE8',
  destructive: '#B3261E',
};

function TypeChip({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: KYOZO.toggleBg, color: KYOZO.textMuted }}
    >
      {icon}
      {label}
    </span>
  );
}

function PrivateChip() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: KYOZO.toggleBg, color: KYOZO.textMuted }}
    >
      <Lock className="h-3 w-3" />
      Private
    </span>
  );
}

function formatDate(createdAt: any): string | null {
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : createdAt ? new Date(createdAt) : null;
    if (!d || isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

function MetaRow({ post }: { post: Post & { id: string } }) {
  const author: any = post.author || {};
  const name = author.displayName || author.name || (author.handle ? `@${author.handle}` : 'Unknown');
  const avatarUrl = author.avatarUrl || author.photoURL || '';
  const date = formatDate(post.createdAt);

  return (
    <div className="flex items-center gap-2 pl-4 pr-2 py-3">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-[22px] w-[22px] flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ backgroundColor: KYOZO.primary, color: KYOZO.textMain }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-xs" style={{ color: KYOZO.textMain }}>
        {name}
      </span>
      {date && (
        <span className="text-xs" style={{ color: KYOZO.textMuted }}>
          {date}
        </span>
      )}
      <span className="inline-flex items-center gap-1 px-1.5 py-1">
        <Heart className="h-4 w-4" style={{ color: KYOZO.textMuted }} />
        <span className="text-xs" style={{ color: KYOZO.textMuted }}>{post.likes || 0}</span>
      </span>
      {(post.comments || 0) > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-1">
          <MessageCircle className="h-4 w-4" style={{ color: KYOZO.textMuted }} />
          <span className="text-xs" style={{ color: KYOZO.textMuted }}>{post.comments}</span>
        </span>
      )}
    </div>
  );
}

export function MobilePostCard({ post, onClick }: { post: Post & { id: string }; onClick?: () => void }) {
  const isPrivate = post.visibility === 'private';
  const mediaUrl = post.content?.mediaUrls?.[0];
  const text = post.content?.text;

  let body: React.ReactNode;

  if (post.type === 'video') {
    body = (
      <div className="flex flex-col">
        <video
          controls
          preload="metadata"
          poster={post.content?.thumbnailUrl || undefined}
          src={mediaUrl}
          className="aspect-video w-full bg-black object-contain"
        />
        <div className="flex items-center gap-2 pl-4 pr-4 pt-3 pb-1">
          <TypeChip label="Watch" icon={<PlayCircle className="h-3 w-3" />} />
          {isPrivate && <PrivateChip />}
        </div>
        {post.title && (
          <p className="px-4 pt-1 text-base font-semibold line-clamp-2" style={{ color: KYOZO.textMain }}>
            {post.title}
          </p>
        )}
      </div>
    );
  } else if (post.type === 'audio') {
    body = (
      <div className="flex flex-col px-4 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <TypeChip label="Listen" icon={<Headphones className="h-3 w-3" />} />
          {isPrivate && <PrivateChip />}
        </div>
        {post.title && (
          <p className="mt-2.5 text-base font-semibold line-clamp-2" style={{ color: KYOZO.textMain }}>
            {post.title}
          </p>
        )}
        {mediaUrl && <audio controls preload="metadata" src={mediaUrl} className="mt-3 h-10 w-full" />}
        {text && (
          <p className="mt-3 text-sm line-clamp-3" style={{ color: KYOZO.textMain, opacity: 0.85 }}>
            {text}
          </p>
        )}
      </div>
    );
  } else if (post.type === 'image') {
    body = (
      <div className="flex flex-col">
        <div className="relative aspect-square w-full" style={{ backgroundColor: KYOZO.toggleBg }}>
          {mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt={post.title || 'Post image'} className="h-full w-full object-cover" />
          )}
          <span className="absolute left-2 top-2">
            <TypeChip label="View" icon={<ImageIcon className="h-3 w-3" />} />
          </span>
          {isPrivate && (
            <span className="absolute right-2 top-2">
              <PrivateChip />
            </span>
          )}
        </div>
        {(post.title || text) && (
          <div className="px-4 pt-3.5 pb-1">
            {post.title && (
              <p className="text-base font-semibold line-clamp-2" style={{ color: KYOZO.textMain }}>
                {post.title}
              </p>
            )}
            {text && (
              <p className="mt-1.5 text-sm line-clamp-3" style={{ color: KYOZO.textMain, opacity: 0.85 }}>
                {text}
              </p>
            )}
          </div>
        )}
      </div>
    );
  } else {
    // text / poetry
    body = (
      <div className="flex flex-col">
        {mediaUrl && (
          <div className="relative aspect-video w-full" style={{ backgroundColor: KYOZO.toggleBg }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt={post.title || 'Cover'} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="px-4 pt-3.5 pb-1">
          {!mediaUrl && (
            <div className="mb-2.5 flex items-center gap-2">
              <TypeChip
                label={post.isPoetry ? 'Poetry' : 'Read'}
                icon={post.isPoetry ? <Feather className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
              />
              {isPrivate && <PrivateChip />}
            </div>
          )}
          {post.title && (
            <p className="text-base font-semibold line-clamp-2" style={{ color: KYOZO.textMain }}>
              {post.title}
            </p>
          )}
          {text && (
            <p
              className={`mt-1.5 whitespace-pre-line text-sm line-clamp-4 ${post.isPoetry ? 'italic' : ''}`}
              style={{ color: KYOZO.textMain, opacity: 0.85 }}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: KYOZO.cardBorder, backgroundColor: KYOZO.background }}
      onClick={onClick}
    >
      {body}
      <MetaRow post={post} />
    </div>
  );
}

export type MobileFeedFilter = 'all' | 'read' | 'listen' | 'watch';

export function MobileFeedFilterBar({
  value,
  onChange,
}: {
  value: MobileFeedFilter;
  onChange: (f: MobileFeedFilter) => void;
}) {
  const filters: { key: MobileFeedFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'read', label: 'Read' },
    { key: 'listen', label: 'Listen' },
    { key: 'watch', label: 'Watch' },
  ];

  return (
    <div className="flex rounded-full p-1" style={{ backgroundColor: KYOZO.toggleBg }}>
      {filters.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`h-8 flex-1 rounded-full text-[13px] transition-all ${active ? 'font-semibold shadow-sm' : 'font-medium'}`}
            style={{
              backgroundColor: active ? KYOZO.background : 'transparent',
              color: active ? KYOZO.textMain : KYOZO.textMuted,
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export function matchesMobileFeedFilter(post: Post, filter: MobileFeedFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'read') return post.type === 'text' || post.type === 'image';
  if (filter === 'listen') return post.type === 'audio';
  return post.type === 'video';
}
