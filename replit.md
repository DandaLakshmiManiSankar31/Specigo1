Medical Assistant Application
Overview
This is a medical assistant web application that provides AI-powered health consultations. The application features a voice-enabled interface where users can describe symptoms and receive medical guidance through integration with MedGemma, a medical AI model. Users authenticate via phone number, complete an onboarding profile (name, age, blood group, height, weight), and can view their consultation history.

User Preferences
Preferred communication style: Simple, everyday language.

System Architecture
Frontend Architecture
Framework: React 18 with TypeScript
Routing: Wouter (lightweight React router)
State Management: TanStack React Query for server state, local component state for UI
Styling: Tailwind CSS with shadcn/ui component library (New York style variant)
Animations: Framer Motion for smooth transitions and voice interface animations
Voice Interface: Web Speech API via react-speech-recognition for speech-to-text, native SpeechSynthesis API for text-to-speech
Backend Architecture
Runtime: Node.js with Express
Language: TypeScript (ESM modules)
API Design: RESTful endpoints defined in shared routes schema with Zod validation
Build Tool: Custom esbuild script for production bundling, Vite for development
Data Storage
Database: PostgreSQL
ORM: Drizzle ORM with drizzle-zod for schema-to-validation integration
Schema: Three main tables:
users (profile data: name, phone, age, blood group, height, weight, comprehensive medical history)
medicalRecords (consultation history with symptoms, diagnosis, advice)
medicalReports (uploaded lab reports with AI analysis, risk levels, parameters)
Migrations: Managed via drizzle-kit with db:push command
Patient Medical History
The application includes a comprehensive medical history form with 11 sections covering 250+ health fields:

Basic Information: Nationality, ethnicity, category, diet, marital status, allergies
Personal History: Occupation, education, living situation, financial status
Lifestyle History: Addiction history with per-substance details (start age, years of use, frequency, amount, last use, craving, tolerance, withdrawal severity), substance treatment history
Medical & Surgical History: Medical conditions, medications, drug reactions with medicine name tracking, multiple surgeries (each with type, date, indication)
Family History: Mother, father, siblings, children health status and conditions
Obstetric & Gynecology History: Menstrual history, menopause, pregnancy/obstetric details (for females)
Environmental History: Living conditions, water/sanitation, pollution exposure, pets
Vaccination History: Childhood and adult vaccines, reactions
Travel History: Recent travel, destinations, illness during travel, endemic area exposure
Psychosocial History: Mood, anxiety, sleep, safety assessments with standardized scales
Vision History: Vision problems, glasses use, eye diseases, screen time
Features include:

Color-coded sections with category icons
Conditional fields that appear based on selections
Dropdown selects for single-choice fields
Multi-select checkboxes for multi-choice fields (with "None" option that disables other selections)
Per-substance addiction tracking with detailed questionnaires
Multiple surgery entries with add/remove functionality
Dark mode support
Multilingual Support
Languages: English, Telugu (te), Hindi (hi)
Translation: Real-time bidirectional translation for chat messages
Speech: Web Speech API for text-to-speech with language-specific voices
Limitation: Telugu TTS requires user to install Telugu language pack in Windows Settings
Authentication
Method: Simple phone number-based authentication (no password)
Session: User data stored in localStorage on client side
Flow: Phone number lookup creates new user if not exists, returns existing user otherwise
AI Integration
Model: MedGemma (Google's medical AI model)
Architecture: External Python Flask server running the model (hosted separately, likely on Colab with ngrok)
Session Management: In-memory map on server tracking userId to MedGemma session IDs
Hybrid Clinical AI: Deterministic code-based parameter classification (if value > upper: High, elif value < lower: Low, else: Normal) with LLM providing explanations only. The parseAndClassifyParameters() function in server/routes.ts parses lab report text, extracts parameters/values/ranges, and pre-classifies statuses before sending to the AI. This eliminates hallucination in status determination. The correctTextSectionsWithClassification() function also corrects the AI's text sections (Reason Specified, Probable Causes) to match deterministic statuses.
Tab-Reorder Preprocessing: PDF text extraction produces tab-separated columns in inconsistent order per page. A preprocessing step inside parseAndClassifyParameters identifies which tab-separated field is the unit (matches unit pattern), numeric value, parameter name, and reference range — then normalizes them into standard "Name Value Unit Range" format before regex parsing.
Narrative Section Skipping: The parser tracks an inNarrativeSection flag to skip Interpretations, Comments, Disclaimers, Sample Type, Method, Clinical Use, and End Of Report sections. This prevents false parameter extraction from narrative/interpretation text. Re-entry occurs at page boundaries (-- X of Y --), table headers, or when a data-like line (Name + Value + Unit) is detected. The DATA_LINE_RE and name-match regex include all supported units (mg/g, ug/l, µg/l, IU/mL, mIU/mL, mg/L, g/L, etc.) and allow / in parameter names (e.g., "Microalbumin / Creatinine Ratio") to ensure proper narrative re-entry.
No-Range Parameter Capture: P6 pattern now captures parameters with value+unit but no reference range (e.g., "Mean Blood Glucose 165.68 mg/dl"). These are added with rawRange="Not specified" and the LLM is instructed to classify them using its medical knowledge. The buildPreClassifiedTable marks these as "USE YOUR MEDICAL KNOWLEDGE" in the status column.
HTML Entity Decoding: The parser decodes HTML entities (&gt; &lt; &amp; &quot; &#39;) and numeric entities (&#xNN; &#NN;) before processing, since PDF extraction sometimes produces HTML-encoded text.
OCR Pipeline: Dual-engine OCR using EasyOCR (deep learning, primary for images) and Tesseract.js (fallback). EasyOCR handles arrow symbols natively without misreading them as digits. For Tesseract, morphological filtering via ImageMagick (Open with multiple kernel sizes) removes thin arrow symbols before OCR. The correctArrowArtifact() function provides a final fallback by checking if removing a leading "1" brings a value closer to its reference range midpoint.
Interactive Features
Forgotten Symptom Suggestions: When a user clicks "Add Forgotten Symptom" on the symptom check results page, the app fetches related symptoms from the AI (based on the cause analysis), with an offline fallback using a built-in CAUSE_SYMPTOM_MAP. Suggestions appear as clickable chips below the input field. Selecting a chip populates the input. An empty state is shown if no related symptoms are found.
Follow-up Questions: After each AI response in the chat (both symptom follow-up chat and report analysis chat), 2-3 contextual follow-up questions are generated by the LLM itself. The backend appends a follow-up instruction to every chat message asking the LLM to include [FOLLOWUP_Q1/Q2/Q3] tagged questions. The backend parses these tags from the response, strips them from the visible reply, and returns them as a separate `followUpQuestions` array in the API response. Questions appear as clickable buttons with arrow icons below the last AI message. They clear when the user submits a new manual message or clicks a follow-up. This works in SymptomCheck.tsx (results chat tab) and Assistant.tsx (main chat + report chat).
External Dependencies
Database
PostgreSQL via DATABASE_URL environment variable
Connection pooling through node-postgres (pg)
AI Backend
External MedGemma API endpoint (Flask server)
Requires ngrok tunnel URL configuration for the medical AI service
Third-Party Libraries
UI Components: Radix UI primitives (dialog, popover, toast, etc.)
Charts: Recharts (available but may not be actively used)
Date Handling: date-fns
HTTP Client: Axios (available for external API calls)
Development Tools
Vite with HMR for development
Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
TypeScript with strict mode enabled