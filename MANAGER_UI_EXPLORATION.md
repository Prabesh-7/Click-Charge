# Manager UI Features - Comprehensive Exploration

**Project:** ClickAndCharge EV Charging Station Management System  
**Frontend Path:** `frontend/src/features/manager/`  
**Total Pages:** 14  
**Styling Approach:** Tailwind CSS (utility-first)  
**UI Components:** shadcn/ui + Custom Tailwind-styled elements  
**Form Library:** react-hook-form + Zod validation

---

## Directory Structure

```
frontend/src/features/manager/
├── pages/
│   ├── ManagerDashboard.tsx
│   ├── MyChargers.tsx
│   ├── AddCharger.tsx
│   ├── ChargerControl.tsx
│   ├── ChargingSessions.tsx
│   ├── ManageSlots.tsx
│   ├── MyStaff.tsx
│   ├── AddStaff.tsx
│   ├── Pricing.tsx
│   ├── Reservations.tsx
│   ├── SlotList.tsx
│   ├── StationDetails.tsx (COMMENTED OUT - In Development)
│   ├── StationReviews.tsx
│   └── LiveSession.tsx
```

**Note:** No separate `/components/` folder; all UI logic is contained in page files.

---

## Page-by-Page Analysis

### 1. **ManagerDashboard.tsx**

**Route:** `/manager/dashboard`  
**Purpose:** Overview/homepage showing key metrics

**Key Features:**

- 3-column metric grid (responsive: 1 col mobile → 3 cols desktop)
- Total chargers count
- Total wallet balance (Rs currency)
- Station name and address card

**Current Styling:**

```
Layout:
- Container: p-6 (main padding)
- Title: text-3xl font-bold text-gray-900
- Subtitle: text-sm text-gray-600 mt-2
- Loading state: text-center py-8
- Error: flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700

Metric Cards:
- Grid: grid grid-cols-1 md:grid-cols-3 gap-5
- Card: bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow
- Label: text-xs font-semibold uppercase tracking-wide text-gray-600
- Value: text-3xl font-bold text-gray-900 mt-3
```

**API Integration:**

- `getMyChargers()` - fetch charger count
- `getMyStation()` - fetch station details
- `getManagerWallet()` - fetch wallet balance
- All calls run in parallel via `Promise.all()`

**State Management:**

- `totalChargers`, `totalBalance`, `station` (data)
- `loading`, `error` (UI states)

---

### 2. **MyChargers.tsx**

**Route:** `/manager/mychargers`  
**Purpose:** View, edit, and delete chargers with modal forms

**Layout:**

- Header with live indicator badge + "My Chargers" title
- Add Charger button (top right)
- Charger grid or empty state
- Edit/Delete modals

**Current Styling:**

**Header:**

```
Main container: min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10
Header: mb-6 flex items-start justify-between gap-4
Title: text-3xl font-bold tracking-tight text-gray-900
Subtitle: mt-1.5 text-sm text-gray-500
Live badge: inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]
Status label: text-xs font-semibold uppercase tracking-widest text-[#22C55E]
Add button: h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors
```

**Charger Cards Grid:**

```
Grid: grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2
Card: overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg

Header section (border-b):
- p-4
- Name: truncate text-base font-bold text-gray-900
- Charge Point ID: mt-1 text-xs text-gray-500
- Status badge: inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold
  * AVAILABLE: bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20
  * IN_CHARGING: bg-orange-100 text-orange-700 border border-orange-200
  * RESERVED: bg-red-100 text-red-700 border border-red-200

Spec grid (2x2):
- grid grid-cols-2 gap-2 text-xs
- Each cell: rounded-lg bg-gray-50 px-2.5 py-2
- Label: text-gray-500
- Value: font-semibold text-gray-800

Connectors section (space-y-2 p-4):
- Title: text-xs font-semibold uppercase tracking-widest text-gray-500
- Free count: rounded-md bg-[#22C55E]/10 px-2 py-1 text-xs font-bold text-[#22C55E]
- Each connector: flex justify-between rounded-lg bg-gray-50 px-3 py-2.5
  * Icon: h-8 w-8 rounded-lg bg-white text-[#22C55E] shadow-sm
  * Status: shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold
```

**Edit/Delete Buttons:**

```
Positioned at bottom right of card
- Edit (blue): p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors
- Delete (red): p-2 text-red-600 hover:bg-red-50 rounded transition-colors
```

