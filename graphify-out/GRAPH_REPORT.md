# Graph Report - .  (2026-07-10)

## Corpus Check
- 160 files · ~89,500 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1003 nodes · 1713 edges · 59 communities (53 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Assessment & Chat UI
- AI Assessment Engine
- Runtime Dependencies
- Journal & Calendar UI
- App Routing / Pages
- Voice Chat Input
- Assessment Domain Types
- Dev Tooling / Config
- Medicine AI & Gemini API
- Toast Component
- Mood Calendar UI
- Sidebar Component
- UI Primitives
- Chat Context/State
- TS App Config
- Dynamic Question Generator
- Command Palette
- shadcn Config
- TS Node Config
- PWA Manifest
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52

## God Nodes (most connected - your core abstractions)
1. `cn()` - 71 edges
2. `AIAssessmentEngine` - 36 edges
3. `Button` - 27 edges
4. `DynamicScoringEngine` - 26 edges
5. `DynamicQuestionGenerator` - 25 edges
6. `DynamicResponse` - 22 edges
7. `UserContext` - 21 edges
8. `AssessmentResult` - 20 edges
9. `AdaptiveScore` - 19 edges
10. `JournalEntry` - 19 edges

## Surprising Connections (you probably didn't know these)
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form-utils.ts → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar-context.tsx → package.json

## Import Cycles
- None detected.

## Communities (59 total, 6 thin omitted)

### Community 0 - "Assessment & Chat UI"
Cohesion: 0.05
Nodes (59): AssessmentProps, SpeechRecognitionConstructor, SpeechRecognitionErrorEvent, SpeechRecognitionEvent, Window, EventsList(), DiscussionGroup, GroupDiscussion() (+51 more)

### Community 1 - "AI Assessment Engine"
Cohesion: 0.06
Nodes (19): @google/generative-ai, AIAssessmentEngine, AIEngineConfig, UserResponse, DynamicScoringEngine, DynamicAssessment(), AIAssessmentService, AdaptiveScore (+11 more)

### Community 2 - "Runtime Dependencies"
Cohesion: 0.03
Nodes (62): dependencies, class-variance-authority, @clerk/clerk-react, clsx, cmdk, cors, crypto-js, date-fns (+54 more)

### Community 3 - "Journal & Calendar UI"
Cohesion: 0.06
Nodes (20): CalendarView(), CalendarViewProps, ImageUploadProps, JournalEditorProps, StickerPaletteProps, SvasthyaJournal(), TemplateSelectorProps, VoiceRecorderProps (+12 more)

### Community 4 - "App Routing / Pages"
Cohesion: 0.06
Nodes (29): sonner, App(), Assessment, Booking, Chat, Community, Journal, MedicineAI (+21 more)

### Community 5 - "Voice Chat Input"
Cohesion: 0.08
Nodes (18): ChatBot(), SpeechRecognition, SimpleTextEditor(), PlaceholdersAndVanishInput(), PlaceholdersAndVanishInputDemo(), PlaceholdersAndVanishInputDemoProps, AIAdvisoryService, AssessmentData (+10 more)

### Community 6 - "Assessment Domain Types"
Cohesion: 0.05
Nodes (34): AdaptationPreference, AIInsights, AssessmentContext, AssessmentError, AssessmentInitializationError, CategoryTrend, ChatMessage, ChatResponse (+26 more)

### Community 7 - "Dev Tooling / Config"
Cohesion: 0.06
Nodes (35): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+27 more)

### Community 8 - "Medicine AI & Gemini API"
Cohesion: 0.10
Nodes (12): MedicineAI(), AssessmentScores, DynamicQuestion, api, CRISIS_KEYWORDS, geminiService, MedicineAnalysis, medicineAnalysisService (+4 more)

### Community 9 - "Toast Component"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 10 - "Mood Calendar UI"
Cohesion: 0.13
Nodes (16): CommentInput(), CommentInputProps, DateSelector(), DateSelectorProps, DayPopupProps, MoodCalendarProps, MoodSelector(), MoodSelectorProps (+8 more)

### Community 11 - "Sidebar Component"
Cohesion: 0.08
Nodes (25): Separator, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel (+17 more)

### Community 12 - "UI Primitives"
Cohesion: 0.09
Nodes (13): Alert, AlertDescription, AlertTitle, alertVariants, Checkbox, HoverCardContent, PopoverContent, RadioGroup (+5 more)

### Community 13 - "Chat Context/State"
Cohesion: 0.16
Nodes (17): ChatAction, ChatContext, ChatProvider(), chatReducer(), initialState, TODO: Dispatch to store rooms. Currently we mix groups and mentor sessions., ChatEvent, ChatRoom (+9 more)

### Community 14 - "TS App Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 15 - "Dynamic Question Generator"
Cohesion: 0.24
Nodes (3): DynamicQuestionGenerator, DynamicQuestion, UserContext

### Community 16 - "Command Palette"
Cohesion: 0.12
Nodes (15): Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+7 more)

### Community 17 - "shadcn Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 18 - "TS Node Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 19 - "PWA Manifest"
Cohesion: 0.13
Nodes (14): background_color, categories, description, display, icons, lang, name, orientation (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (12): Navigation(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (12): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (12): AuthenticityIndicators, ConsistencyMetrics, EngagementDepth, ResponseAnalysis, SentimentAnalysis, TimingAnalysis, CategoryScores, EmotionalStatePoint (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (4): buildResources(), modules, setupI18n(), ErrorBoundary

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (7): CategoryQuestionConfig, ResponsePatternAnalysis, AssessmentAnswer, EngagementMetrics, QuestionStyle, ResponsePattern, SessionContext

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport, navigationMenuTriggerStyle

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (5): fs, iconsDir, iconSizes, path, shortcutSizes

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 39 - "Community 39"
Cohesion: 0.32
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): app, __dirname, __filename, genAI, prisma, server

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (5): react, useCarousel(), useChart(), useFormField(), useIsMobile()

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (5): __dirname, envExamplePath, envPath, __filename, projectRoot

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, useFormField()

### Community 46 - "Community 46"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

## Knowledge Gaps
- **458 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+453 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `AI Assessment Engine`, `App Routing / Pages`, `Dev Tooling / Config`, `Community 42`, `Community 43`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 21` to `Assessment & Chat UI`, `Voice Chat Input`, `Toast Component`, `Mood Calendar UI`, `Sidebar Component`, `UI Primitives`, `Command Palette`, `Community 20`, `Community 22`, `Community 24`, `Community 26`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 42`, `Community 46`, `Community 47`, `Community 51`, `Community 52`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `react` connect `Community 43` to `Toast Component`, `Runtime Dependencies`, `Community 50`, `Community 45`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _459 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Assessment & Chat UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05319355464958261 - nodes in this community are weakly interconnected._
- **Should `AI Assessment Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.057911392405063294 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03225806451612903 - nodes in this community are weakly interconnected._