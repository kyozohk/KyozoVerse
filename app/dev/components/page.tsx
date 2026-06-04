'use client';

/**
 * Component audit / gallery — a static page to compare the UI primitives in
 * use (especially the several checkbox variants) so we can standardize and
 * delete the redundant ones. Visit /dev/components.
 *
 * This page is intentionally self-contained: the inline list/table/dialog
 * checkbox variants are recreated here (with their exact classes) so you can
 * see them next to the shared components without needing live data.
 */

import React, { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Checkbox as CustomCheckbox } from '@/components/ui/checkbox';
import { Checkbox as RadixCheckbox } from '@/components/ui/figma/checkbox';
import {
  Button,
  CustomButton,
  Badge,
  Input,
  PasswordInput,
  Textarea,
  Switch,
  RadioGroup,
  RadioGroupItem,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Label,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  CustomFormDialog,
  Slider,
  Calendar,
  ScrollArea,
  FloatingSelect,
  PhoneInput,
  Dropzone,
  GradientText,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from '@/components/ui';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AIInput } from '@/components/ui/ai-input';
import { AITextarea } from '@/components/ui/ai-textarea';
import { RoundImage } from '@/components/ui/round-image';
import { FeatureCard } from '@/components/ui/feature-card';
import { Banner } from '@/components/ui/banner';

/* -------------------------------------------------------------------------- */
/*  Layout helpers                                                            */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="text-xl font-bold text-slate-800 mb-1">{title}</h2>
      {note && <p className="text-sm text-slate-500 mb-5 max-w-3xl">{note}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </section>
  );
}

/** A labeled card for one variant, with provenance + a keep/delete hint. */
function Variant({
  name,
  source,
  usedIn,
  recommend,
  children,
}: {
  name: string;
  source: string;
  usedIn?: string;
  recommend?: 'keep' | 'delete' | 'review';
  children: React.ReactNode;
}) {
  const badge =
    recommend === 'keep'
      ? { t: 'Recommend: KEEP', c: '#15803d', b: '#dcfce7' }
      : recommend === 'delete'
        ? { t: 'Recommend: DROP', c: '#b91c1c', b: '#fee2e2' }
        : recommend === 'review'
          ? { t: 'REVIEW', c: '#a16207', b: '#fef9c3' }
          : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-slate-800">{name}</h3>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ color: badge.c, background: badge.b }}
          >
            {badge.t}
          </span>
        )}
      </div>
      <code className="text-[11px] text-slate-400 mb-3 break-all">{source}</code>
      <div className="flex-1 flex flex-wrap items-center gap-4 py-3">{children}</div>
      {usedIn && <p className="text-[11px] text-slate-400 mt-2">Used in: {usedIn}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline checkbox re-creations (exact classes from the live components)     */
/* -------------------------------------------------------------------------- */

/** EnhancedListView TABLE view — native input with accent color. */
function ListViewTableCheckbox() {
  const [c, setC] = useState(true);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        type="checkbox"
        checked={c}
        onChange={(e) => setC(e.target.checked)}
        className="h-4 w-4 rounded border-[#A89882] accent-[#5B4A3A] cursor-pointer"
      />
      <input
        type="checkbox"
        ref={ref}
        onChange={() => {}}
        // indeterminate set via ref
        className="h-4 w-4 rounded border-[#A89882] accent-[#5B4A3A] cursor-pointer"
      />
      <span className="text-xs text-slate-400">checked · indeterminate(header)</span>
    </>
  );
}

/** EnhancedListView GRID/CIRCLE view — custom div + Check icon. */
function ListViewGridCheckbox() {
  const [c, setC] = useState(true);
  return (
    <button type="button" onClick={() => setC((v) => !v)} className="flex items-center gap-2">
      <div
        className={cn(
          'w-5 h-5 rounded border flex items-center justify-center transition-colors',
          c ? 'bg-accent border-accent-foreground/30' : 'border-[#A89882] bg-transparent'
        )}
      >
        {c && <Check className="h-3 w-3 text-accent-foreground" />}
      </div>
      <span className="text-xs text-slate-400">toggle</span>
    </button>
  );
}