**Modal Styling (shadcn Dialog):**

```
Form fields in modal:
- Field component with gap-2
- Label: text-sm font-medium text-gray-700
- Input: h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400
- Error text: text-xs text-red-600 mt-1
```

**Key Features:**

- Add new charger modal with form
- Edit existing charger modal with pre-filled values
- Delete confirmation dialog
- Status color coding for chargers and connectors
- Connector availability counter

**Data Types:**

```typescript
Charger {
  charger_id: number
  station_id: number
  name: string
  charge_point_id: string
  connectors: Connector[]
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED"
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO"
  price_per_kwh: number
  max_power_kw: number
  current_transaction_id?: number
  created_at: string
  last_status_change: string
}
```

**Forms:**

- Uses `createChargerSchema` (Zod validation)
- Fields: name, connector_count, type, max_power_kw, price_per_kwh
- Two form instances: one for edit, one for add (managed separately)

---

### 3. **AddCharger.tsx**

**Route:** `/manager/addcharger`  
**Purpose:** Standalone page to add a new charger

**Layout:**

```
Container: container mx-auto mt-5 max-w-lg
Header: mb-6
Title: text-2xl font-bold text-gray-900
Subtitle: text-sm text-gray-500 mt-1
Form: space-y-6
```

**Form Fields:**

1. **Charger Name** - text input
2. **Number of Connectors** - number input (min:1, max:20)
3. **Charger Type** - select dropdown (CCS2, GBT, TYPE2, CHAdeMO)
4. **Max Power (kW)** - number input
5. **Price per kWh (Rs)** - number input with step 0.01
6. **Transaction ID** - optional number input

**Input Styling:**

```
Field wrapper: gap-2
Label: text-sm font-medium text-gray-700
Input: h-10 border border-gray-300 rounded-lg
       focus:ring-2 focus:ring-emerald-500 focus:border-transparent
       transition-colors bg-white text-gray-900 placeholder:text-gray-400
Error: text-xs text-red-600 mt-1
```

**Submit Button:**

```
bg-emerald-600 hover:bg-emerald-700 text-white
rounded-lg font-semibold py-2 px-4
transition-colors disabled:opacity-50
Loading state: Shows "Adding..." text
```

---

### 4. **ChargerControl.tsx**

**Route:** `/manager/chargercontrol`  
**Purpose:** Real-time charger control and monitoring (start/stop charging)

**Layout:**

```
Main container: min-h-screen bg-gray-50 px-4 py-7
Main section: max-w-6xl mx-auto
```

**Key Features:**

- Charger dropdown selector
- Connector dropdown (only shows AVAILABLE connectors)
- Start Charging button (with validation)
- Error/success messaging
- Real-time status monitoring

**Current Styling:**

```
Title: text-2xl font-bold text-gray-900
Subtitle: text-sm text-gray-600 mt-1

Selector container: rounded-lg border border-gray-200 bg-white p-4 shadow-sm
Select label: text-sm font-semibold text-gray-700
Select input: w-full px-3 py-2 border border-gray-300 rounded-lg

Status display:
- flex items-center gap-2
- Icon: text-emerald-600 (when available)
- Label: font-semibold text-gray-900

Action button:
- bg-emerald-600 hover:bg-emerald-700 text-white
- rounded-lg font-semibold px-4 py-2
- transition-colors disabled:opacity-50
```

**Data Handling:**

- Fetches chargers with connectors via `getMyChargers()`
- Filters connectors by status (only AVAILABLE)
- Uses memoized selectors for performance

**API Calls:**

- `startCharging(connectorId)` - initiate charging
- Uses toast notifications for feedback

---

### 5. **ChargingSessions.tsx**

**Route:** `/manager/chargingsessions`  
**Purpose:** View historical charging sessions with details and invoices

**Layout:**

```
Container: min-h-screen bg-gray-50 px-4 py-7
Header: text-2xl font-bold, subtitle, stats overview
Session list: scrollable table or cards
Detail modal: Shows session details when clicked
```

**Current Styling:**

**Header Section:**

```
Header: mb-6
Title: text-2xl font-bold text-gray-900
Subtitle: mt-1 text-sm text-gray-600

Stats Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
Stat card: rounded-lg border bg-white p-4 shadow-sm
```

**Session List (Table format expected):**

```
Table: min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden
Header row: bg-gray-50
Headers: text-xs font-semibold uppercase text-gray-600 px-4 py-3
Data row: hover:bg-gray-50 border-b border-gray-100
Cells: px-4 py-4 text-sm text-gray-900
```

