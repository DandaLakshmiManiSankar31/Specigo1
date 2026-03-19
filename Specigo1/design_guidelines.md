SpeciGO Medical Assistant - Design Guidelines
Design Approach
Primary Reference: Apple Health (clarity + trust) + Calm (professional serenity) + Stripe Dashboard (data visualization)

Core Principle: Medical credibility through clean hierarchy and confident layouts. Avoid clinical sterility—create warmth through purposeful whitespace and soft geometric patterns.

Typography System
Font Stack:

Primary: Inter (medical data, UI elements)
Display: Archivo (headings, section titles)
Scale:

Hero/Display: text-5xl font-bold (48px)
Section Headings: text-3xl font-semibold (30px)
Card Titles: text-xl font-medium (20px)
Body: text-base (16px), text-sm for secondary (14px)
Medical Data/Parameters: text-lg font-medium (18px)
Micro-copy: text-xs (12px)
Layout System
Spacing Primitives: Tailwind units of 4, 6, 8, 12, 16

Component padding: p-6 or p-8
Section spacing: py-16 desktop, py-12 mobile
Card gaps: gap-6
Element margins: mb-4, mb-6, mb-8
Container Strategy:

Max-width: max-w-7xl for dashboard sections
Report analysis: max-w-6xl for focused reading
Chat interface: max-w-4xl centered
Core Components
Medical Reports Analysis Section (Primary Feature)
Upload Interface:

Large drag-drop zone (min-h-64) with dashed border
File type indicators (PDF, JPG, PNG badges)
Multiple file preview grid (3 columns desktop, 1 mobile)
Progress indicators with percentage + file name
Parameter Analysis Cards:

Two-column grid (lg:grid-cols-2, base single column)
Each card structure: Parameter name (bold) → Current Value (large, color-coded) → Normal Range (subtle) → AI Explanation (expandable accordion) → Risk Badge (High/Medium/Low with icons)
Visual meters showing position within normal range
Comparison charts if historical data exists
Risk Assessment Dashboard:

Top summary card spanning full width
Overall health score with radial progress indicator
Critical findings highlighted in dedicated alert cards
Expandable detailed analysis sections with medical icons
Patient Onboarding Flow
Progressive Disclosure:

Step indicator (1/5, 2/5 etc.) at top
Single question per screen with generous spacing
Large radio buttons/checkboxes (touch-friendly, min 48px)
Medical history checklist with icon categories
Language selector with flag icons (grid layout)
AI Chat Consultation Interface
Layout:

Fixed header with voice control toggle + language selector
Scrollable message area (flex-1)
Message bubbles: max-w-2xl, user right-aligned, AI left-aligned
Voice waveform animation during active listening
Floating action button for voice input (bottom-right, size-16)
Medical suggestion chips below input field
Message Styling:

User messages: right-aligned, rounded-2xl
AI responses: left-aligned, rounded-2xl, includes avatar icon
Medical references as expandable inline cards
Timestamp with read status
Navigation & Header
Top Navigation:

Logo left, main nav center, profile + language right
Sticky on scroll with subtle shadow
Mobile: Hamburger menu revealing full-screen overlay
Dashboard Sidebar:

Icons + labels for: Home, Reports, Chat, History, Settings
Active state with subtle highlight indicator
Collapsible on mobile (drawer pattern)
Images
Hero Section - Landing Page:

Image: Diverse healthcare professionals with patient using tablet, warm clinical setting, soft natural lighting
Placement: Full-width hero (h-screen), gradient overlay (bottom-to-top fade)
Treatment: Buttons with backdrop-blur-md backgrounds on overlay
Report Analysis Section:

Icons: Medical parameter icons (heart for cardiac, kidney for renal, etc.) - use Heroicons Medical set
Illustrations: Abstract medical diagrams (DNA helix, body systems) as decorative backgrounds with low opacity
Trust Indicators:

Medical certification badges in footer
Doctor avatars (diverse, professional headshots) for AI assistant representation
Animations
Sparingly Applied:

File upload: Gentle scale + fade-in on drop
Parameter cards: Stagger appearance (100ms delays)
Voice waveform: Subtle pulse during active listening
Risk meters: Animated fill on viewport entry
NO distracting carousel animations or scroll effects
Accessibility
All form inputs: aria-labels, proper focus states (ring-2 ring-offset-2)
High contrast ratios (4.5:1 minimum)
Keyboard navigation throughout
Screen reader announcements for AI responses
Touch targets minimum 48x48px
Data Visualization
Charts for Reports:

Line charts for trends (historical lab values)
Horizontal bar charts for range indicators
Donut charts for category breakdowns
Use healthcare-appropriate visual encoding (avoid alarming reds unless critical)
Icons: Heroicons exclusively - Medical category preferred

