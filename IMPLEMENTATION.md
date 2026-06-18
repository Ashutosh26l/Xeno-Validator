# AI-Powered Transaction Data Validation & Processing Platform
## Complete Implementation Guide — Zero Ambiguity Edition

---

## 1. Project Objective

Build a full-stack web platform that:
1. Accepts transaction CSV uploads from users
2. Validates data against strict rules (columns, phone, date, integrity)
3. Auto-corrects fixable issues
4. Generates cleaned CSV + error report + invalid rows CSV
5. Chunks large files intelligently and packages into ZIP
6. Stores upload history and output files on Supabase
7. Allows users to re-download previous outputs
8. Generates AI-powered summary via Gemini API

---

## 2. Finalized Tech Stack

| Layer          | Technology                                      | Reason                                      |
|----------------|--------------------------------------------------|---------------------------------------------|
| Frontend       | React (Vite) + Tailwind CSS + Axios + Recharts  | Fast build, clean UI, charts built-in       |
| Backend        | Node.js + Express.js                            | Preferred over FastAPI, JS full-stack        |
| Database       | Supabase (PostgreSQL)                           | Stores metadata + history, free, scalable   |
| File Storage   | Supabase Storage (buckets)                      | Stores CSVs + ZIPs, EC2 stays lightweight   |
| AI Summary     | Google Gemini API (gemini-1.5-flash, free tier) | Free, no credit card, good quality output   |
| Deployment     | AWS EC2 (Ubuntu 22.04) + Nginx + PM2            | Public hosting for submission               |
| Auth           | JWT (jsonwebtoken + bcrypt)                     | Stateless, works with Supabase              |

### Why Supabase for BOTH database AND storage?
- EC2 instance only runs Node.js app — zero files stored on EC2 disk
- Database and files scale independently of EC2
- If EC2 is restarted/terminated, zero data loss
- Supabase Storage works like S3 — public/private bucket URLs
- Free tier: 500MB DB + 1GB Storage — enough for this project

---

## 3. Architecture Diagram

```
Browser (React)
      |
      | HTTP/HTTPS
      ↓
   Nginx (EC2)
      |
      ├──→ /api/*  → Express.js (Node.js, PM2)
      |                   |
      |                   ├──→ Supabase PostgreSQL (metadata, history, errors)
      |                   ├──→ Supabase Storage Bucket (CSV files, ZIPs, PDFs)
      |                   └──→ Gemini API (AI summary)
      |
      └──→ /*  → React Build (static files served by Nginx)
```

---

## 4. Supabase Setup (Do This First — 5 Minutes)

### Step 1: Create Supabase Project
```
1. Go to https://supabase.com → Sign up free
2. New Project → set name "xeno-platform" → set DB password → create
3. Wait 2 minutes for project to provision
```

### Step 2: Create Storage Bucket
```
1. Supabase Dashboard → Storage → New Bucket
2. Name: "xeno-outputs"
3. Set to PRIVATE (files served only via signed URLs)
4. Enable: No file size limit restriction needed for now
```

### Step 3: Get Credentials
```
Supabase Dashboard → Settings → API:
  - SUPABASE_URL = https://xxxx.supabase.co
  - SUPABASE_ANON_KEY = eyJ...
  - SUPABASE_SERVICE_ROLE_KEY = eyJ... (use this in backend only, never expose to frontend)

Settings → Database → Connection String (URI):
  - DATABASE_URL = postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres
```

### Step 4: Run Database Schema in Supabase SQL Editor

```sql
-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploads table (one record per CSV upload)
CREATE TABLE uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    quality_score FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'pending',  -- pending | processing | completed | failed
    is_chunked BOOLEAN DEFAULT FALSE,
    chunk_count INTEGER DEFAULT 0,
    zip_storage_path TEXT,                 -- Supabase storage path for ZIP
    clean_csv_storage_path TEXT,           -- Supabase storage path for clean CSV (if not chunked)
    invalid_csv_storage_path TEXT,         -- Supabase storage path for invalid rows CSV
    error_report_storage_path TEXT,        -- Supabase storage path for error report CSV
    ai_summary_storage_path TEXT,          -- Supabase storage path for AI summary PDF
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Errors table (one record per error found in a row)
CREATE TABLE errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    field_name VARCHAR(100),
    error_type VARCHAR(100),  -- phone | date | payment | integrity | duplicate | missing
    error_message TEXT,
    original_value TEXT,
    suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Reports table
CREATE TABLE ai_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL UNIQUE REFERENCES uploads(id) ON DELETE CASCADE,
    summary TEXT,
    recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_errors_upload_id ON errors(upload_id);
CREATE INDEX idx_errors_type ON errors(error_type);
```