/** V06 dialog (DistributeForm / import) — brown filled box. */
function V06DialogCheckbox() {
  const [c, setC] = useState(true);
  return (
    <button type="button" onClick={() => setC((v) => !v)} className="flex items-center gap-2">
      <span
        className="w-4 h-4 rounded flex items-center justify-center"
        style={{
          background: c ? '#5B4A3A' : 'transparent',
          border: `1.5px solid ${c ? '#5B4A3A' : '#D8CBB6'}`,
        }}
      >
        {c && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="text-xs text-slate-400">toggle</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ComponentsAuditPage() {
  const [cb1, setCb1] = useState(true);
  const [cb2, setCb2] = useState(true);
  const [sw, setSw] = useState(true);
  const [radio, setRadio] = useState('a');
  const [floatSel, setFloatSel] = useState('');
  const [phone, setPhone] = useState('');
  const [aiVal, setAiVal] = useState('');
  const [aiText, setAiText] = useState('');
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calDate, setCalDate] = useState<Date | undefined>(undefined);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Component Audit</h1>
          <p className="text-slate-500 mt-2 max-w-3xl">
            Every variant of the inconsistency-prone UI primitives, side by side. Use the
            keep/drop hints as a starting point, then tell me which to standardize on and I'll
            migrate usages + delete the rest.
          </p>
        </header>

        {/* ---- CHECKBOXES ---- */}
        <Section
          title="Checkboxes — 5 variants in the codebase"
          note="This is the main offender. Five different checkboxes render across the app. Suggested path: standardize on ONE (the Radix shadcn one is the most accessible) and migrate the inline list/table/dialog ones to it."
        >
          <Variant
            name="Radix / shadcn"
            source="src/components/ui/figma/checkbox.tsx"
            usedIn="figma-imported screens"
            recommend="keep"
          >
            <RadixCheckbox checked={cb1} onCheckedChange={(v) => setCb1(!!v)} />
            <RadixCheckbox checked={!cb1} onCheckedChange={(v) => setCb1(!v)} />
            <RadixCheckbox disabled />
            <span className="text-xs text-slate-400">checked · alt · disabled</span>
          </Variant>

          <Variant
            name="Custom Checkbox"
            source="src/components/ui/checkbox.tsx"
            usedIn="forms, account page"
            recommend="review"
          >
            <CustomCheckbox checked={cb2} onCheckedChange={setCb2} label="With label" />
          </Variant>

          <Variant
            name="ListView — table view"
            source="enhanced-list-view.tsx (native accent-[#5B4A3A])"
            usedIn="Audience / Communities tables"
            recommend="delete"
          >
            <ListViewTableCheckbox />
          </Variant>

          <Variant
            name="ListView — grid/circle view"
            source="enhanced-list-view.tsx (custom bg-accent div)"
            usedIn="Audience grid view"
            recommend="delete"
          >
            <ListViewGridCheckbox />
          </Variant>

          <Variant
            name="V06 dialog checkbox"
            source="import-members-dialog.tsx (DistributeForm, #5B4A3A)"
            usedIn="Automatically Integrate dialog"
            recommend="delete"
          >
            <V06DialogCheckbox />
          </Variant>
        </Section>

        {/* ---- BUTTONS ---- */}
        <Section
          title="Buttons — 2 components"
          note="Button (shadcn) and CustomButton overlap heavily. Likely keep Button and fold CustomButton's unique variants (waitlist, rounded-rect) into it."
        >
          <Variant name="Button — variants" source="src/components/ui/button.tsx" recommend="keep">
            <div className="flex flex-wrap gap-2">
              <Button>default</Button>
              <Button variant="secondary">secondary</Button>
              <Button variant="destructive">destructive</Button>
              <Button variant="outline">outline</Button>
              <Button variant="ghost">ghost</Button>
              <Button variant="link">link</Button>
            </div>
          </Variant>
          <Variant name="Button — sizes" source="src/components/ui/button.tsx" recommend="keep">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">sm</Button>
              <Button size="default">default</Button>
              <Button size="lg">lg</Button>
            </div>
          </Variant>
          <Variant
            name="CustomButton — variants"
            source="src/components/ui/CustomButton.tsx"
            usedIn="landing, auth dialogs"
            recommend="review"
          >
            <div className="flex flex-wrap gap-2">
              <CustomButton>default</CustomButton>
              <CustomButton variant="outline">outline</CustomButton>
              <CustomButton variant="filled">filled</CustomButton>
            </div>
          </Variant>
        </Section>

        {/* ---- INPUTS ---- */}
        <Section
          title="Inputs"
          note="Several input styles. Confirm the canonical text input + label pattern."
        >
          <Variant name="Input (with label)" source="src/components/ui/input.tsx" recommend="keep">
            <div className="w-full">
              <Input label="Email" type="email" placeholder="you@example.com" />
            </div>
          </Variant>
          <Variant name="PasswordInput" source="src/components/ui/PasswordInput.tsx" recommend="keep">
            <div className="w-full">
              <PasswordInput label="Password" />
            </div>
          </Variant>
          <Variant name="Textarea" source="src/components/ui/textarea.tsx" recommend="keep">
            <div className="w-full">
              <Textarea placeholder="Type here…" />
            </div>
          </Variant>
          <Variant name="Select" source="src/components/ui/select.tsx" recommend="keep">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
              </SelectContent>
            </Select>
          </Variant>
        </Section>

        {/* ---- BADGES / TAGS ---- */}
        <Section
          title="Badges & Tags"
          note="The Badge component vs the hand-rolled tag pills (audience tag colors, list-view chips). Pick one tag style."
        >
          <Variant name="Badge — variants" source="src/components/ui/badge.tsx" recommend="keep">
            <div className="flex flex-wrap gap-2">
              <Badge>default</Badge>
              <Badge variant="secondary">secondary</Badge>
              <Badge variant="destructive">destructive</Badge>
              <Badge variant="outline">outline</Badge>
            </div>
          </Variant>
          <Variant
            name="Audience tag pills"
            source="audience/page.tsx getTagStyle()"
            usedIn="Audience table tags"
            recommend="review"
          >
            <div className="flex flex-wrap gap-1.5">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ color: '#E05A47', backgroundColor: '#FFF5F2', border: '1px solid #FFE2DF' }}
              >
                vip
              </span>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ color: '#2563EB', backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE' }}
              >
                founder
              </span>
            </div>
          </Variant>
          <Variant
            name="ListView source chip"
            source="import-members-dialog.tsx SourceBadge"
            usedIn="Review table"
            recommend="review"
          >
            <span
              className="inline-block rounded-md px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: '#1E2A47' }}
            >
              Eventbrite
            </span>
          </Variant>
        </Section>

        {/* ---- TOGGLES ---- */}
        <Section title="Toggles" note="Switch and radio — confirm these are the only toggle styles.">
          <Variant name="Switch" source="src/components/ui/switch.tsx" recommend="keep">
            <Switch checked={sw} onCheckedChange={setSw} />
          </Variant>
          <Variant name="RadioGroup" source="src/components/ui/radio-group.tsx" recommend="keep">
            <RadioGroup value={radio} onValueChange={setRadio} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="r-a" />
                <Label htmlFor="r-a">A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="r-b" />
                <Label htmlFor="r-b">B</Label>
              </div>
            </RadioGroup>
          </Variant>
        </Section>

        {/* ---- AVATARS ---- */}
        <Section title="Avatars" note="Avatar (shadcn) vs UserAvatar wrapper.">
          <Variant name="Avatar" source="src/components/ui/avatar.tsx" recommend="keep">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>KZ</AvatarFallback>
            </Avatar>
          </Variant>
          <Variant name="UserAvatar" source="src/components/ui/user-avatar.tsx" recommend="review">
            <UserAvatar name="Ada Lovelace" size={40} />
          </Variant>
        </Section>

        {/* ---- FEEDBACK ---- */}
        <Section title="Feedback & misc">
          <Variant name="Alert" source="src/components/ui/alert.tsx" recommend="keep">
            <Alert>
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>Something to note.</AlertDescription>
            </Alert>
          </Variant>
          <Variant name="Skeleton" source="src/components/ui/skeleton.tsx" recommend="keep">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Variant>
          <Variant name="Progress" source="src/components/ui/progress.tsx" recommend="keep">
            <div className="w-full">
              <Progress value={60} />
            </div>
          </Variant>
          <Variant name="Tabs" source="src/components/ui/tabs.tsx" recommend="keep">
            <Tabs defaultValue="one" className="w-full">
              <TabsList>
                <TabsTrigger value="one">One</TabsTrigger>
                <TabsTrigger value="two">Two</TabsTrigger>
              </TabsList>
              <TabsContent value="one" className="text-sm text-slate-500">
                Tab one content
              </TabsContent>
              <TabsContent value="two" className="text-sm text-slate-500">
                Tab two content
              </TabsContent>
            </Tabs>
          </Variant>
          <Variant name="Separator" source="src/components/ui/separator.tsx" recommend="keep">
            <div className="w-full">
              top
              <Separator className="my-2" />
              bottom
            </div>
          </Variant>
        </Section>
      </div>
    </div>
  );
}