**Session Card (When expanded/modal):**

```
Modal: DialogContent
Header: DialogHeader with title
Body: space-y-4
- Session info row: flex justify-between
- Details: Energy (kWh), Duration, Amount (Rs)
Footer: DialogFooter with action buttons
```

**Key Data Functions:**

```
formatDateTime(value) - Shows "In Progress" or formatted date
formatClock(value) - Time only (HH:MM)
formatDuration(startTime, endTime) - "X hr Y min" format
formatAmount(value, currency) - "NPR X.XX" format
```

**Data Type:**

```typescript
ChargingSessionItem {
  session_id: number
  charger_id: number
  charger_name: string
  connector_id: number
  connector_number: number
  user_id: number
  user_name: string
  start_time: string
  end_time: string | null
  total_energy_kwh: number
  total_amount: number
  currency: string
  price_per_kwh: number
  invoice_id?: string
  issued_at?: string
}
```

---

### 6. **ManageSlots.tsx**

**Route:** `/manager/manageslots`  
**Purpose:** Create booking time slots for chargers on today's date

**Layout:**

```
Container: min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10
Max width: max-w-6xl mx-auto
Content: space-y-5 (sections stacked)
```

**Current Styling:**

**Header Section:**

```
Section: rounded-xl border border-gray-200 bg-white p-5 shadow-sm
Title: text-2xl font-bold text-gray-900
Subtitle: mt-1 text-sm text-gray-600
Today label: mt-2 text-xs text-gray-500

View Slots button:
- rounded-lg border border-gray-300 bg-white px-4 py-2
- text-sm font-semibold text-gray-700 hover:bg-gray-50
```

**Time Input Section:**

```
Container: rounded-xl border border-gray-200 bg-white p-5 shadow-sm
Title: text-lg font-semibold text-gray-900
Subtitle: text-sm text-gray-600 mt-1

Time inputs:
- Two time inputs (HH:MM format)
- Input: w-32 px-3 py-2 border border-gray-300 rounded-lg
- Duration presets: 20, 60, 120, 180 mins
- Buttons: rounded bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm
```

**Charger Cards Grid:**

```
Grid: grid grid-cols-1 gap-4 md:grid-cols-2
Card: rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm

Card header:
- Charger name: truncate text-base font-bold text-gray-900
- Specs: mt-1 text-xs text-gray-600

Connector list (space-y-2 mt-4):
- Each connector is a button/radio card
- Selected style: border-2 border-emerald-500 bg-white
- Unselected: border border-gray-200 bg-white
- Connector name: text-sm font-semibold
- Status: text-xs text-gray-500

Create button (bottom of card):
- mt-4 w-full bg-emerald-600 hover:bg-emerald-700
- text-white rounded-lg font-semibold py-2
```

**Messages:**

```
Error: rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700
Success: rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700
```

**Key Features:**

- Time range selection with validation
- Duration presets (common durations)
- All times in UTC ISO format
- Connector selector across multiple chargers
- Validation: 20-180 min slots, start must be future
- "View Created Slots" button links to SlotList

---

### 7. **MyStaff.tsx**

**Route:** `/manager/mystaff`  
**Purpose:** View, edit, delete staff members assigned to station

**Layout:**

```
Main container: p-6
Header: mb-6 flex items-start justify-between gap-4
Title: text-2xl font-bold text-gray-900
Subtitle: text-sm text-gray-500 mt-1
Add Staff button: (top right if staff exists)

Table or empty state
Edit modal
Add modal
```

**Current Styling:**

**Header:**

```
Title: text-2xl font-bold text-gray-900
Subtitle: text-sm text-gray-500 mt-1
Add button: h-11 px-4 bg-emerald-600 hover:bg-emerald-700
           text-white rounded-lg font-semibold flex items-center gap-2
```

**Staff Table:**

```
Container: bg-white border border-[#B6B6B6] rounded-lg shadow-sm overflow-hidden

Table: min-w-full text-sm
Header row: bg-gray-50 text-gray-700
Headers: px-4 py-3 text-left font-semibold

Data rows: border-t hover:bg-gray-50
Cells: px-4 py-3

Action buttons (Actions column):
- Edit button: p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors
- Delete button: p-2 text-red-600 hover:bg-red-50 rounded transition-colors
```

**Empty State:**