---

## 5. Complete Folder Structure

```
project/
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SummaryCard.jsx
│   │   │   ├── QualityBadge.jsx
│   │   │   ├── ErrorTable.jsx
│   │   │   ├── DropZone.jsx
│   │   │   └── ColumnMapper.jsx         ← for mapping extra columns
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── History.jsx
│   │   │   └── ReportDetail.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   │   ├── supabase.js              ← Supabase client init
    │   │   └── env.js                  ← env var validation
    │   ├── middleware/
    │   │   ├── auth.js                 ← JWT verification middleware
    │   │   ├── upload.js               ← multer config (memory storage)
    │   │   └── errorHandler.js         ← global error handler
    │   ├── routes/
    │   │   ├── auth.js                 ← /api/auth/*
    │   │   ├── upload.js               ← /api/upload
    │   │   ├── validate.js             ← /api/validate/:uploadId
    │   │   ├── report.js               ← /api/report/:uploadId
    │   │   └── download.js             ← /api/download/*
    │   ├── validators/
    │   │   ├── columnValidator.js      ← column presence + mapping
    │   │   ├── phoneValidator.js       ← country-based phone rules
    │   │   ├── dateValidator.js        ← format + logical checks
    │   │   ├── paymentValidator.js     ← allowed values + correction
    │   │   └── integrityValidator.js   ← nulls, types, ranges, dupes
    │   ├── services/
    │   │   ├── validationService.js    ← orchestrates all validators
    │   │   ├── correctionService.js    ← applies auto-corrections
    │   │   ├── qualityService.js       ← computes quality score
    │   │   ├── chunkingService.js      ← intelligent file splitting
    │   │   ├── storageService.js       ← Supabase Storage upload/download
    │   │   ├── geminiService.js        ← AI summary generation
    │   │   └── pdfService.js           ← AI summary PDF generation
    │   └── app.js                      ← Express app entry point
    ├── .env
    ├── package.json
    └── .gitignore
```

---

## 6. Environment Variables

### backend/.env
```
# Server
PORT=8000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service role key — NEVER expose to frontend
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres

# Supabase Storage
SUPABASE_STORAGE_BUCKET=xeno-outputs

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# Chunking
CHUNK_SIZE=10000
```

### frontend/.env
```
VITE_API_BASE_URL=http://your-ec2-ip/api
```

---

## 7. Expected CSV Column Schema

The platform expects EXACTLY these columns in the uploaded CSV:

```
order_id        → string, required, must be unique
order_date      → string, required, must be valid date
customer_name   → string, required, cannot be empty
phone           → string, required, validated by country
country         → string, required, must match known countries
product_name    → string, required
quantity        → integer, required, must be > 0
price           → float, required, must be > 0
payment_mode    → string, required, must be in allowed list
payment_status  → string, required, must be in allowed list
```

---

## 8. All Validation Rules (No Ambiguity)

### 8.1 Column Validation (columnValidator.js)

```
EXPECTED_COLUMNS = [
  "order_id", "order_date", "customer_name", "phone", "country",
  "product_name", "quantity", "price", "payment_mode", "payment_status"
]

Rules:
1. Parse CSV headers from first row
2. If ANY expected column is MISSING → REJECT entire file immediately
   Response: { valid: false, reason: "Missing required columns: [phone, country]" }
3. If EXTRA columns exist (columns not in EXPECTED_COLUMNS):
   → Return column mapping UI prompt to frontend
   → User maps extra column to expected column OR chooses to ignore it
   → Re-submit with mapping decision
4. If columns match exactly → proceed to row-level validation
```

### 8.2 Phone Validation (phoneValidator.js)

