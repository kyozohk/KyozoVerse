'use client';
import {
  Plus,
  Users,
  CircleUser,
  Search,
  List as ListIcon,
  Grid as GridIcon,
  Loader2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';

// Data
const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Creative Coders',
    memberCount: 1250,
    imageUrl: 'https://picsum.photos/seed/comm1/400/300',
    imageHint: 'abstract design',
    slug: 'creative-coders',
    tags: [
      'House',
      'Choreography',
      'Pop',
      'Street',
      'Dance',
      'Hip Hop',
      'Jazz',
      'Funk',
      'Soul',
      'R&B',
    ],
  },
  {
    id: '2',
    name: 'Mindful Mornings',
    memberCount: 875,
    imageUrl: 'https://picsum.photos/seed/comm2/400/300',
    imageHint: 'nature zen',
    slug: 'mindful-mornings',
    tags: ['Wellness', 'Meditation', 'Yoga'],
  },
  {
    id: '3',
    name: 'Future Founders',
    memberCount: 2300,
    imageUrl: 'https://picsum.photos/seed/comm3/400/300',
    imageHint: 'technology circuit',
    slug: 'future-founders',
    tags: ['Startups', 'Tech', 'VC'],
  },
  {
    id: '4',
    name: 'The Book Nook',
    memberCount: 450,
    imageUrl: 'https://picsum.photos/seed/comm4/400/300',
    imageHint: 'book open',
    slug: 'the-book-nook',
    tags: ['Fiction', 'Sci-Fi', 'Fantasy', 'Non-Fiction'],
  },
  {
    id: '5',
    name: 'Trail Blazers',
    memberCount: 680,
    imageUrl: 'https://picsum.photos/seed/comm5/400/300',
    imageHint: 'mountain trail',
    slug: 'trail-blazers',
    tags: ['Hiking', 'Outdoors', 'Camping'],
  },
];

type Community = {
  id: string;
  name: string;
  memberCount: number;
  imageUrl: string;
  imageHint: string;
  slug: string;
  tags?: string[];
};

