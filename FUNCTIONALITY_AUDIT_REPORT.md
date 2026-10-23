# Production & Quality ERP Functionality Audit

**Audit date:** 2026-10-23  
**Scope:** Frontend pages, navigation, button wiring, form opening, and safely testable read-only requests.  
**Code changes:** None. Form submissions that create, approve, reject, transfer, or otherwise mutate ERP data were not submitted.

## Summary

- All 13 checked Production & Quality routes rendered their expected page heading in the browser.
- The shared navigation tabs were present, and the active dashboard tab was marked active.
- The dashboard order form, Work Order form, Inspection form, Shop-Floor output form, Material issue/consumption/return forms, NCR/scrap forms, and the three Inspection decision dialogs opened in browser checks.
- The Work Orders list endpoint returned HTTP 200 during the audit.
- Several controls are functional only as local/demo interactions, and multiple API failure paths can report a success-shaped message. A Work Order row link was also confirmed to navigate to the dashboard instead of its detail page.

## Page-by-page results

| Page / route | Result | What was checked |
|---|---|---|
| Production Overview — `/pq/dashboard` | Partial | Route rendered; tab navigation and Create Order form opened. The quick-create form presents a success state without calling the Work Order API or adding a saved order. |
| Production Planning — `/production-quality/planning` | Partial | Route rendered; Prev/Next buttons respond, but they only set fixed month labels and do not reload/filter the calendar. |
| Manufacturing — `/production-quality/manufacturing` | Partial | Route rendered; shop-floor forms are wired to service calls. Error handling can still close the form and use wording that implies the failed operation was recorded. |
| Shop-Floor Tracking — `/production-quality/shop-floor` | Partial | Same Shop-Floor page and behavior as Manufacturing. |
| Work Order Management — `/production-quality/work-orders` | Partial | Route rendered; Create Work Order form opened; list request returned HTTP 200. Create/edit handlers are wired to API calls but were not submitted to avoid changing data. Row detail links are broken (see findings). |
| Work Order details — `/production-quality/work-orders/1` | Partial | Route rendered. Status actions, production entry, quality transfer, and stock check are wired to services; mutating actions were not submitted. |
| Material Issuance — `/production-quality/material-issuance` | Partial | Route rendered; Issue, Consumption, and Return forms opened. Submit paths call APIs, but error paths close the forms and describe the operation as locally recorded even though persistence is not verified. |
| Quality Dashboard — `/production-quality/quality` | Partial | Route rendered; inspection navigation links are present. Dashboard/queue fetch failures are suppressed into empty/default display states. |
| Inspection Register — `/production-quality/inspections` | Partial | Route rendered; New Inspection form opened. Creating an inspection changes only component state; it does not call the inspection API. |
| Inspection Details — `/production-quality/inspections/1` | Partial | Route rendered; PASS, REWORK, and REJECT confirmation dialogs opened. API submissions were not made. PASS/REJECT paths suppress errors from secondary API operations and can still claim that all follow-up actions succeeded. |
| Non-Conformance — `/production-quality/non-conformance` | Partial | Route rendered; Log NCR and Authorize Scrap forms opened. Handlers call the quality service and surface failures; submissions were not made. |
| CAPA / Rework — `/production-quality/rework` | Partial | Route rendered. Mark Ready updates local component state only; it is not persisted through an API. |
| Production Completion — `/production-quality/completion` | Partial | Route rendered. Warehouse Handover updates local component state and shows an alert only; it is not persisted through an API. |

## Confirmed issues

1. **Work Order row links lead to the dashboard instead of order details.**  
   The Work Order table builds links under `/pq/work-orders/:id`, but the route registry does not register that path. Browser testing confirmed that clicking a row link ends at `/pq/dashboard`. The supported detail paths are `/production/work-orders/:id` and `/production-quality/work-orders/:id`. See [WorkOrdersPage.jsx](./frontend/src/features/production_quality/pages/WorkOrdersPage.jsx#L274) and [routeRegistry.js](./frontend/src/app/routeRegistry.js#L61).

2. **Dashboard Create Order only shows a simulated success state.**  
   The shared quick-create submit handler only sets local `submitted` state and closes after a timeout; it does not call `productionService.createWorkOrder`. See [QuickCreateModal.jsx](./frontend/src/components/common/QuickCreateModal.jsx#L9).

3. **Shop-Floor API failures can be presented as completed actions.**  
   The output, quality transfer, downtime, and scrap handlers close their dialogs on both success and failure. Their catch messages use phrases such as “recorded” or “logged” before displaying the error, which can imply persistence where the API request failed. See [ShopFloorPage.jsx](./frontend/src/features/production_quality/pages/ShopFloorPage.jsx#L97).

4. **Inspection PASS/REJECT can claim secondary operations succeeded when they failed.**  
   PASS suppresses failures from recording results and finished-goods release, then shows a success message; REJECT suppresses NCR-creation failures and still claims the NCR was opened. See [InspectionDetailsPage.jsx](./frontend/src/features/production_quality/pages/InspectionDetailsPage.jsx#L94).

5. **Some interactions are session-local rather than ERP-persisted.**  
   Inspection creation uses local React state ([InspectionPage.jsx](./frontend/src/features/production_quality/pages/InspectionPage.jsx#L113)); Rework “Mark Ready” and Production Completion “Warehouse Handover” also update local state only ([ReworkTrackingPage.jsx](./frontend/src/features/production_quality/pages/ReworkTrackingPage.jsx#L40), [ProductionCompletionPage.jsx](./frontend/src/features/production_quality/pages/ProductionCompletionPage.jsx#L56)).

6. **Planning month controls do not navigate the calendar data.**  
   Prev and Next set the displayed month to fixed strings; they do not calculate adjacent months or refetch events for the selected month. See [ProductionPlanningPage.jsx](./frontend/src/features/production_quality/pages/ProductionPlanningPage.jsx#L59).

7. **Quality Dashboard fetch errors are not shown to the user.**  
   Dashboard and inspection-queue requests catch failures as `null`, allowing the page to render without a clear error state. See [QualityDashboard.jsx](./frontend/src/features/production_quality/pages/QualityDashboard.jsx#L19).

## Validation performed

- Browser smoke-tested all 13 routes listed above; each rendered a page heading.
- Opened the available create/action forms and Inspection decision dialogs without submitting them.
- Verified Work Orders list GET request returned HTTP 200.
- `npm run build`: passed; Vite reported the existing large-chunk warning.
- `npm run lint`: failed with one `react-hooks/purity` error at [WorkOrdersPage.jsx](./frontend/src/features/production_quality/pages/WorkOrdersPage.jsx#L37) (`Date.now()` used in the `newOrder` state initializer), plus 14 unused-variable warnings.
- No test files were found under the frontend project.