```javascript
const COUNTRY_PHONE_RULES = {
  "India":     { digits: 10, code: "91"  },
  "Singapore": { digits: 8,  code: "65"  },
  "USA":       { digits: 10, code: "1"   },
  "UK":        { digits: 10, code: "44"  },
  "Australia": { digits: 9,  code: "61"  },
  "UAE":       { digits: 9,  code: "971" },
  "Germany":   { digits: 10, code: "49"  },
  "France":    { digits: 9,  code: "33"  },
};

Validation steps per row:
1. Strip all spaces, dashes, dots from phone value
2. Remove leading + if present
3. If phone starts with country code (from COUNTRY_PHONE_RULES) → strip it
4. Count remaining digits
5. Compare against COUNTRY_PHONE_RULES[country].digits
6. If count does not match → flag as error
   error_type: "phone"
   error_message: "Invalid phone number for India. Expected 10 digits, got 7."
   suggestion: "Ensure phone number has exactly 10 digits without country code."
7. If country not in COUNTRY_PHONE_RULES → skip phone validation, log warning
```

### 8.3 Date Validation (dateValidator.js)

```javascript
ACCEPTED_FORMATS = [
  "YYYY-MM-DD",     // primary — valid as-is
  "YYYY/MM/DD",     // auto-correctable to YYYY-MM-DD
  "DD-MM-YYYY",     // auto-correctable to YYYY-MM-DD
  "DD/MM/YYYY",     // auto-correctable to YYYY-MM-DD
  "MM/DD/YYYY",     // auto-correctable to YYYY-MM-DD
  "DD MMM YYYY",    // e.g. 15 Apr 2025 → auto-correctable
]

Logical checks after parsing:
- Month must be 1–12
- Day must be valid for month (no Feb 30)
- Year must be between 2000 and 2030
- Hours 0–23, Minutes 0–59, Seconds 0–59 (if time present)

Steps per row:
1. Try parsing with each format in order
2. If matched and not "YYYY-MM-DD" → auto-correct to YYYY-MM-DD, mark as corrected
3. Apply logical checks on parsed date
4. If no format matches or logical check fails:
   error_type: "date"
   error_message: "Invalid date format. Got '32/13/2025'."
   suggestion: "Use YYYY-MM-DD format (e.g. 2025-04-15)."
```

### 8.4 Payment Mode Validation (paymentValidator.js)

```javascript
VALID_PAYMENT_MODES = ["UPI", "Card", "NetBanking", "Wallet"]

PAYMENT_CORRECTIONS = {
  "upi":         "UPI",
  "UPI":         "UPI",
  "Upi":         "UPI",
  "card":        "Card",
  "CARD":        "Card",
  "netbanking":  "NetBanking",
  "net_banking": "NetBanking",
  "net banking": "NetBanking",
  "NETBANKING":  "NetBanking",
  "wallet":      "Wallet",
  "WALLET":      "Wallet",
}

Steps per row:
1. Trim whitespace from value
2. Check if value is in PAYMENT_CORRECTIONS → auto-correct, mark as corrected
3. Check if corrected value is in VALID_PAYMENT_MODES → valid
4. If not correctable:
   error_type: "payment"
   error_message: "Invalid payment mode 'Cash'. Allowed: UPI, Card, NetBanking, Wallet."
   suggestion: "Use one of: UPI, Card, NetBanking, Wallet."
```

### 8.5 Data Integrity Validation (integrityValidator.js)

```javascript
Checks in order:

1. NULL / EMPTY CHECK (all required fields)
   - If customer_name, phone, country, product_name are empty string or null
   error_type: "missing"
   error_message: "Missing required field: customer_name"

2. DUPLICATE ORDER ID CHECK
   - Build Set of seen order_ids before row loop
   - If order_id already in Set:
   error_type: "duplicate"
   error_message: "Duplicate order_id: ORD00123. Already seen at row 45."
   suggestion: "Ensure each order has a unique ID."

3. DATA TYPE CHECKS
   - quantity must be parseable as integer (parseInt)
   - price must be parseable as float (parseFloat)
   error_type: "integrity"
   error_message: "Invalid type for quantity. Expected integer, got 'abc'."

4. RANGE CHECKS
   - quantity must be > 0 (not zero, not negative)
   - price must be > 0 (not zero, not negative)
   error_type: "integrity"
   error_message: "Invalid value for price: -500. Must be greater than 0."
   suggestion: "Ensure price and quantity are positive numbers."

5. PAYMENT STATUS CHECK
   VALID_STATUSES = ["Completed", "Pending", "Failed", "Refunded"]
   - Case-insensitive match, auto-correct capitalisation if off
   - If value not in valid statuses → flag error
```

