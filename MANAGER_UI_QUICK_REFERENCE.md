# Manager UI Quick Reference

## File Index & Routing

| Page File            | Route                     | Purpose                    | Status       |
| -------------------- | ------------------------- | -------------------------- | ------------ |
| ManagerDashboard.tsx | /manager/dashboard        | Overview (3-stat cards)    | ✅ Active    |
| MyChargers.tsx       | /manager/mychargers       | View/Edit/Delete chargers  | ✅ Active    |
| AddCharger.tsx       | /manager/addcharger       | Standalone charger form    | ✅ Active    |
| ChargerControl.tsx   | /manager/chargercontrol   | Start/stop charging        | ✅ Active    |
| ChargingSessions.tsx | /manager/chargingsessions | Session history            | ✅ Active    |
| ManageSlots.tsx      | /manager/manageslots      | Create time slots          | ✅ Active    |
| MyStaff.tsx          | /manager/mystaff          | View/Edit/Delete staff     | ✅ Active    |
| AddStaff.tsx         | /manager/addstaff         | Standalone staff form      | ✅ Active    |
| Pricing.tsx          | /manager/pricing          | Manage charger pricing     | ✅ Active    |
| Reservations.tsx     | /manager/reservations     | Manage slot reservations   | ✅ Active    |
| SlotList.tsx         | /manager/slotlist         | View today's slots         | ✅ Active    |
| StationDetails.tsx   | /manager/stationdetails   | Edit station (DISABLED)    | ⚠️ Commented |
| StationReviews.tsx   | /manager/stationreviews   | View customer reviews      | ✅ Active    |
| LiveSession.tsx      | /manager/livesession      | Real-time charging monitor | ✅ Active    |

## Styling Quick Reference

### Color Palette

- **Primary Action:** `bg-emerald-600 hover:bg-emerald-700` (Add/Create)
- **Danger/Delete:** `bg-red-600 hover:bg-red-700`
- **Edit:** `text-blue-600 hover:bg-blue-50`
- **Available Status:** `bg-[#22C55E]/10 text-[#22C55E]` (Green)
- **In Charging:** `bg-orange-100 text-orange-700` (Orange)
- **Reserved:** `bg-red-100 text-red-700` (Red)
- **Background:** `bg-gray-50` (main), `bg-white` (cards)
- **Border:** `border border-gray-200` (default)

### Common Classes

```
Page container:     min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10
Max width wrapper:  mx-auto max-w-6xl
Card:              rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md
Button primary:    bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold px-4 py-2
Input field:       h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500
Title:             text-3xl font-bold text-gray-900
Subtitle:          text-sm text-gray-600 mt-2
Table header:      bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600
```

## Form Fields Across Pages

| Page              | Fields                                                   | Validation                |
| ----------------- | -------------------------------------------------------- | ------------------------- |
| AddCharger        | name, connector_count, type, max_power_kw, price_per_kwh | Zod (createChargerSchema) |
| MyChargers (Edit) | name, connector_count, type, max_power_kw, price_per_kwh | Zod (createChargerSchema) |
| AddStaff          | user_name, email, password, phone_number, vehicle        | Zod (createStaffSchema)   |
| MyStaff (Edit)    | user_name, email, password\*, phone_number, vehicle      | Zod (createStaffSchema)   |
| ManageSlots       | startTime, endTime, selectedConnectorId                  | Manual validation         |
| Pricing           | price_per_kwh (inline edit)                              | Numeric validation        |

\*password optional on edit

## Data Fetching Pattern

```javascript
// Parallel loading (used in dashboard)
const [data1, data2, data3] = await Promise.all([
  api.fetch1(),
  api.fetch2(),
  api.fetch3(),
]);

// Sequential with error handling
try {
  const data = await api.fetch();
  setData(data);
  setError(null);
} catch (err) {
  setError(err.response?.data?.detail || "Failed");
} finally {
  setLoading(false);
}
```

## Modal Pattern (shadcn Dialog)

```jsx
const [showModal, setShowModal] = useState(false);

<Dialog open={showModal} onOpenChange={setShowModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Form */}
    <DialogFooter>
      <Button onClick={handleSubmit}>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

## Status Color Functions

```javascript
// Charger/Connector status colors
const getStatusColor = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20";
    case "IN_CHARGING":
      return "bg-orange-100 text-orange-700 border border-orange-200";
    case "RESERVED":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
};

