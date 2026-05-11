# CPT304 Coursework Evidence

Project: Personal Budget App  
Live deployment: https://cpt304-budget-app.vercel.app/

## Summary of Four Code Deficiencies

### Deficiency 1: Non-semantic controls and missing accessible names

**Issue**  
The original UI used clickable `div` elements for tabs, add actions, edit actions and delete actions. These controls were not reliably keyboard accessible and did not expose clear accessible names to screen readers.

**Detection method**  
Manual source review of `index.html`, `budget.js` and `style.css`; accessibility checklist against form labels, button names and keyboard navigation.

**Files changed**  
`index.html`, `budget.js`, `style.css`

**Before**
```html
<div class="first-tab">Expenses</div>
<div class="add-expense"><img src="icon/plus.png" alt="+" /></div>
```

```js
const editDiv = document.createElement("div");
editDiv.id = "edit";
const deleteDiv = document.createElement("div");
deleteDiv.id = "delete";
```

**After**
```html
<button id="expense-tab" class="first-tab" type="button" role="tab"
  aria-controls="expense" aria-selected="false" data-i18n="expenses">
  Expenses
</button>
<button class="add-expense" type="button" aria-label="Add expense">
  <img src="icon/plus.png" alt="" />
</button>
```

```js
const editButton = createEntryButton("edit", t("edit"));
const deleteButton = createEntryButton("delete", t("delete"));
```

**Why the fix improves the system**  
Using real buttons gives native keyboard support, visible focus handling and screen-reader-friendly names. This directly supports a higher Lighthouse Accessibility score.

**Suggested references / keywords**  
WCAG 2.2 keyboard accessibility, ARIA Authoring Practices tabs, accessible name computation, semantic HTML buttons.

### Deficiency 2: Incomplete input validation and weak feedback

**Issue**  
The original form silently ignored empty titles and only reported amount errors. It also allowed extreme numeric values such as `Infinity`, which could damage totals and chart calculations.

**Detection method**  
Manual testing with empty title, negative amount and very large numeric input; source review of `validateAmountInput()`.

**Files changed**  
`index.html`, `budget.js`, `style.css`, `tests/budget.test.js`

**Before**
```js
const title = expenseTitle.value.trim();
const amount = validateAmountInput(expenseAmount);

if (!title || amount === null) return;
```

**After**
```js
const title = validateTitleInput(titleInput);
const amount = validateAmountInput(amountInput);

if (!title || amount === null) return;
```

```js
if (!rawValue || !Number.isFinite(amount) || amount <= 0) {
  showValidationError(inputElement, t("invalidAmount"));
  return null;
}
```

**Why the fix improves the system**  
Users now receive clear validation errors for both title and amount. Invalid numbers are blocked before they can corrupt totals, persisted state or the chart.

**Suggested references / keywords**  
HTML form validation, client-side validation usability, WCAG error identification, JavaScript `Number.isFinite`.

### Deficiency 3: Fragile entry action handling

**Issue**  
The original delete/edit logic depended on `event.target.parentNode` and duplicate `id` values on repeated list items. This is fragile because clicks on child elements can resolve the wrong parent, and duplicate IDs are invalid HTML.

**Detection method**  
Manual source review of generated list item markup and event delegation logic in `budget.js`.

**Files changed**  
`budget.js`, `style.css`, `tests/budget.test.js`

**Before**
```js
function deleteOrEdit(event) {
  const targetBtn = event.target;
  const entry = targetBtn.parentNode;

  if (targetBtn.id == EDIT) {
    editEntry(entry);
  } else if (targetBtn.id == DELETE) {
    deleteEntry(entry);
  }
}
```

**After**
```js
function handleEntryAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const entryEl = button.closest("li");
  const index = Number(entryEl.dataset.index);
  if (!Number.isInteger(index) || !entryList[index]) return;

  if (button.dataset.action === "edit") {
    editEntry(index);
  } else if (button.dataset.action === "delete") {
    deleteEntry(index);
  }
}
```