---

## 9. Auto-Correction Rules

All corrections are non-destructive — original value is preserved in error log.

| Field         | Original         | Corrected To   | Logged As      |
|---------------|------------------|----------------|----------------|
| payment_mode  | upi, UPI , Upi   | UPI            | auto-corrected |
| payment_mode  | card, CARD       | Card           | auto-corrected |
| payment_mode  | netbanking       | NetBanking     | auto-corrected |
| payment_mode  | wallet, WALLET   | Wallet         | auto-corrected |
| order_date    | 2025/04/15       | 2025-04-15     | auto-corrected |
| order_date    | 15-04-2025       | 2025-04-15     | auto-corrected |
| order_date    | 15/04/2025       | 2025-04-15     | auto-corrected |
| country       | india, INDIA     | India          | auto-corrected |
| payment_status| completed        | Completed      | auto-corrected |
| phone         | +91 9876543210   | 9876543210     | auto-corrected |

Auto-corrected rows are counted as VALID rows.
All corrections are recorded in the error log with error_type: "corrected".

---

## 10. Chunking Logic — Intelligent Balancing

```javascript
// chunkingService.js

const CHUNK_SIZE = 10000; // from env

function chunkRows(rows) {
  const total = rows.length;

  if (total <= CHUNK_SIZE) {
    return null; // no chunking needed
  }

  // Intelligent balancing: no tiny last chunk
  // Example: 10001 rows → 2 chunks of 5000 + 5001 (NOT 10000 + 1)
  const chunkCount = Math.ceil(total / CHUNK_SIZE);
  const baseSize   = Math.floor(total / chunkCount);
  const remainder  = total % chunkCount;

  const chunks = [];
  let start = 0;

  for (let i = 0; i < chunkCount; i++) {
    // Distribute remainder rows one-by-one across first N chunks
    const size = baseSize + (i < remainder ? 1 : 0);
    chunks.push(rows.slice(start, start + size));
    start += size;
  }

  // chunks[i] contains the actual row arrays
  // Name them: chunk_1.csv, chunk_2.csv, ...
  return chunks;
}

// Chunking examples:
// 10001 rows → chunkCount=2 → [5001, 5000]
// 25000 rows → chunkCount=3 → [8334, 8333, 8333]
// 100000 rows → chunkCount=10 → [10000, 10000, ...]
```

---

## 11. File Output & Storage Flow

```
After validation:
1. Build clean_rows[]    → rows with zero errors (after auto-correction)
2. Build invalid_rows[]  → rows with unfixable errors
3. Build error_log[]     → { row_number, field, error_type, message, suggestion }

Generate files (in memory — never write to EC2 disk):
4. clean_data.csv        → CSV string of clean_rows
5. invalid_rows.csv      → CSV string of invalid_rows
6. error_report.csv      → CSV string of error_log
7. summary_report.pdf    → PDF from Gemini AI output (using pdfkit)

If clean_rows > CHUNK_SIZE:
8. chunkingService splits clean_rows into balanced chunks
9. Each chunk → chunk_1.csv, chunk_2.csv, ... (CSV strings in memory)

Package into ZIP (using archiver library):
10. ZIP contains:
    ├── chunk_1.csv (or clean_data.csv if no chunking)
    ├── chunk_2.csv (if chunked)
    ├── invalid_rows.csv
    ├── error_report.csv
    └── summary_report.pdf

Upload to Supabase Storage:
11. storageService.upload(`uploads/${uploadId}/output.zip`, zipBuffer)
12. storageService.upload(`uploads/${uploadId}/clean_data.csv`, cleanCsvBuffer) [if not chunked]
13. storageService.upload(`uploads/${uploadId}/invalid_rows.csv`, invalidBuffer)
14. storageService.upload(`uploads/${uploadId}/error_report.csv`, errorBuffer)
15. storageService.upload(`uploads/${uploadId}/summary_report.pdf`, pdfBuffer)

Save storage paths to uploads table in Supabase DB.
```