```
Container: flex flex-col items-center justify-center px-6 py-16 text-center
Icon: flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400
Text: text-base font-semibold text-gray-700 mb-6
Button: h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold
```

**Edit Modal (shadcn Dialog):**

```
Header: DialogHeader with "Edit Staff" title
Form fields (pre-filled):
- Username
- Email
- Password (optional for edit - shows as optional)
- Phone Number
- Vehicle
Submit: "Update Staff" button
```

**Add Modal (shadcn Dialog):**

```
Header: DialogHeader with "Add Staff" title
Form fields:
- Username (required)
- Email (required)
- Password (required, with show/hide toggle)
- Phone Number (required)
- Vehicle (optional)
Submit: "Add Staff" button
```

**Data Type:**

```typescript
ManagerStaff {
  user_id: number
  user_name: string
  email: string
  phone_number?: string
  vehicle?: string
  created_at: string
}
```

**Form Validation (Zod):**

- Uses `createStaffSchema`
- Username, email, password validation
- Phone, vehicle are optional

---

### 8. **AddStaff.tsx**

**Route:** `/manager/addstaff`  
**Purpose:** Standalone page to add staff to station

**Layout:**

```
Container: container mx-auto mt-5 max-w-lg
Header: mb-6
Title: text-3xl font-bold text-gray-900
Subtitle: text-sm text-gray-600 mt-2
Form: space-y-6
```

**Form Fields:**

1. **Username** - text input
2. **Email** - email input
3. **Password** - password input with show/hide toggle
4. **Phone Number** - tel input
5. **Vehicle** - text input (optional)

**Input Styling (consistent with other forms):**

```
Field wrapper: gap-2
Label: text-sm font-medium text-gray-700
Input: h-10 border border-gray-300 rounded-lg
       focus:ring-2 focus:ring-emerald-500 focus:border-transparent
       transition-colors bg-white text-gray-900 placeholder:text-gray-400
Password toggle: Eye/EyeOff icon, absolute positioned right in input

Error text: text-xs text-red-600 mt-1
```

**Submit Button:**

```
bg-emerald-600 hover:bg-emerald-700 text-white
rounded-lg font-semibold py-2 px-4
transition-colors disabled:opacity-50
Loading: Shows "Adding..." text
```

---

### 9. **Pricing.tsx**

**Route:** `/manager/pricing`  
**Purpose:** Manage charger pricing (price per kWh)

**Layout:**

```
Container: min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10
Max width: max-w-6xl mx-auto
Content sections: space-y-5
```

**Current Styling:**

**Header Section:**

```
Section: rounded-xl border border-gray-200 bg-white p-5 shadow-sm
Title: text-2xl font-bold text-gray-900
Description: mt-1 text-sm text-gray-600
Formula highlight: font-semibold text-gray-800
```

**Status Messages:**

```
Error: rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
Success: rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700
```

**Pricing Table:**

```
Container: overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm
Table: min-w-full divide-y divide-gray-200
Overflow: overflow-x-auto

Table header:
- bg-gray-50
- px-4 py-3
- text-left
- text-xs font-semibold uppercase tracking-wide text-gray-500

Table rows:
- bg-white
- hover:bg-gray-50
- border-b border-gray-200

Table cells:
- px-4 py-4 align-top text-sm
- text-gray-700 or text-gray-900

Input (price field):
- type="number" step="0.01" min={0}
- h-10 w-40 rounded-lg border border-gray-300 px-3 text-sm

Save button:
- rounded-lg bg-blue-600 px-4 py-2
- text-xs font-semibold text-white
- hover:bg-blue-700 disabled:opacity-50
- Loading: "Saving..." text
```

**Key Features:**

- Sorted charger list (alphabetical)
- Inline price editing
- Per-charger save buttons
- Loading states during save
- Session billing formula explanation
- Empty states for no chargers

**Data Type:**

```typescript
ManagerCharger {
  charger_id: number
  name: string
  type: string
  max_power_kw: number
  price_per_kwh: number
}
```

---

### 10. **Reservations.tsx**

**Route:** `/manager/reservations`  
**Purpose:** View and manage slot reservations with confirmation/cancellation flows

**Layout:**

```
Container: p-6
Header: text-2xl font-bold, subtitle
Tabs or sections:
- Active reservations (for today)
- With phone numbers count
Main content: Reservation cards or table
Action modals: Confirmation/cancellation dialogs
```

**Current Styling:**

**Header:**

```
Title: text-2xl font-bold text-gray-900
Subtitle: mt-1 text-sm text-gray-600
```