**Why the fix improves the system**  
The event handler is now resilient to nested click targets, avoids duplicate IDs and uses explicit `data-action` / `data-index` attributes.

**Suggested references / keywords**  
DOM event delegation, duplicate HTML IDs, `Element.closest`, resilient UI event handling.

### Deficiency 4: Chart calculation could produce invalid drawing values

**Issue**  
When income and expense were both zero, the chart ratio was calculated as `income / (outcome + income)`, producing `NaN`. This could cause inconsistent canvas rendering.

**Detection method**  
Manual source review of `chart.js` and boundary testing with an empty entry list.

**Files changed**  
`chart.js`, `tests/budget.test.js`

**Before**
```js
let ratio = income / (outcome + income);
```

**After**
```js
const total = income + outcome;
const ratio = total > 0 ? income / total : 0;
```

**Why the fix improves the system**  
The chart now has a deterministic zero-state value and avoids passing invalid `NaN` values into canvas drawing.

**Suggested references / keywords**  
JavaScript `NaN`, defensive programming, canvas rendering, boundary value testing.

## Baseline Standards Evidence

### 1. Vercel deployment

Current live URL: https://cpt304-budget-app.vercel.app/

Recommended screenshot evidence:
- Vercel project overview showing the production deployment.
- Vercel deployments page showing recent successful deployments.
- Vercel analytics or uptime/deployment history covering the requested period.

### 2. Test coverage target

Added Vitest tests for:
- Main app rendering.
- Adding income and expense entries.
- Deleting an item.
- Balance and total calculation.
- Language toggle persistence.
- Cookie banner behavior.
- Privacy Policy page rendering.

Run:
```bash
npm install
npm test
npm run test:coverage
```

Recommended screenshot evidence:
- Terminal output showing all tests passed.
- Coverage report showing at least 80%.
- Optional `coverage/index.html` browser view.

### 3. Lighthouse Accessibility 90+

Implemented:
- Real `button` elements for interactive controls.
- Accessible labels for inputs.
- `aria-label`, `role="tablist"`, `role="tab"` and `aria-selected`.
- Visible focus styles.
- Status messages using `role="status"` and validation errors using `role="alert"`.

Recommended screenshot evidence:
- Lighthouse Accessibility score 90+ for the deployed Vercel URL.

### 4. Internationalization

Implemented an English/Chinese toggle with a maintainable `translations` object in `budget.js`. The selected language is saved in `localStorage` under `budget_app_language`.

Recommended screenshot evidence:
- App in English.
- App after toggling to Chinese.
- Browser localStorage showing `budget_app_language`.

### 5. Cookie banner and Privacy Policy

Implemented:
- Cookie consent banner with Accept and Reject actions.
- Consent stored in `localStorage` under `budget_app_cookie_consent`.
- Dedicated `privacy.html` page explaining localStorage, consent choice, user-entered budget data and lack of backend storage.

Recommended screenshot evidence:
- Cookie banner before selection.
- Banner hidden after Accept or Reject.
- Privacy Policy page.

## Files Changed

- `index.html`: semantic controls, labels, language toggle, cookie banner, privacy link.
- `budget.js`: validation, i18n, cookie consent, safer entry actions, status messages, testable helpers.
- `chart.js`: zero-total chart guard.
- `style.css`: focus styles, button styles, validation messages, cookie banner, privacy page styles.
- `privacy.html`: dedicated privacy policy page.
- `package.json`: test, coverage and build scripts.
- `vitest.config.js`: coverage configuration and thresholds.
- `scripts/verify-static-site.js`: static build verification.
- `tests/budget.test.js`: automated DOM behavior tests.
- `README.md`: updated run, test and deployment instructions.

## Manual Verification Still Required

- Run Lighthouse against the deployed Vercel URL and save the Accessibility score screenshot.
- Run `npm run test:coverage` after installing dependencies and save the coverage screenshot.
- Confirm the latest GitHub commit is deployed by Vercel.
- Capture the Vercel deployment history or uptime evidence required by the coursework brief.