---

## 12. Complete API Routes

### Authentication
```
POST /api/auth/register
  Body: { name, email, password }
  Returns: { token, user: { id, name, email } }

POST /api/auth/login
  Body: { email, password }
  Returns: { token, user: { id, name, email } }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Returns: { id, name, email, created_at }
```

### Upload
```
POST /api/upload
  Headers: Authorization: Bearer <token>
  Body: multipart/form-data → file: <csv file>
  Process:
    1. Parse CSV headers only (no full parse yet)
    2. Run columnValidator → if missing columns: return 400 with missing column names
    3. If extra columns: return 200 with { needsMapping: true, extraColumns: [...] }
    4. If columns OK: save upload record to DB with status "pending"
    5. Return { uploadId, status: "pending" }

POST /api/upload/:uploadId/confirm-mapping
  Headers: Authorization: Bearer <token>
  Body: { mapping: { "extra_col": "expected_col" | null } }
  Returns: { uploadId, status: "ready" }
```

### Validation
```
POST /api/validate/:uploadId
  Headers: Authorization: Bearer <token>
  Process:
    1. Fetch upload record, verify belongs to current user
    2. Fetch CSV from Supabase Storage OR from memory (if just uploaded)
    3. Run full validation pipeline
    4. Generate all output files
    5. Upload all files to Supabase Storage
    6. Save all errors to errors table
    7. Update uploads record with final stats + storage paths
    8. Call Gemini for AI summary → save to ai_reports table
    9. Return full validation result
  Returns: {
    uploadId,
    totalRows, validRows, invalidRows,
    qualityScore,
    isChunked, chunkCount,
    errorBreakdown: { phone: N, date: N, payment: N, integrity: N, duplicate: N },
    aiSummary: { summary, recommendations }
  }
```

### Reports
```
GET /api/report/:uploadId
  Headers: Authorization: Bearer <token>
  Returns: full report JSON (stats + error breakdown + AI summary)

GET /api/errors/:uploadId
  Headers: Authorization: Bearer <token>
  Query params:
    ?type=phone|date|payment|integrity|duplicate|missing|corrected|all (default: all)
    ?page=1 (default: 1)
    ?limit=50 (default: 50)
  Returns: { errors: [...], total, page, totalPages }

GET /api/uploads
  Headers: Authorization: Bearer <token>
  Returns: array of all uploads for current user, sorted by uploaded_at DESC

GET /api/uploads/:uploadId
  Headers: Authorization: Bearer <token>
  Returns: single upload detail
```

### Downloads
```
All download routes:
- Require Authorization: Bearer <token>
- Verify upload belongs to current user
- Generate signed URL from Supabase Storage (valid 60 minutes)
- Return { downloadUrl } — frontend opens this URL directly

GET /api/download/zip/:uploadId       → signed URL for output.zip
GET /api/download/clean/:uploadId     → signed URL for clean_data.csv
GET /api/download/invalid/:uploadId   → signed URL for invalid_rows.csv
GET /api/download/errors/:uploadId    → signed URL for error_report.csv
GET /api/download/summary/:uploadId   → signed URL for summary_report.pdf
```

---

## 13. Quality Score Calculation

```javascript
// qualityService.js

function calculateScore(totalRows, validRows) {
  return Math.round((validRows / totalRows) * 100 * 10) / 10; // 1 decimal
}

function calculateBreakdown(totalRows, errorLog) {
  const phoneErrors     = errorLog.filter(e => e.error_type === "phone").length;
  const dateErrors      = errorLog.filter(e => e.error_type === "date").length;
  const paymentErrors   = errorLog.filter(e => e.error_type === "payment").length;
  const integrityErrors = errorLog.filter(e => e.error_type === "integrity").length;
  const duplicateErrors = errorLog.filter(e => e.error_type === "duplicate").length;
  const missingErrors   = errorLog.filter(e => e.error_type === "missing").length;
  const corrected       = errorLog.filter(e => e.error_type === "corrected").length;

  const rowsWithNoErrors = totalRows - new Set(errorLog.map(e => e.rowNumber)).size;

  return {
    completeness: Math.round(((totalRows - missingErrors) / totalRows) * 100),
    accuracy:     Math.round(((totalRows - phoneErrors - dateErrors - paymentErrors) / totalRows) * 100),
    consistency:  Math.round(((totalRows - duplicateErrors - integrityErrors) / totalRows) * 100),
    correctedCount: corrected,
    errorBreakdown: { phoneErrors, dateErrors, paymentErrors, integrityErrors, duplicateErrors, missingErrors }
  };
}
```