// Main Component
export default function CommunitiesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'circle'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState<{title: string, description: string} | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCommunities(mockCommunities);
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const filteredItems = useMemo(() => {
    if (isLoading) return [];
    if (!searchTerm) return communities;
    return communities.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [communities, searchTerm, isLoading]);

  const handleSelect = (itemId: string) => {
    const newSelection = new Set(selection);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelection(newSelection);
  };

  const handleSelectAll = () => {
    if (selection.size === filteredItems.length) {
      setSelection(new Set());
    } else {
      const allIds = new Set(filteredItems.map(item => item.id));
      setSelection(allIds);
    }
  };

  const handleCreateCommunity = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      
      if (name.length < 3) return; // Basic validation

      setSubmitting(true);
      setTimeout(() => {
          console.log('Creating community:', { name, description });
          setSubmitting(false);
          setDialogOpen(false);
          (e.target as HTMLFormElement).reset();
          setShowToast({
            title: 'Community Created!',
            description: `The "${name}" community has been successfully created.`,
          });
      }, 1000);
  };

  // Styles
  const cssStyles = `
    /* Global Styles */
    .font-body { font-family: 'PT Sans', sans-serif; }
    .antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .bg-page { background-color: #FDFCFA; }
    .text-main { color: #5B4A3A; }
    .text-muted { color: #8A7255; }
    .min-h-screen { min-height: 100vh; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-grow { flex-grow: 1; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .p-6 { padding: 1.5rem; }
    .p-4 { padding: 1rem; }
    .p-1 { padding: 0.25rem; }
    .pb-8 { padding-bottom: 2rem; }
    .pb-6 { padding-bottom: 1.5rem; }
    .pt-0 { padding-top: 0; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .pt-6 { padding-top: 1.5rem; }
    .pl-10 { padding-left: 2.75rem; }
    .ml-4 { margin-left: 1rem; }
    .mr-2 { margin-right: 0.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .h-full { height: 100%; }
    .w-full { width: 100%; }
    .h-4 { height: 1rem; }
    .w-4 { width: 1rem; }
    .h-8 { height: 2rem; }
    .w-8 { width: 2rem; }
    .h-5 { height: 1.25rem; }
    .w-3\\/4 { width: 75%; }
    .w-1\\/2 { width: 50%; }
    .w-1\\/3 { width: 33.333333%; }
    .w-14 { width: 3.5rem; }
    .w-16 { width: 4rem; }
    .w-20 { width: 5rem; }
    .w-12 { width: 3rem; }
    .h-6 { height: 1.5rem; }
    .h-16 { height: 4rem; }
    .w-16 { width: 4rem; }
    .h-28 { height: 7rem; }
    .w-28 { width: 7rem; }
    .rounded-md { border-radius: 0.375rem; }
    .rounded-full { border-radius: 9999px; }
    .rounded-lg { border-radius: 0.5rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-normal { font-weight: 400; }
    .font-medium { font-weight: 500; }
    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .tracking-tight { letter-spacing: -0.025em; }
    .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
    .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .cursor-pointer { cursor: pointer; }
    .overflow-hidden { overflow: hidden; }
    .object-cover { object-fit: cover; }
    .aspect-square { aspect-ratio: 1 / 1; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .top-0 { top: 0; }
    .left-0 { left: 0; }
    .left-3 { left: 0.75rem; }
    .top-1\\/2 { top: 50%; }
    .-translate-y-1\\/2 { transform: translateY(-50%); }
    .text-center { text-align: center; }
    .flex-wrap { flex-wrap: wrap; }
    .justify-start { justify-content: flex-start; }
    .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
    .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }

    /* Grid */
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    @media (min-width: 640px) { .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1024px) { .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    @media (min-width: 768px) { .md\\:flex-row { flex-direction: row; } .md\\:flex-1 { flex: 1 1 0%; } .md\\:p-8 { padding: 2rem; } .md\\:mt-0 { margin-top: 0; } }

    /* Button */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; white-space: nowrap; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s; height: 2.5rem; padding: 0.5rem 1rem; border: none; }
    .btn-primary { background-color: #E8DFD1; color: #5B4A3A; }
    .btn-primary:hover { background-color: #dccdb6; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background-color: transparent; }
    .btn-ghost:hover { background-color: #F2EDE8; }
    .btn-sm { height: 2.25rem; padding: 0.25rem 0.75rem; }
    .btn-icon { padding: 0; width: 2rem; height: 2rem; }

    /* Card */
    .card { border-radius: 0.5rem; border: 1px solid #8A7255; background-color: #FDFCFA; color: #5B4A3A; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
    .card-selected { box-shadow: 0 0 0 2px #E8DFD1, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
    .hover\\:bg-page-hover:hover { background-color: #f7f5f2; }
    .hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }

    /* Header Banner */
    .header-banner { background-color: #FDFCFA; border-bottom: 1px solid #8A7255; }
    .header-content { display: flex; flex-direction: column; }
    @media (min-width: 768px) { .header-content { flex-direction: row; align-items: center; justify-content: space-between; } }
    
    /* Custom List View */
    .list-view-container { display: flex; flex-direction: column; flex-grow: 1; }
    .list-view-header { padding: 1rem 1.5rem; }
    .search-input { position: relative; width: 100%; }
     @media (min-width: 768px) { .search-input { flex: 1 1 0%; } }
    .view-toggle { display: flex; align-items: center; border-radius: 0.375rem; background-color: #F2EDE8; padding: 0.25rem; }
    .scroll-area { flex: 1; overflow-y: auto; }
    
    /* Input */
    .input { display: flex; height: 2.5rem; width: 100%; border-radius: 0.375rem; border: 1px solid #8A7255; background-color: #FDFCFA; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #5B4A3A; }
    .input::placeholder { color: #8A7255; }
    .input:focus { outline: none; box-shadow: 0 0 0 2px #8A7255; }

    /* Badge */
    .badge { display: inline-flex; align-items: center; border-radius: 9999px; border: 1px solid; padding: 0.125rem 0.625rem; font-size: 0.75rem; line-height: 1rem; font-weight: 600; }
    .badge-secondary { background-color: #F2EDE8; border-color: transparent; color: #5B4A3A; }
    .badge-outline { color: #5B4A3A; border-color: #8A7255; }

    /* Avatar */
    .avatar { position: relative; display: flex; height: 7rem; width: 7rem; flex-shrink: 0; overflow: hidden; border-radius: 9999px; }
    .avatar-img { aspect-ratio: 1 / 1; height: 100%; width: 100%; object-fit: cover; }
    .avatar-fallback { display: flex; height: 100%; width: 100%; align-items: center; justify-content: center; border-radius: 9999px; background-color: #F7F4F1; font-weight: 600; color: #5B4A3A; font-size: 2.25rem; }

    /* Skeleton */
    @keyframes pulse { 50% { opacity: .5; } }
    .skeleton { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; background-color: #e5e7eb; border-radius: 0.375rem; }

    /* Dialog */
    .dialog-overlay { position: fixed; inset: 0; z-index: 50; background-color: rgba(0,0,0,0.8); }
    .dialog-content { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 50; display: grid; width: 100%; max-width: 425px; gap: 1rem; border: 1px solid #8A7255; background-color: #FDFCFA; padding: 1.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border-radius: 0.5rem; }
    .dialog-header { display: flex; flex-direction: column; gap: 0.5rem; text-align: center; }
    @media (min-width: 640px) { .dialog-header { text-align: left; } }
    .dialog-title { font-size: 1.125rem; line-height: 1.75rem; font-weight: 600; letter-spacing: -0.025em; }
    .dialog-description { font-size: 0.875rem; line-height: 1.25rem; color: #8A7255; }
    .dialog-footer { display: flex; flex-direction: column-reverse; }
    @media (min-width: 640px) { .dialog-footer { flex-direction: row; justify-content: flex-end; } }
    .dialog-close-btn { position: absolute; right: 1rem; top: 1rem; border-radius: 0.375rem; opacity: 0.7; transition: opacity 0.2s; background: none; border: none; cursor: pointer;}
    .dialog-close-btn:hover { opacity: 1; }
    .form-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { font-size: 0.875rem; line-height: 1.25rem; font-weight: 500; }
    .form-textarea { min-height: 80px; width: 100%; border-radius: 0.375rem; border: 1px solid #8A7255; background-color: #FDFCFA; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
    .form-textarea:focus { outline: none; box-shadow: 0 0 0 2px #8A7255; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Toast */
    .toast-container { position: fixed; top: 0; z-index: 100; display: flex; max-height: 100vh; width: 100%; flex-direction: column-reverse; padding: 1rem; pointer-events: none; }
    @media (min-width: 640px) { .toast-container { bottom: 0; right: 0; top: auto; flex-direction: column; max-width: 420px; } }
    .toast { pointer-events: auto; position: relative; display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 1rem; overflow: hidden; border-radius: 0.375rem; border: 1px solid #8A7255; padding: 1.5rem; padding-right: 2rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); background-color: #FDFCFA; color: #5B4A3A; }
    .toast-close { background: none; border: none; cursor: pointer; position: absolute; right: 0.5rem; top: 0.5rem; border-radius: 0.375rem; padding: 0.25rem; color: #5B4A3A; opacity: 0.5; }
    .toast-close:hover { opacity: 1; }
  `;

  // Item Renderers
  const CommunityGridItem = ({ item, isSelected }: { item: Community, isSelected: boolean }) => (
    <div className={`card flex h-full flex-col overflow-hidden cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'card-selected' : ''}`}>
      <div className="relative" style={{paddingTop: '75%'}}>
        <Image src={item.imageUrl} alt={item.name} layout="fill" className="absolute top-0 left-0 w-full h-full object-cover" data-ai-hint={item.imageHint} />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold">{item.name}</h3>
      </div>
      <div className="p-6 pt-0 flex-grow">
        <div className="flex items-center text-sm text-muted">
          <Users className="mr-2 h-4 w-4" />
          <span>{item.memberCount.toLocaleString()} members</span>
        </div>
      </div>
      <div className="p-6 pt-0 flex flex-wrap justify-start gap-2 pb-6">
        {item.tags?.slice(0, 3).map(tag => (
          <div key={tag} className="badge badge-secondary font-normal">{tag}</div>
        ))}
        {item.tags && item.tags.length > 3 && (
          <div className="badge badge-outline">+{item.tags.length - 3}</div>
        )}
      </div>
    </div>
  );

  const CommunityListItem = ({ item, isSelected }: { item: Community, isSelected: boolean }) => (
    <div className={`card flex items-center p-4 cursor-pointer transition-all hover:bg-page-hover hover:shadow-lg ${isSelected ? 'card-selected' : ''}`}>
      <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="aspect-square rounded-md object-cover" data-ai-hint={item.imageHint} />
      <div className="ml-4 flex-grow">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <div className="flex items-center text-sm text-muted">
          <Users className="mr-2 h-4 w-4" />
          <span>{item.memberCount.toLocaleString()} members</span>
        </div>
      </div>
    </div>
  );

  const CommunityCircleItem = ({ item, isSelected }: { item: Community, isSelected: boolean }) => (
    <div className={`card flex h-full w-full flex-col items-center justify-start text-center overflow-hidden cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'card-selected' : ''}`}>
      <div className="p-6 pt-6">
        <div className="avatar">
            <Image src={item.imageUrl} alt={item.name} className="avatar-img" layout="fill" />
        </div>
      </div>
      <div className="p-6 pt-0 flex-grow">
        <h3 className="text-xl font-bold">{item.name}</h3>
        <div className="mt-2 flex items-center justify-center text-sm text-muted">
          <Users className="mr-2 h-4 w-4" />
          <span>{item.memberCount.toLocaleString()} members</span>
        </div>
      </div>
      <div className="p-6 pt-0 flex flex-wrap justify-center gap-2 pb-6">
        {item.tags?.slice(0, 2).map(tag => (
          <div key={tag} className="badge badge-secondary font-normal">{tag}</div>
        ))}
        {item.tags && item.tags.length > 2 && (
          <div className="badge badge-outline">+{item.tags.length - 2}</div>
        )}
      </div>
    </div>
  );
  
  // Skeleton Renderers
  const CommunityGridItemSkeleton = () => (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="relative skeleton" style={{paddingTop: '75%'}}></div>
      <div className="p-6"><div className="skeleton h-5 w-3/4"></div></div>
      <div className="p-6 pt-0 flex-grow">
        <div className="flex items-center text-sm">
          <div className="skeleton mr-2 h-4 w-4"></div>
          <div className="skeleton h-4 w-1/2"></div>
        </div>
      </div>
      <div className="p-6 pt-0 flex flex-wrap justify-start gap-2 pb-6">
        <div className="skeleton h-6 w-14"></div>
        <div className="skeleton h-6 w-20"></div>
        <div className="skeleton h-6 w-16"></div>
      </div>
    </div>
  );

  const CommunityListItemSkeleton = () => (
    <div className="card flex items-center p-4">
      <div className="skeleton h-16 w-16 rounded-md"></div>
      <div className="ml-4 flex-grow space-y-2">
        <div className="skeleton h-5 w-1/2"></div>
        <div className="flex items-center text-sm">
          <div className="skeleton mr-2 h-4 w-4"></div>
          <div className="skeleton h-4 w-1/3"></div>
        </div>
      </div>
    </div>
  );
  
  const CommunityCircleItemSkeleton = () => (
    <div className="card flex h-full w-full flex-col items-center justify-start text-center overflow-hidden">
      <div className="p-6 pt-6"><div className="skeleton h-28 w-28 rounded-full"></div></div>
      <div className="p-6 pt-0 flex-grow w-full flex flex-col items-center">
        <div className="skeleton h-6 w-3/4"></div>
        <div className="mt-2 flex items-center justify-center text-sm">
          <div className="skeleton mr-2 h-4 w-4"></div>
          <div className="skeleton h-4 w-20"></div>
        </div>
      </div>
      <div className="p-6 pt-0 flex flex-wrap justify-center gap-2 pb-6">
        <div className="skeleton h-6 w-16"></div>
        <div className="skeleton h-6 w-12"></div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      const skeletonCount = 8;
      const items = Array.from({ length: skeletonCount });
      const SkeletonComponent = 
        viewMode === 'list' ? CommunityListItemSkeleton
        : viewMode === 'circle' ? CommunityCircleItemSkeleton
        : CommunityGridItemSkeleton;
      
      const className = 
        viewMode === 'list' ? "flex flex-col gap-4"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

      return (
        <div className={className}>
          {items.map((_, i) => <SkeletonComponent key={i} />)}
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="py-16 text-center text-muted">
          <p>No items found.</p>
        </div>
      );
    }
  
    const ItemComponent = 
      viewMode === 'list' ? CommunityListItem
      : viewMode === 'circle' ? CommunityCircleItem
      : CommunityGridItem;
      
    const className = 
      viewMode === 'list' ? "flex flex-col gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
  
    return (
      <div className={className}>
        {filteredItems.map((item) => (
          <div key={item.id} onClick={() => handleSelect(item.id)}>
            <ItemComponent item={item} isSelected={selection.has(item.id)} />
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <style>{cssStyles}</style>
      <div className="font-body antialiased bg-page text-main min-h-screen">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="header-banner">
            <div className="p-6 md:p-8">
              <div className="header-content">
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
                  <p className="mt-1 text-muted">Manage your communities or create a new one.</p>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button className="btn btn-primary" onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Community
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom List View */}
          <div className="list-view-container">
            <div className="list-view-header">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="search-input">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="view-toggle">
                    <button onClick={() => setViewMode('list')} className={`btn btn-ghost btn-icon ${viewMode === 'list' ? 'bg-page shadow-sm' : ''}`}>
                      <ListIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode('grid')} className={`btn btn-ghost btn-icon ${viewMode === 'grid' ? 'bg-page shadow-sm' : ''}`}>
                      <GridIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode('circle')} className={`btn btn-ghost btn-icon ${viewMode === 'circle' ? 'bg-page shadow-sm' : ''}`}>
                      <CircleUser className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              {!isLoading && (
                <div className="mt-4 flex items-center">
                  <button className="btn btn-ghost btn-sm" onClick={handleSelectAll} disabled={filteredItems.length === 0}>
                    {selection.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selection.size > 0 && (
                    <span className="ml-4 text-sm text-muted">{selection.size} of {filteredItems.length} selected</span>
                  )}
                </div>
              )}
            </div>
            <div className="scroll-area">
              <div className="px-6 pb-8">{renderContent()}</div>
            </div>
          </div>
        </div>

        {/* Dialog */}
        {isDialogOpen && (
          <div className="dialog-overlay">
            <div className="dialog-content">
              <div className="dialog-header">
                <h2 className="dialog-title">Create a New Community</h2>
                <p className="dialog-description">
                  Give your new community a name and an optional description. Click create when you're done.
                </p>
              </div>
              <form onSubmit={handleCreateCommunity} className="space-y-4 py-4">
                <div className="form-item">
                  <label htmlFor="name" className="form-label">Community Name</label>
                  <input id="name" name="name" placeholder="e.g. My Awesome Community" className="input" required minLength={3} />
                </div>
                <div className="form-item">
                  <label htmlFor="description" className="form-label">Description (Optional)</label>
                  <textarea id="description" name="description" placeholder="Tell everyone what your community is about." className="form-textarea" />
                </div>
                <div className="dialog-footer">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Community
                  </button>
                </div>
              </form>
              <button onClick={() => setDialogOpen(false)} className="dialog-close-btn">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        {showToast && (
             <div className="toast-container">
                <div className="toast">
                    <div>
                        <h3 className="font-semibold">{showToast.title}</h3>
                        <p className="text-sm">{showToast.description}</p>
                    </div>
                    <button onClick={() => setShowToast(null)} className="toast-close">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </>
  );
}