// Slot status colors
const getStatusClass = (status) => {
  if (status === "OPEN") return "bg-emerald-100 text-emerald-700";
  if (status === "RESERVED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};
```

## Responsive Grid Patterns

```jsx
// 1 col → 2 cols → 3 cols
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 1 col → 2 cols (with max-width)
<div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-6xl mx-auto">

// Full width with overflow scroll (tables)
<div className="overflow-x-auto rounded-xl border border-gray-200">
  <table className="min-w-full">
```

## Input Styling

```jsx
// Text/Number input
<Input
  className="h-10 border border-gray-300 rounded-lg
             focus:ring-2 focus:ring-emerald-500 focus:border-transparent
             transition-colors bg-white text-gray-900 placeholder:text-gray-400"
/>

// With label and error
<Field className="gap-2">
  <FieldLabel className="text-sm font-medium text-gray-700">Label</FieldLabel>
  <Input {...register("field")} />
  {errors.field && <p className="text-xs text-red-600 mt-1">{errors.field.message}</p>}
</Field>
```

## Common Utility Functions

```javascript
// Date/Time formatting
const formatClock = (value) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDuration = (startTime, endTime) => {
  const minutes = (new Date(endTime) - new Date(startTime)) / 60000;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (minutes < 60) return `${minutes} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

// Status formatting
const formatStatus = (status) => status.replace(/_/g, " ");
```

## API Endpoints Used

**Charger Operations:**

- GET /manager/chargers
- POST /manager/chargers
- PUT /manager/chargers/{id}
- DELETE /manager/chargers/{id}
- POST /manager/chargers/{id}/start-charging
- POST /manager/chargers/{id}/stop-charging
- GET /manager/chargers/{id}/meter-values

**Staff Operations:**

- GET /manager/staff
- POST /manager/staff
- PUT /manager/staff/{id}
- DELETE /manager/staff/{id}

**Slot Operations:**

- GET /manager/slots?date={date}
- POST /manager/slots
- POST /manager/slots/{id}/release
- POST /manager/slots/{id}/send-confirmation
- POST /manager/slots/{id}/send-cancel-confirmation

**Session/Review Operations:**

- GET /manager/charging-sessions
- GET /manager/station/reviews
- GET /manager/station/review-summary

**Station Operations:**

- GET /manager/station
- PUT /manager/station
- POST /manager/station/upload-image
- GET /manager/wallet

**Pricing:**

- PUT /manager/chargers/{id}/pricing

## Loading & Error States

```jsx
// Loading skeleton
{
  loading && (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-xl" />
      ))}
    </div>
  );
}

// Error card
{
  error && (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {error}
    </div>
  );
}

// Empty state
{
  !loading && items.length === 0 && (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 h-12 w-12 rounded-full bg-gray-100" />
      <p className="text-base font-semibold text-gray-700">No items found</p>
      <button onClick={handleAdd} className="mt-6 bg-emerald-600 ...">
        Add Item
      </button>
    </div>
  );
}
```

## Toast Notifications

```javascript
import { toast } from "sonner";

// Success
toast.success("Item added successfully.");

// Error with description
toast.error("Failed to add item", { description: "Server error occurred" });

// Custom
toast.message("Title", { description: "Message text" });
```

## Common Patterns by Page Type

### List/Table Pages (MyChargers, MyStaff, Pricing, etc.)

1. Header with title + add button
2. Loading skeleton or error state
3. Empty state with add button
4. Table/Grid with data
5. Edit/Delete actions per row
6. Modal forms for add/edit

### Form Pages (AddCharger, AddStaff)

1. Container with max-width
2. Header with title + subtitle
3. Form with space-y-6 (section spacing)
4. Field components with labels, inputs, errors
5. Submit button at bottom
6. Toast feedback on success/error

### Dashboard/Overview Pages (ManagerDashboard, ChargerControl)

1. Header section
2. Loading/error states
3. Grid of stat/metric cards
4. Action sections below
5. Real-time data display

### Control/Monitor Pages (LiveSession, ChargingSessions)

1. Header with selectors
2. Real-time metric display
3. Status indicators
4. Action buttons
5. History/invoice table below

## Key Files for Reference

- **Styling components:** `/components/ui/button.tsx`, `input.tsx`, `dialog.tsx`, `field.tsx`
- **API integration:** `/api/managerApi.ts`
- **Form schemas:** `/lib/schema/CreateChargerSchema.ts`, `CreateStaffSchema.ts`
- **Routes setup:** `/routes/AppRoutes.tsx`
- **Sidebar config:** `/config/sidebarMenu.ts`