---

## 14. Gemini AI Summary (geminiService.js)

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSummary(stats) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a data quality analyst. Analyze this transaction dataset validation report.

Stats:
- Total Rows: ${stats.totalRows}
- Valid Rows: ${stats.validRows}
- Invalid Rows: ${stats.invalidRows}  
- Quality Score: ${stats.qualityScore}%
- Auto-Corrected Rows: ${stats.correctedCount}
- Phone Errors: ${stats.phoneErrors}
- Date Errors: ${stats.dateErrors}
- Payment Errors: ${stats.paymentErrors}
- Integrity Errors: ${stats.integrityErrors}
- Duplicate Order IDs: ${stats.duplicateErrors}

Generate a JSON response ONLY with this exact structure:
{
  "summary": "3-4 sentence executive summary of data quality",
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2", 
    "Specific recommendation 3"
  ],
  "topIssue": "Name of the single biggest data quality issue"
}
`;

  const result   = await model.generateContent(prompt);
  const text     = result.response.text();
  const cleaned  = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
```

---

## 15. Supabase Storage Service (storageService.js)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role — full access
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

// Upload a file buffer to Supabase Storage
async function uploadFile(storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

// Generate a signed URL (valid 1 hour)
async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

export { uploadFile, getSignedUrl };
```

---

## 16. Frontend Pages & Components

### ProtectedRoute.jsx
```jsx
// Checks localStorage for JWT token
// If no token → redirect to /login
// If token expired → redirect to /login
```

### Upload.jsx
```
UI Flow:
1. Drag-and-drop zone (accepts .csv only, max 100MB)
2. Show selected file name + size
3. Click "Upload & Validate"
4. Call POST /api/upload
   a. If { needsMapping: true } → show ColumnMapper component
   b. If missing columns → show error banner with missing column names
   c. If success → call POST /api/validate/:uploadId
5. Show progress bar/spinner during processing
6. On completion → navigate to /dashboard/:uploadId
```

### ColumnMapper.jsx
```
Shows a table:
| Extra Column Found | Map To (dropdown) |
|--------------------|-------------------|
| customer_email     | [ignore ▼]        |
| txn_id             | [order_id ▼]      |

Dropdown options: ignore | order_id | customer_name | phone | ...
Submit → POST /api/upload/:uploadId/confirm-mapping
```

### Dashboard.jsx (for current upload)
```
Fetch GET /api/report/:uploadId

Display:
1. File name + upload timestamp
2. 4 Summary Cards: Total Rows | Valid Rows | Invalid Rows | Quality Score
3. Quality Breakdown bar: Completeness % | Accuracy % | Consistency %
4. Before/After comparison bar chart (Recharts BarChart)
   - X: categories (Total, Valid, Invalid, Auto-corrected)
   - Two bars: raw vs processed
5. Error Distribution Pie/Donut Chart (Recharts PieChart)
   - Slices: Phone | Date | Payment | Integrity | Duplicate | Missing
6. Errors by Country Bar Chart (Recharts BarChart)
7. AI Summary Box:
   - Gemini summary paragraph
   - 3 bullet recommendations
   - Top issue badge
8. Download Buttons:
   - ZIP (always shown)
   - Clean CSV (shown only if not chunked)
   - Invalid Rows CSV
   - Error Report CSV
   - AI Summary PDF
   - Show chunk count if chunked: "Downloaded as 3 chunks in ZIP"
9. Error Table (paginated, 50/page):
   - Columns: Row # | Field | Error Type | Original Value | Message | Suggestion
   - Filter tabs: All | Phone | Date | Payment | Integrity | Duplicates | Auto-Fixed
```

### History.jsx
```
Fetch GET /api/uploads

Display:
- Header: "X total uploads | Avg quality score: Y%"
- Table per upload:
  | Filename | Upload Date | Total Rows | Quality Score | Status | Action |
  | Orders_Q2.csv | Jun 16 2026 | 1,000 | 94% | ✅ Completed | View Report |
- "View Report" → navigate to /report/:uploadId
- Empty state if no uploads yet
```

### ReportDetail.jsx
```
Same layout as Dashboard.jsx
Loads historical upload by :uploadId from URL
All download links regenerate fresh signed URLs on open
```

### Navbar.jsx
```
Left: Logo + "Xeno Validator" text
Center: Upload | History (links, highlight active)
Right: User name + Logout button
Hidden on /login and /register
```

### services/api.js
```javascript
import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register       = (data)         => API.post("/auth/register", data);
export const login          = (data)         => API.post("/auth/login", data);
export const getMe          = ()             => API.get("/auth/me");

// Upload
export const uploadCSV      = (formData)     => API.post("/upload", formData);
export const confirmMapping = (id, mapping)  => API.post(`/upload/${id}/confirm-mapping`, { mapping });
export const validateUpload = (id)           => API.post(`/validate/${id}`);

// Reports
export const getReport      = (id)           => API.get(`/report/${id}`);
export const getErrors      = (id, params)   => API.get(`/errors/${id}`, { params });
export const getHistory     = ()             => API.get("/uploads");
export const getUpload      = (id)           => API.get(`/uploads/${id}`);

// Downloads (returns { downloadUrl } → open in new tab)
export const downloadZip     = (id) => API.get(`/download/zip/${id}`);
export const downloadClean   = (id) => API.get(`/download/clean/${id}`);
export const downloadInvalid = (id) => API.get(`/download/invalid/${id}`);
export const downloadErrors  = (id) => API.get(`/download/errors/${id}`);
export const downloadSummary = (id) => API.get(`/download/summary/${id}`);
```

---

## 17. Backend Dependencies (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "@supabase/supabase-js": "^2.39.0",
    "multer": "^1.4.5-lts.1",
    "csv-parse": "^5.5.3",
    "csv-stringify": "^6.4.4",
    "archiver": "^6.0.1",
    "pdfkit": "^0.14.0",
    "@google/generative-ai": "^0.2.1",
    "date-fns": "^3.3.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 18. Multer Config — Memory Storage (upload.js middleware)

```javascript
import multer from "multer";

// Store in memory — never write to EC2 disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  }
});