**Reservation Card/Row:**

```
Container: rounded-lg border border-gray-200 bg-white p-4 shadow-sm
Header: flex justify-between items-start

User info:
- Avatar: h-10 w-10 rounded-full bg-gray-100 (initials inside)
- Name: font-semibold text-gray-900
- Email: text-xs text-gray-500
- Phone: text-xs text-gray-600

Slot details:
- Time range: text-sm text-gray-700
- Date: text-xs text-gray-500
- Duration: text-xs text-gray-500
- Cost: font-semibold text-gray-900

Action buttons:
- Confirm: bg-emerald-100 text-emerald-700 rounded px-3 py-1.5 text-sm font-medium
- Release: bg-red-100 text-red-700 rounded px-3 py-1.5 text-sm font-medium
- Cancel Confirmation: bg-gray-100 text-gray-700 rounded px-3 py-1.5 text-sm font-medium
```

**Key Features:**

- Reserved slots only (status === "RESERVED")
- Sorted by start time (earliest first)
- User display with initials avatar
- Confirmation, release, and cancellation flows
- Success/error toasts
- Phone number reservation tracking

**Data Type:**

```typescript
Slot {
  slot_id: number
  charger_id: number
  connector_id: number
  charger_name: string
  connector_number: number
  status: "OPEN" | "RESERVED" | "CANCELLED"
  start_time: string
  end_time: string
  price: number
  reserved_by_user_id?: number
  reserved_by_name?: string
  reserved_by_email?: string
  reserved_by_phone_number?: string
}
```

---

### 11. **SlotList.tsx**

**Route:** `/manager/slotlist`  
**Purpose:** View all time slots created today with auto-refresh

**Layout:**

```
Container: min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10
Header: text-2xl font-bold, today's date
Slot list: Sorted and grouped by status
Refresh: Auto-refreshes every 5 seconds
```

**Current Styling:**

**Header:**

```
Title: text-2xl font-bold text-gray-900
Subtitle: text-sm text-gray-600 mt-1
Today date: text-xs text-gray-500 mt-2
```

**Slot Cards:**

```
Container: rounded-lg border border-gray-200 bg-white p-4 shadow-sm

Header: flex justify-between items-start gap-3
Charger: text-sm font-semibold text-gray-900
Connector: text-xs text-gray-500

Time info:
- Time range: text-sm text-gray-700
- Date: text-xs text-gray-500
- Duration: text-xs text-gray-500
- Status badge: inline-flex rounded-full px-2.5 py-1 text-xs font-semibold
  * OPEN: bg-emerald-100 text-emerald-700
  * RESERVED: bg-amber-100 text-amber-700
  * CANCELLED: bg-slate-100 text-slate-700

Action button: View Details (links to charger control if needed)
```

**Empty State:**

```
Centered message: text-sm text-gray-500
No slots message with refresh instruction
```

**Key Features:**

- Auto-refresh every 5 seconds
- Sorted by status (OPEN → RESERVED → CANCELLED)
- Then sorted by start time (earliest first)
- Shows today's date label
- Real-time updates without page reload

**Utility Functions:**

```
formatClock(value) - HH:MM format
formatSlotDate(value) - "Fri, 15 Dec, 2024"
formatTimeRange(startTime, endTime) - "HH:MM - HH:MM"
formatDuration(startTime, endTime) - "X hr Y min"
formatStatus(value) - Replaces underscores with spaces
getStatusClass(status) - Color styling based on status
```

---

### 12. **StationDetails.tsx**

**Status:** ⚠️ **COMMENTED OUT / IN DEVELOPMENT**  
**Route:** `/manager/stationdetails` (currently inactive)  
**Purpose:** Edit station amenities, description, images (when uncommented)

**Planned Features (from comments):**

- Station description editing
- Phone number
- Amenity toggles: WiFi, parking, food, coffee, bedroom, restroom
- Station image upload
- Form submission and error handling

**Note:** This file is entirely commented out and not currently used. The form state structure is visible but no UI implementation is active.

---

### 13. **StationReviews.tsx**

**Route:** `/manager/stationreviews`  
**Purpose:** View customer reviews and ratings for station

**Layout:**

```
Container: p-6
Header: text-2xl font-bold, subtitle
Stats cards: Average rating + review count
Search bar: Filter reviews
Review list: Scrollable review cards
```

**Current Styling:**

**Header:**

