Colors (Design Tokens + Hex)
The page uses a warm beige / brown palette. Colors appear both as CSS variables (globals.css) and hard-coded hex in the page CSS.

Core surfaces
App background (Tailwind bg-background)
--background: 40 33% 99% = #FDFCFA
Page outer background (inline style)
--page-bg-color = #F9FAFB
Page content panel background
--page-content-bg = #FDFCFA
Page content panel border
--page-content-border = #E7E7E6
Card background
#FDFCFA
Card hover background (hover:bg-page-hover)
#f7f5f2
Text colors
Main text (.text-main)
#5B4A3A (page-local)
Global foreground
--foreground ≈ #5E4B3B
Muted text (.text-muted, and global --muted-foreground)
Page-local .text-muted: #8A7255
Global --muted-foreground: #8D7059 (very close)
Headings
Global heading color
--heading-color = #88796E
Applied via globals.css to h1..h6
UI / interactive colors
Primary button background
Page-local .btn-primary: #E8DFD1
Global --primary: #E5DFD1 (close match)
Primary button hover
#dccdb6
Toggle group background (.view-toggle) / ghost hover
#F2EDE8
Input border + focus ring
#8A7255
Badge secondary background
#F2EDE8
Badge outline border
#8A7255
Dialog overlay
rgba(0,0,0,0.8)
Skeleton blocks
#e5e7eb
Typography (Fonts / Weights / Sizes)
Font family
Body font
PT Sans, sans-serif
Set globally on body in src/app/globals.css
Also duplicated in page-local .font-body { font-family: 'PT Sans' }
Font weights used
Regular: 400 (font-normal)
Medium: 500 (font-medium)
Semibold: 600 (font-semibold)
Bold: 700 (font-bold)
Font sizes (as used on this page)
Page title h1
Class: text-3xl font-bold tracking-tight
Size: 1.875rem (30px), line-height 2.25rem (36px)
Card title (grid/list) h3
Class: text-lg font-semibold
Size: 1.125rem (18px), line-height 1.75rem (28px)
Card title (circle view) h3
Class: text-xl font-bold
Size: 1.25rem (20px), line-height 1.75rem (28px)
Secondary/meta text (member count, selection count)
Class: text-sm text-muted
Size: 0.875rem (14px), line-height 1.25rem (20px)
Color: #8A7255
Badges
Class: .badge → font-size: 0.75rem (12px), line-height 1rem (16px), weight 600
Dialog title
Class: .dialog-title
Size: 1.125rem (18px), line-height 1.75rem (28px), weight 600, tracking -0.025em
Dialog description
Class: .dialog-description
Size: 0.875rem (14px), line-height 1.25rem (20px), color #8A7255
Buttons (Sizing, Variants, States)
All buttons share the base .btn.

Base button (.btn)
Layout
inline-flex, centered, gap 0.5rem
Typography
font-size: 0.875rem (14px)
font-weight: 500
Size
Height: 2.5rem (40px)
Padding: 0.5rem 1rem (8px 16px)
Shape
Border-radius: 0.375rem (6px)
Transition
Background-color 0.2s
Primary button (.btn-primary)
Default
Background: #E8DFD1
Text: #5B4A3A
Hover
Background: #dccdb6
Disabled
opacity: 0.5
cursor: not-allowed
Used for:

Create Community (header)
Create Community (dialog submit)
Ghost button (.btn-ghost)
Default: transparent
Hover: background #F2EDE8
Used for:

View mode buttons (list/grid/circle)
Select All / Deselect All
Small button (.btn-sm)
Height: 2.25rem (36px)
Padding: 0.25rem 0.75rem (4px 12px)
Icon button (.btn-icon)
Size: 2rem x 2rem (32px)
Padding: 0
Toggle “selected” state (view mode)
When active, the icon button adds:

bg-page (background #FDFCFA)
shadow-sm (subtle elevation)
Inputs (Search + Form Fields)
Text input (.input)
Height: 2.5rem (40px)
Border radius: 0.375rem (6px)
Border: 1px solid #8A7255
Background: #FDFCFA
Font size: 0.875rem (14px)
Text color: #5B4A3A
Placeholder color: #8A7255
Focus ring: box-shadow: 0 0 0 2px #8A7255
Search input padding
Default .input includes left padding for icon: 2.5rem
Search input adds pl-10 as well (extra left padding)
Textarea (.form-textarea)
Min height: 80px
Border: 1px solid #8A7255
Border radius: 0.375rem
Background: #FDFCFA
Font size: 0.875rem
Focus ring: 0 0 0 2px #8A7255
Cards, Badges, Shadows
Card (.card)
Background: #FDFCFA
Text: #5B4A3A
Border: 1px solid var(--page-content-border) (=#E7E7E6)
Radius: 0.5rem (8px)
Shadow: subtle “card” shadow
Card selected (.card-selected)
Adds a 2px highlight ring effect:
0 0 0 2px #E8DFD1
Badge (.badge)
Pill shape: radius 9999px
Padding: 0.125rem 0.625rem (2px 10px)
Font size: 12px, weight 600
Variants:

Secondary (.badge-secondary)
Background #F2EDE8
Text #5B4A3A
Border transparent
Outline (.badge-outline)
Border #8A7255
Text #5B4A3A
Common Spacing + Layout Sizing
Outer page padding: p-8 (32px)
Header padding: p-6 (24px) / md:p-8 (32px)
Card padding: p-6 (24px), list item p-4 (16px)
Grid gaps: gap-4 (16px)
Tag/badge gaps: gap-2 (8px)
Corner rounding
Outer container: rounded-2xl (Tailwind default 16px)
Card: rounded-lg / 0.5rem (8px)
Inputs/buttons: rounded-md / 0.375rem (6px)