export default upload;
```

---

## 19. Express App Entry Point (app.js)

```javascript
import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";

import authRoutes     from "./routes/auth.js";
import uploadRoutes   from "./routes/upload.js";
import validateRoutes from "./routes/validate.js";
import reportRoutes   from "./routes/report.js";
import downloadRoutes from "./routes/download.js";
import errorHandler   from "./middleware/errorHandler.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/auth",     authRoutes);
app.use("/api",          uploadRoutes);
app.use("/api",          validateRoutes);
app.use("/api",          reportRoutes);
app.use("/api/download", downloadRoutes);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 20. Standard API Response Format

Every API response follows this format:
```json
// Success
{ "success": true, "data": { ... }, "message": "Upload successful" }

// Error
{ "success": false, "error": "Missing required columns: phone, country", "code": 400 }
```

---

## 21. AWS EC2 Deployment — Step by Step

### 21.1 Launch EC2
```
AMI:          Ubuntu 22.04 LTS
Instance:     t2.small (recommended) or t2.micro
Storage:      20GB root EBS (files never stored here — just app code)
Security Group open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### 21.2 Initial Server Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx nodejs npm git
sudo npm install -g pm2
```

### 21.3 Deploy Backend
```bash
cd /home/ubuntu
git clone <your-repo> project
cd project/backend
npm install
cp .env.example .env
nano .env   # fill in SUPABASE_URL, keys, GEMINI_API_KEY, JWT_SECRET

# Start with PM2 (auto-restart on crash)
pm2 start src/app.js --name xeno-backend
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### 21.4 Deploy Frontend
```bash
cd /home/ubuntu/project/frontend
# Set VITE_API_BASE_URL in .env
echo "VITE_API_BASE_URL=http://your-ec2-ip/api" > .env
npm install
npm run build
# dist/ folder is now built
```

### 21.5 Nginx Configuration
```nginx
# /etc/nginx/sites-available/xeno
server {
    listen 80;
    server_name your-ec2-public-ip;

    # Serve React frontend
    location / {
        root /home/ubuntu/project/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/xeno /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 22. Build Phases

### Phase 1 — Backend Foundation
- Express app setup with all middleware
- Supabase client config
- JWT auth routes (register, login, me)
- Multer upload middleware
- POST /api/upload (column validation only, no row validation yet)
- Test: register → login → upload CSV → get uploadId

### Phase 2 — Validation Engine
- All 5 validators (column, phone, date, payment, integrity)
- Correction service
- Quality score service
- POST /api/validate/:uploadId runs full pipeline
- Generates clean CSV, invalid CSV, error report CSV in memory
- Saves all errors to Supabase errors table
- Updates uploads table
- Test: validate sample CSV → check error counts in Supabase dashboard

### Phase 3 — Files, Chunking, AI, Downloads
- Chunking service (intelligent balancing)
- Archiver ZIP generation in memory
- Supabase Storage upload for all output files
- Gemini AI summary generation
- PDF generation with pdfkit
- All download routes (signed URLs)
- Column mapping flow (ColumnMapper)
- Test: upload 15k row CSV → should produce 2 balanced chunks → downloadable ZIP

### Phase 4 — React Frontend
- All pages (Login, Register, Upload, Dashboard, History, ReportDetail)
- All components (Navbar, ColumnMapper, ErrorTable, Charts)
- Recharts integration (bar, pie, line charts)
- Download flow (signed URL → open in new tab)
- Protected routes
- Test: full end-to-end browser flow

### Phase 5 — EC2 Deployment
- EC2 launch + Nginx config
- PM2 process management
- Frontend build + serve
- End-to-end test on public URL
- Record 2-minute walkthrough video

---

## 23. Test CSV Details

Use the provided test files:
- `transactions_1k.csv` — 1000 rows, ~8% errors
- `transactions_10k.csv` — 10000 rows, ~8% errors

The 10k file is exactly at the chunking threshold — upload it, it should NOT chunk (10000 = limit).
To test chunking, use a file with 10001+ rows.

Errors deliberately seeded in test files:
- Invalid phone numbers (wrong digit count for country)
- Wrong date formats (YYYY/MM/DD and DD-MM-YYYY)
- Lowercase/misspelled payment modes (upi, netbanking)
- Duplicate order IDs (~2% of rows)
- Negative prices and quantities

---

## 24. Important Implementation Notes for Claude

1. **Never write files to EC2 disk** — use multer memoryStorage() + Supabase Storage only
2. **Always verify ownership** before serving files — check `uploads.user_id === req.user.id`
3. **Gemini always in try/catch** — if API fails, return placeholder summary, do not crash
4. **Signed URLs expire** — generate fresh signed URL on every download request, never cache
5. **CSV parsing** — use `csv-parse` library with `columns: true` option for header-based access
6. **ZIP in memory** — use `archiver` with `archiver.create('zip')` piped to a PassThrough stream
7. **CORS** — `allow_origins: ["*"]` for now (restrict to EC2 domain in production)
8. **Column mapping** — store mapping decision in uploads table as JSON column `column_mapping`
9. **PDF generation** — use `pdfkit` streaming API, pipe to Buffer
10. **Row numbering** — row numbers in error log are 1-indexed (row 1 = first data row after header)
11. **Recharts data format** — `[{ name: "Phone", value: 12 }, ...]`
12. **All UUIDs** — use Supabase auto-generated UUIDs (gen_random_uuid()), not integer IDs

---

## 25. Submission Checklist

- [ ] Platform live at public EC2 HTTP URL
- [ ] Register + Login works
- [ ] CSV upload with column validation works
- [ ] Column mapper shows for extra columns
- [ ] Full validation runs and shows results
- [ ] Quality score displayed correctly
- [ ] All 4+ charts visible on Dashboard
- [ ] Gemini AI summary appears
- [ ] ZIP download works (contains all output files)
- [ ] Chunking works for 10001+ row files
- [ ] History page shows all past uploads
- [ ] Re-download from history works
- [ ] 2-minute walkthrough video recorded (screen + voice)
- [ ] 2-3 line approach write-up ready
