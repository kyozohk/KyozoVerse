#!/bin/bash

# Script to update imports to use the centralized UI components

# Find all TypeScript and TSX files
FILES=$(find ./src -type f -name "*.ts" -o -name "*.tsx")

# Loop through each file
for file in $FILES; do
  # Skip the index.tsx file itself
  if [[ "$file" == "./src/components/ui/index.tsx" ]]; then
    continue
  fi
  
  # Check if the file imports from individual UI components
  if grep -q "from '@/components/ui/" "$file"; then
    echo "Processing $file..."
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file to update imports
    awk '
      BEGIN { 
        in_import_block = 0
        ui_imports = ""
        other_imports = ""
      }
      
      # Check for import statements from UI components
      /^import.*from .@\/components\/ui\// {
        in_import_block = 1
        if ($0 ~ /CustomButton/) ui_imports = ui_imports "CustomButton, "
        if ($0 ~ /PasswordInput/) ui_imports = ui_imports "PasswordInput, "
        if ($0 ~ /Header/) ui_imports = ui_imports "Header, "
        if ($0 ~ /GradientText/) ui_imports = ui_imports "GradientText, "
        if ($0 ~ /Accordion/) ui_imports = ui_imports "Accordion, AccordionContent, AccordionItem, AccordionTrigger, "
        if ($0 ~ /Alert/) ui_imports = ui_imports "Alert, AlertDescription, AlertTitle, "
        if ($0 ~ /AlertDialog/) ui_imports = ui_imports "AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, "
        if ($0 ~ /Avatar/) ui_imports = ui_imports "Avatar, AvatarFallback, AvatarImage, "
        if ($0 ~ /Badge/) ui_imports = ui_imports "Badge, badgeVariants, "
        if ($0 ~ /Button/) ui_imports = ui_imports "Button, buttonVariants, "
        if ($0 ~ /Calendar/) ui_imports = ui_imports "Calendar, "
        if ($0 ~ /Card/) ui_imports = ui_imports "Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, "
        if ($0 ~ /Carousel/) ui_imports = ui_imports "Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, "
        if ($0 ~ /Checkbox/) ui_imports = ui_imports "Checkbox, "
        if ($0 ~ /Collapsible/) ui_imports = ui_imports "Collapsible, CollapsibleContent, CollapsibleTrigger, "
        if ($0 ~ /Dialog/) ui_imports = ui_imports "Dialog, "
        if ($0 ~ /DropdownMenu/) ui_imports = ui_imports "DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, "
        if ($0 ~ /Form/) ui_imports = ui_imports "Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, "
        if ($0 ~ /Input/) ui_imports = ui_imports "Input, "
        if ($0 ~ /Label/) ui_imports = ui_imports "Label, "
        if ($0 ~ /Menubar/) ui_imports = ui_imports "Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarPortal, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger, "
        if ($0 ~ /Popover/) ui_imports = ui_imports "Popover, PopoverContent, PopoverTrigger, "
        if ($0 ~ /Progress/) ui_imports = ui_imports "Progress, "
        if ($0 ~ /RadioGroup/) ui_imports = ui_imports "RadioGroup, RadioGroupItem, "
        if ($0 ~ /ScrollArea/) ui_imports = ui_imports "ScrollArea, ScrollBar, "
        if ($0 ~ /Select/) ui_imports = ui_imports "Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue, "
        if ($0 ~ /Separator/) ui_imports = ui_imports "Separator, "
        if ($0 ~ /Sheet/) ui_imports = ui_imports "Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, "
        if ($0 ~ /Skeleton/) ui_imports = ui_imports "Skeleton, "
        if ($0 ~ /Slider/) ui_imports = ui_imports "Slider, "
        if ($0 ~ /Switch/) ui_imports = ui_imports "Switch, "
        if ($0 ~ /Table/) ui_imports = ui_imports "Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, "
        if ($0 ~ /Tabs/) ui_imports = ui_imports "Tabs, TabsContent, TabsList, TabsTrigger, "
        if ($0 ~ /Textarea/) ui_imports = ui_imports "Textarea, "
        if ($0 ~ /Toast/) ui_imports = ui_imports "Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, "
        if ($0 ~ /Toaster/) ui_imports = ui_imports "Toaster, "
        if ($0 ~ /Tooltip/) ui_imports = ui_imports "Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, "
        if ($0 ~ /enhanced-sidebar/) ui_imports = ui_imports "Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar, "
        next
      }
      
      # End of import block
      /^$/ && in_import_block {
        in_import_block = 0
        if (ui_imports != "") {
          # Remove trailing comma and space
          ui_imports = substr(ui_imports, 1, length(ui_imports) - 2)
          print "import { " ui_imports " } from \"@/components/ui\";"
        }
        print ""
        next
      }
      
      # Print all other lines
      { print }
    ' "$file" > "$temp_file"
    
    # Replace the original file with the modified content
    mv "$temp_file" "$file"
  fi
done

echo "Import updates complete!"