```
Title: text-2xl font-bold text-gray-900
Subtitle: mt-1 text-sm text-gray-500
```

**Stats Grid:**

```
Grid: grid grid-cols-1 gap-3 md:grid-cols-2

Rating card:
- rounded-lg border border-amber-200 bg-amber-50 p-4
- Icon: fill-amber-400 text-amber-500 mr-2
- Label: text-sm text-amber-700
- Value: text-xl font-semibold text-amber-900

Review count card:
- rounded-lg border border-gray-200 bg-white p-4
- Icon: text-gray-600 mr-2
- Label: text-sm text-gray-600
- Value: text-xl font-semibold text-gray-900
```

**Search Bar:**

```
Container: mt-4 mb-4
Input: rounded-lg border border-gray-300 px-3 py-2 w-full
Icon: Search icon left-aligned
Placeholder: "Search reviews..."
```

**Review Card:**

```
Container: rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-3

Header:
- flex justify-between items-start
- User: font-semibold text-gray-900
- Date: text-xs text-gray-500

Rating:
- Star icons with fill (amber color)
- text-sm font-semibold

Review text:
- text-sm text-gray-700 mt-2
- Italic styling for review_text field
```

**Empty State:**

```
Centered: text-sm text-gray-500
Message: "No reviews yet" or "No reviews match search"
```

**Data Type:**

```typescript
ManagerStationReview {
  review_id: number
  user_name: string
  user_email: string
  rating: number (1-5)
  review_text: string
  created_at: string
}

ManagerStationReviewSummary {
  review_count: number
  average_rating: number
}
```

**Key Features:**

- Search filtering (case-insensitive)
- Filter by name, email, or review text
- Average rating calculation
- Star display
- Pagination ready (although not visible in current code)

---

### 14. **LiveSession.tsx**

**Route:** `/manager/livesession`  
**Purpose:** Monitor active charging sessions in real-time with meter values

**Layout:**

```
Container: min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10
Header: Title + connector selector
Active sessions: Real-time meter display
Meter metrics: Power, voltage, current, energy, SOC, temperature
Stop charging: Action button with confirmation
Invoice history: Previous invoices table
```

**Current Styling:**

**Header:**

```
Title: text-2xl font-bold text-gray-900
Subtitle: text-sm text-gray-600 mt-1
Connector selector: Dropdown showing "Charger Name - Connector X"
```

**Meter Display:**

```
Sections (organized by category):
1. Power & Energy (Blue background)
2. Electrical (Green background)
3. Environmental (Orange background)

Metric card:
- rounded-lg p-3 bg-color-50 (varies by section)
- Label: text-xs font-semibold uppercase text-color-600
- Value: text-lg font-bold text-color-900
- Unit: text-xs text-color-600
- Updated: text-[10px] text-gray-500
```

**Stop Charging Button:**

```
bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold
px-4 py-2 transition-colors disabled:opacity-50
With loading: "Stopping..." text
```

**Invoice Table:**

```
Container: mt-6 rounded-lg border border-gray-200 bg-white overflow-hidden
Table: min-w-full divide-y divide-gray-200

Headers:
- text-xs font-semibold uppercase text-gray-600 bg-gray-50
- px-4 py-3 text-left

Rows:
- px-4 py-3 text-sm text-gray-900
- hover:bg-gray-50

Invoice ID: font-semibold
Energy: numeric value + unit
Amount: Rs format
```

**Data Type:**

```typescript
MeterValues {
  connector_number?: number
  transaction_id?: number
  power_kw: number
  voltage_v: number
  current_a: number
  energy_kwh: number
  price_per_kwh?: number
  running_amount?: number
  currency?: string
  soc_percent: number
  timestamp: string
}

ChargingInvoice {
  invoice_id: string
  issued_at: string
  currency: string
  charger_id: number
  charger_name: string
  connector_id: number
  connector_number: number
  total_energy_kwh: number
  price_per_kwh: number
  total_amount: number
}
```

**Key Features:**

- Real-time meter value updates
- Multiple metric categories
- Stop charging action with confirmation
- Invoice history display
- Preferred session state support (navigation via state)
- Multiple active sessions handling

---

## Common UI Patterns & Components

### Form Components Used Across All Pages:

```
- Field (from @/components/ui/field) - wrapper for form fields
- FieldLabel - label styling component
- Input (from @/components/ui/input) - text/number inputs
- Button (from @/components/ui/button) - action buttons
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter (shadcn)
- Toast notifications (from sonner library)
```

### Color Scheme:

**Status Colors:**
| Status | Tailwind Classes | Usage |
|--------|------------------|-------|
| Available | bg-[#22C55E]/10 text-[#22C55E] | Charger/connector available |
| In Charging | bg-orange-100 text-orange-700 | Active charging session |
| Reserved | bg-red-100 text-red-700 | Slot reserved |
| Cancelled | bg-slate-100 text-slate-700 | Cancelled slot |
| Open (slot) | bg-emerald-100 text-emerald-700 | Open/available slot |

**Action Colors:**
| Action | Color | Class |
|--------|-------|-------|
| Primary (Add/Create) | Emerald | bg-emerald-600 hover:bg-emerald-700 |
| Edit | Blue | text-blue-600 hover:bg-blue-50 |
| Delete | Red | text-red-600 hover:bg-red-50 |
| Destructive/Stop | Red | bg-red-600 hover:bg-red-700 |
| Secondary | Gray | bg-gray-100 hover:bg-gray-200 |

**Neutral Colors:**

- Backgrounds: gray-50, white
- Borders: gray-200, gray-300
- Text: gray-900 (primary), gray-600 (secondary), gray-500 (tertiary)
- Shadows: shadow-sm, hover:shadow-md

### Typography:

| Element        | Tailwind                                      | Usage             |
| -------------- | --------------------------------------------- | ----------------- |
| Page Title     | text-3xl font-bold text-gray-900              | Main page heading |
| Section Title  | text-2xl font-bold text-gray-900              | Section heading   |
| Subsection     | text-lg font-semibold text-gray-900           | Sub-heading       |
| Card Title     | text-base font-bold text-gray-900             | Card heading      |
| Body Text      | text-sm text-gray-900                         | Main content      |
| Secondary Text | text-sm text-gray-600                         | Descriptions      |
| Tertiary Text  | text-xs text-gray-500                         | Meta info         |
| Label          | text-xs font-semibold uppercase text-gray-600 | Field labels      |
| Badge          | text-xs font-semibold                         | Status badges     |

### Layout Patterns:

**Header Section:**

```
<div className="mb-6">
  <h1 className="text-3xl font-bold text-gray-900">Title</h1>
  <p className="text-sm text-gray-600 mt-2">Subtitle</p>
</div>
```

**Content Container:**

```
<main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
  <div className="mx-auto max-w-6xl">
    {/* content */}
  </div>
</main>
```

**Grid Layouts:**

```
- 1 col mobile: grid grid-cols-1
- 2 col tablet: md:grid-cols-2
- 3 col desktop: lg:grid-cols-3
- Gap: gap-4, gap-5, gap-6
```

**Card Style:**

```
className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
```

**Button Style:**

```
Primary: "bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold px-4 py-2 transition-colors"
Secondary: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-semibold px-4 py-2"
Icon: "p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
```

### Form Patterns:

**Input Field:**

```jsx
<Field className="gap-2">
  <FieldLabel className="text-sm font-medium text-gray-700">Label</FieldLabel>
  <Input
    className="h-10 border border-gray-300 rounded-lg 
               focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
               transition-colors bg-white text-gray-900 placeholder:text-gray-400"
    placeholder="..."
    {...register("fieldName")}
  />
  {errors.fieldName && (
    <p className="text-xs text-red-600 mt-1">{errors.fieldName.message}</p>
  )}
</Field>
```

**Modal Pattern (shadcn):**

```jsx
<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Table Pattern:**

```jsx
<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            Header
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-4 py-4 text-sm text-gray-900">{item.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## Styling Approach Summary

**Framework:** Tailwind CSS (utility-first)

- **No CSS modules** - all styling via className attributes
- **Consistent spacing:** px-4, py-3, p-6, etc.
- **Focus states:** focus:ring-2 focus:ring-emerald-500 focus:border-transparent
- **Transitions:** transition-colors, transition-all, transition-shadow
- **Responsive:** Mobile-first approach with md:, lg: breakpoints
- **Shadows:** shadow-sm for subtle, hover:shadow-md for depth
- **Borders:** Consistent gray-200 for main borders, color-specific for status
- **Disabled states:** disabled:opacity-50, disabled:cursor-not-allowed

**Component Library:** shadcn/ui

- Headless components from Radix UI
- Styled with Tailwind
- Used for: Dialog, Button, Input, Label, ScrollArea

**Form Management:** react-hook-form + Zod

- Schema validation with Zod
- Form controller via useForm hook
- Centralized error handling
- Field-level validation feedback

**Notifications:** sonner

- Toast library for success/error feedback
- Used consistently across all pages
- toast.success(), toast.error()

---

## API Integration Points

All manager pages integrate with `/api/managerApi.ts` which provides:

```
getMyChargers()
addCharger(data)
updateCharger(id, data)
deleteCharger(id)
startCharging(connectorId)
stopCharging(connectorId)
getChargerMeterValues(chargerId)

getMyStation()
updateMyStation(data)
uploadStationImage(file)

getManagerWallet()

getMyStaff()
createStaff(data)
updateStaff(id, data)
deleteStaff(id)

getManagerSlots(date)
createManagerSlot(data)
releaseManagerSlotReservation(slotId)
sendManagerSlotConfirmation(slotId)
sendManagerSlotCancelConfirmation(slotId)

getManagerChargingSessions()
getManagerStationReviews()
getManagerStationReviewSummary()
```

---

## Key State Management Patterns

**Per-page state patterns:**

1. Data loading: `loading`, `error`
2. Modals: `showEditModal`, `showAddModal`, `editingItem`
3. Forms: Managed by react-hook-form (separate instances for add/edit)
4. Async operations: `isSubmitting`, `actionLoading`, `savingId`
5. Draft states: `draftPrices` (for inline editing)
6. Selections: `selectedChargerId`, `selectedConnectorId`

**Error handling:**

- `try/catch` blocks with detailed error extraction
- Toast notifications for user feedback
- Error message display in UI cards
- Server-side validation errors parsed from response

---

## Responsive Design Notes

**Mobile-first approach:**

- Base styles apply to mobile (usually `flex flex-col`)
- Tablet overrides: `md:` prefix (768px breakpoint)
- Desktop overrides: `lg:`, `xl:` prefixes

**Common breakpoint usage:**

```
md:grid-cols-2      (tablets)
lg:grid-cols-3      (large tablets/small desktops)
xl:grid-cols-4      (large desktops)
md:px-6 md:py-10    (padding adjustments)
flex-col md:flex-row (layout adjustments)
```

**Table responsiveness:**

- Horizontal scroll on mobile (`overflow-x-auto`)
- Full width display on larger screens
- Sticky headers with `sticky top-0`

---

## Performance Considerations

1. **Memoization:** `useMemo` for computed lists, filtered data, sorted arrays
2. **Effect dependencies:** Proper dependency arrays to prevent unnecessary re-renders
3. **API calls:** Parallel requests with `Promise.all()` where possible
4. **Auto-refresh:** Intervals with cleanup (e.g., SlotList refreshes every 5s)
5. **Lazy loading:** Modal forms only load when needed
6. **Image optimization:** Station images with proper sizing (not yet active in StationDetails)

---

## Validation & Security

1. **Frontend validation:** Zod schemas for type safety
2. **Error boundaries:** Modal closures, form resets on completion
3. **Confirmation dialogs:** Delete operations require confirmation
4. **Loading states:** Buttons disabled during submission
5. **Password fields:** Show/hide toggles for sensitive input
6. **Authorization:** All API calls go through authenticated managerApi module

---

## Known Limitations & TODOs

1. **StationDetails.tsx** - Fully commented out, needs implementation
2. **Image uploads** - Infrastructure in place but not fully integrated
3. **Real-time updates** - Manual polling instead of WebSocket (SlotList refreshes every 5s)
4. **Pagination** - Not implemented for large lists (reviews, sessions, etc.)
5. **Bulk actions** - No multi-select or batch operations
6. **Dark mode** - Not implemented (Tailwind config only supports light mode)
7. **Accessibility** - ARIA labels missing on some interactive elements
8. **Mobile optimization** - Some tables may need mobile-specific card layouts

---

## Summary Statistics

**Total Pages:** 14 (13 active, 1 inactive)  
**Total Components:** All logic in pages (no separate component directory)  
**Form Schemas:** 3 (Charger, Staff, Manager Station)  
**Data Models:** 12+ types  
**API Endpoints Used:** 25+  
**Tailwind Utilities:** ~150+ classes across all files  
**Modal Dialogs:** 6+ (Add/Edit Charger, Staff, confirm dialogs)  
**Tables:** 4 (Staff, Pricing, Sessions, Invoices)  
**Responsive Breakpoints:** 3 (base, md: 768px, lg: 1024px)
