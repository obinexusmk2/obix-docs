# @obinexusltd/obix Components - Complete API Reference

**Version**: 0.1.0  
**Part 2 of 4**

---

## Components Directory

**[Primitives](#primitives)** (5) | **[Forms](#forms)** (8) | **[Navigation](#navigation)** (5) | **[Overlays](#overlays)** (3) | **[Feedback](#feedback)** (4) | **[Controls](#controls)** (2) | **[Data](#data)** (2) | **[Search](#search)** (2)

---

# Primitives

## ObixButton

Accessible button with loading states, toggle mode, and FUD enforcement.

### Configuration

```typescript
interface ButtonConfig {
  label: string;                    // Button text (required)
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; // default: 'primary'
  size?: 'sm' | 'md' | 'lg';        // default: 'md'
  disabled?: boolean;               // default: false
  loading?: boolean;                // default: false
  toggle?: boolean;                 // default: false (toggleable state)
  ariaLabel?: string;               // Auto-generated if icon-only
  ariaPressed?: boolean;            // For toggle buttons
  type?: 'button' | 'submit' | 'reset'; // default: 'button'
}
```

### State

```typescript
interface ButtonState extends ButtonConfig {
  touched?: boolean;
  focused?: boolean;
  minWidth?: string;      // Enforced by touch target policy (48px)
  minHeight?: string;     // Enforced by touch target policy (48px)
}
```

### Actions

```typescript
btn.actions.click(state) → ButtonState
btn.actions.setLoading(state, loading: boolean) → ButtonState
btn.actions.toggle(state) → ButtonState
btn.actions.setDisabled(state, disabled: boolean) → ButtonState
btn.actions.focus(state) → ButtonState
btn.actions.blur(state) → ButtonState
```

### Examples

**DOP (Data-Oriented):**
```typescript
const btn = createButton({ label: 'Delete', variant: 'danger', size: 'md' });
const html = btn.render(btn.state);
// <button class="obix-button obix-button--danger obix-button--md" 
//         type="button" aria-label="Delete" ...>Delete</button>
```

**JSX:**
```tsx
const deleteBtn = <createButton label="Delete" variant="danger" size="md" />;
```

**Server-side:**
```typescript
const btn = createButton({ label: 'Save', variant: 'primary' });
res.send(`<div>${btn.render(btn.state)}</div>`);
```

### Accessibility (WCAG 2.1 AA)

- ✅ Minimum 48×48px touch target (enforced by policy)
- ✅ `aria-label` required for icon-only buttons (enforced by policy)
- ✅ `aria-busy` during loading state
- ✅ `aria-disabled` when disabled
- ✅ `aria-pressed` for toggle buttons
- ✅ Visible focus indicator (jfix focus strategy)
- ✅ Supports all keyboard events (Enter, Space)

---

## ObixCard

Content container with explicit dimensions for CLS prevention.

### Configuration

```typescript
interface CardConfig {
  title?: string;
  content?: string;              // HTML content
  interactive?: boolean;         // default: false
  image?: { src: string; alt: string };
  loading?: boolean;             // Shows skeleton
  width?: string;                // Required for CLS prevention (e.g., '300px', '100%')
  height?: string;               // Required for CLS prevention
  minHeight?: string;            // Alternative to height
  minWidth?: string;             // Alternative to width
  aspectRatio?: string;          // e.g., '16 / 9'
}
```

### State

```typescript
interface CardState extends CardConfig {
  loadingProgress?: number; // 0-100
  contentReady?: boolean;
  dimensions?: { width: string; height: string };
}
```

### Actions

```typescript
card.actions.startLoading(state) → CardState
card.actions.finishLoading(state, content: string) → CardState
card.actions.setDimensions(state, width: string, height: string) → CardState
card.actions.updateContent(state, content: string) → CardState
```

### Examples

**Explicit dimensions (CLS-safe):**
```typescript
const card = createCard({
  title: 'Product',
  content: 'Premium widget',
  image: { src: '/product.jpg', alt: 'Product image' },
  width: '300px',
  height: '400px'
});

const html = card.render(card.state);
// <div class="obix-card" style="width: 300px; height: 400px;">
//   <img src="/product.jpg" alt="Product image">
//   <h3>Product</h3>
//   <p>Premium widget</p>
// </div>
```

**With loading skeleton:**
```typescript
let card = createCard({ width: '300px', height: '400px', loading: true });
console.log(card.render(card.state)); // Skeleton placeholder

// After data fetches:
card = card.actions.finishLoading(card.state, '<p>Loaded content</p>');
console.log(card.render(card.state)); // Content shown
```

### Accessibility

- ✅ Explicit dimensions prevent Cumulative Layout Shift (CLS)
- ✅ Loading skeleton properly labeled with `aria-hidden`
- ✅ Image alt text required
- ✅ Semantic HTML (`<article>`, `<figure>`)

---

## ObixImage

Responsive image with lazy loading and alt text enforcement.

### Configuration

```typescript
interface ImageConfig {
  src: string;                   // Image URL (required)
  alt: string;                   // Alt text (required by policy)
  width?: string | number;       // Physical dimensions
  height?: string | number;
  loading?: 'eager' | 'lazy';    // default: 'lazy'
  decoding?: 'sync' | 'async' | 'auto'; // default: 'auto'
  aspectRatio?: string;          // e.g., '16 / 9' (CLS prevention)
  objectFit?: 'contain' | 'cover' | 'fill'; // default: 'cover'
  sizes?: string;                // Responsive sizes hint
  srcSet?: string;               // Multiple resolution sources
}
```

### Actions

```typescript
img.actions.setLoading(state, eager: boolean) → ImageState
img.actions.updateSrc(state, src: string) → ImageState
img.actions.updateAlt(state, alt: string) → ImageState
img.actions.onLoad(state) → ImageState
img.actions.onError(state) → ImageState
```

### Examples

```typescript
const img = createImage({
  src: '/hero.jpg',
  alt: 'Hero banner showing product features',
  width: 1200,
  height: 600,
  aspectRatio: '16 / 9',
  srcSet: '/hero-small.jpg 600w, /hero-large.jpg 1200w',
  sizes: '(max-width: 600px) 100vw, 1200px'
});

const html = img.render(img.state);
// <img src="/hero.jpg" alt="Hero banner..." width="1200" height="600"
//      aspect-ratio="16/9" loading="lazy" srcset="..." sizes="..." />
```

### Accessibility

- ✅ Alt text required and enforced
- ✅ Aspect ratio prevents layout shift
- ✅ Lazy loading with accessibility fallback
- ✅ Supports descriptive alt text for decorative images (with role="presentation" when needed)

---

## ObixVideo

Media player with captions, transcripts, and keyboard controls.

### Configuration

```typescript
interface VideoConfig {
  src: string;                   // Video URL (required)
  poster?: string;               // Thumbnail image
  controls?: boolean;            // default: true
  autoplay?: boolean;            // default: false
  muted?: boolean;               // default: false (required if autoplay)
  loop?: boolean;                // default: false
  width?: string | number;
  height?: string | number;
  tracks?: Array<{
    kind: 'captions' | 'subtitles' | 'descriptions';
    src: string;                 // VTT file
    srcLang: string;             // e.g., 'en', 'es'
    label: string;               // e.g., 'English', 'Spanish'
  }>;
  transcript?: string;           // Full transcript text or URL
  ariaLabel?: string;
}
```

### Actions

```typescript
video.actions.play(state) → VideoState
video.actions.pause(state) → VideoState
video.actions.setVolume(state, volume: number) → VideoState
video.actions.seek(state, time: number) → VideoState
video.actions.enableCaptions(state, lang: string) → VideoState
```

### Examples

```typescript
const video = createVideo({
  src: '/intro.mp4',
  poster: '/intro-poster.jpg',
  controls: true,
  width: 800,
  height: 450,
  tracks: [
    {
      kind: 'captions',
      src: '/intro-en.vtt',
      srcLang: 'en',
      label: 'English'
    },
    {
      kind: 'captions',
      src: '/intro-es.vtt',
      srcLang: 'es',
      label: 'Spanish'
    }
  ],
  transcript: '/intro-transcript.txt',
  ariaLabel: 'Product introduction video'
});

const html = video.render(video.state);
// <video width="800" height="450" poster="/poster.jpg" aria-label="...">
//   <source src="/intro.mp4" type="video/mp4">
//   <track kind="captions" src="/intro-en.vtt" srclang="en" label="English">
//   <track kind="captions" src="/intro-es.vtt" srclang="es" label="Spanish">
//   <p>Your browser doesn't support HTML5 video. <a href="/intro.mp4">Download</a></p>
// </video>
// <p><a href="/intro-transcript.txt">Read transcript</a></p>
```

### Accessibility

- ✅ Caption tracks required (native HTML `<track>`)
- ✅ Transcript link for deaf/hard of hearing users
- ✅ Keyboard controls (Space=play/pause, arrows=seek)
- ✅ Audio descriptions track supported
- ✅ Volume control accessible

---

## ObixLink

Semantic link component with external link indicators.

### Configuration

```typescript
interface LinkConfig {
  href: string;                  // URL (required)
  label: string;                 // Link text (required)
  target?: '_blank' | '_self' | '_parent' | '_top'; // default: '_self'
  rel?: string;                  // e.g., 'noopener noreferrer' for _blank
  external?: boolean;            // Shows external icon, default: auto-detect
  download?: string;             // Filename if download
  ariaLabel?: string;            // Extra context for screen readers
  visited?: boolean;             // Styling hint
}
```

### Actions

```typescript
link.actions.navigate(state) → LinkState
link.actions.setExternal(state, external: boolean) → LinkState
link.actions.updateHref(state, href: string) → LinkState
```

### Examples

```typescript
const internalLink = createLink({
  href: '/about',
  label: 'About Us',
  ariaLabel: 'About Us page'
});

const externalLink = createLink({
  href: 'https://example.com',
  label: 'External Site',
  external: true,
  target: '_blank',
  rel: 'noopener noreferrer',
  ariaLabel: 'External Site (opens in new window)'
});

const downloadLink = createLink({
  href: '/document.pdf',
  label: 'Download Guide',
  download: 'guide.pdf',
  ariaLabel: 'Download Guide (PDF, 2.4 MB)'
});
```

### Accessibility

- ✅ Descriptive link text (avoid "Click here")
- ✅ External links indicated visually and via aria-label
- ✅ File type and size in aria-label
- ✅ `rel="noopener noreferrer"` for security

---

# Forms

## ObixInput

Text input with validation, autocomplete, and error handling.

### Configuration

```typescript
interface InputConfig {
  name?: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'number' | 'tel' | 'search';
  placeholder?: string;
  value?: string;                // default: ''
  disabled?: boolean;            // default: false
  required?: boolean;            // default: false
  minLength?: number;
  maxLength?: number;
  pattern?: string;              // Regex for validation
  autocomplete?: 'email' | 'password' | 'name' | 'tel' | 'url' | 'off';
  label?: string;                // Required for accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;      // ID of hint/error element
  validation?: 'blur' | 'change'; // default: 'blur'
  errorMessage?: string;
  ariaInvalid?: boolean;
}
```

### State

```typescript
interface InputState extends InputConfig {
  touched?: boolean;             // Has user interacted?
  focused?: boolean;
  error?: string | null;
  valid?: boolean;
  dirty?: boolean;               // Has value changed?
}
```

### Actions

```typescript
input.actions.change(state, value: string) → InputState
input.actions.focus(state) → InputState
input.actions.blur(state) → InputState
input.actions.clear(state) → InputState
input.actions.validate(state) → InputState
input.actions.setError(state, message: string) → InputState
```

### Examples

**Email input with blur validation:**
```typescript
const emailInput = createInput({
  name: 'email',
  type: 'email',
  label: 'Email Address',
  placeholder: 'you@example.com',
  required: true,
  validation: 'blur',
  pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$'
});

// User types
let state = emailInput.actions.change(emailInput.state, 'invalid-email');
console.log(state.valid); // false (still, validation is on blur)

// User leaves field
state = emailInput.actions.blur(state);
console.log(state.error); // "Invalid email address"
console.log(state.ariaInvalid); // true

// User fixes it
state = emailInput.actions.change(state, 'user@example.com');
state = emailInput.actions.blur(state);
console.log(state.valid); // true
console.log(state.error); // null
```

**Password with visibility toggle:**
```typescript
const pwInput = createInput({
  name: 'password',
  type: 'password',
  label: 'Password',
  required: true,
  minLength: 8,
  validation: 'change',
  ariaDescribedBy: 'password-hint'
});

const html = `
  ${pwInput.render(pwInput.state)}
  <p id="password-hint">Minimum 8 characters</p>
`;
```

### Accessibility

- ✅ Label required and associated via `for` attribute
- ✅ Error messages announced via `aria-invalid` + `aria-describedBy`
- ✅ Autocomplete attributes for password managers
- ✅ Min/max length info available to screen readers
- ✅ Validation timing respects form context (blur vs change)

---

## ObixCheckbox

Accessible checkbox with three states (checked, unchecked, indeterminate).

### Configuration

```typescript
interface CheckboxConfig {
  name?: string;
  label: string;                 // Required
  checked?: boolean;             // default: false
  indeterminate?: boolean;       // default: false (for "select all" pattern)
  disabled?: boolean;            // default: false
  required?: boolean;            // default: false
  value?: string;                // Form submission value
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
```

### State

```typescript
interface CheckboxState extends CheckboxConfig {
  touched?: boolean;
  focused?: boolean;
}
```

### Actions

```typescript
checkbox.actions.toggle(state) → CheckboxState
checkbox.actions.setChecked(state, checked: boolean) → CheckboxState
checkbox.actions.setIndeterminate(state, indeterminate: boolean) → CheckboxState
checkbox.actions.focus(state) → CheckboxState
checkbox.actions.blur(state) → CheckboxState
```

### Examples

**Simple checkbox:**
```typescript
const agreeCheckbox = createCheckbox({
  name: 'terms',
  label: 'I agree to the Terms of Service',
  required: true
});

const html = agreeCheckbox.render(agreeCheckbox.state);
// <div class="obix-checkbox">
//   <input type="checkbox" name="terms" required>
//   <label>I agree to the Terms of Service</label>
// </div>
```

**Indeterminate (select all) pattern:**
```typescript
const selectAllCheckbox = createCheckbox({
  label: 'Select All',
  indeterminate: true
});

const checkboxes = [
  createCheckbox({ label: 'Item 1', name: 'item1' }),
  createCheckbox({ label: 'Item 2', name: 'item2' }),
  createCheckbox({ label: 'Item 3', name: 'item3' })
];

// When all are checked, selectAllCheckbox becomes checked (not indeterminate)
const allChecked = checkboxes.every(cb => cb.state.checked);
const someChecked = checkboxes.some(cb => cb.state.checked);

let selectAllState = selectAllCheckbox.state;
if (allChecked) {
  selectAllState = selectAllCheckbox.actions.setChecked(selectAllState, true);
  selectAllState = selectAllCheckbox.actions.setIndeterminate(selectAllState, false);
} else if (someChecked) {
  selectAllState = selectAllCheckbox.actions.setIndeterminate(selectAllState, true);
} else {
  selectAllState = selectAllCheckbox.actions.setChecked(selectAllState, false);
}
```

### Accessibility

- ✅ Native `<input type="checkbox">` with custom styling (accessible)
- ✅ Label properly associated via `for` attribute
- ✅ Indeterminate state communicated via `aria-checked="mixed"`
- ✅ Space key toggles checkbox
- ✅ Visible focus indicator

---

## ObixRadioGroup

Accessible radio button group with keyboard navigation.

### Configuration

```typescript
interface RadioGroupConfig {
  name: string;                  // Required, shared by all radios
  legend?: string;               // Fieldset legend (recommended)
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  selected?: string;             // Selected option value
  required?: boolean;            // default: false
  ariaLabel?: string;
}
```

### State

```typescript
interface RadioGroupState extends RadioGroupConfig {
  focused?: boolean;
  focusedIndex?: number;         // Which radio has focus
  touched?: boolean;
}
```

### Actions

```typescript
radioGroup.actions.select(state, value: string) → RadioGroupState
radioGroup.actions.focus(state, index: number) → RadioGroupState
radioGroup.actions.blur(state) → RadioGroupState
radioGroup.actions.focusNext(state) → RadioGroupState
radioGroup.actions.focusPrev(state) → RadioGroupState
```

### Examples

```typescript
const genderRadios = createRadioGroup({
  name: 'gender',
  legend: 'Gender',
  options: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not', label: 'Prefer not to say' }
  ],
  selected: 'prefer-not'
});

const html = genderRadios.render(genderRadios.state);
// <fieldset>
//   <legend>Gender</legend>
//   <div class="obix-radio-group">
//     <div class="obix-radio">
//       <input type="radio" name="gender" value="male">
//       <label>Male</label>
//     </div>
//     ... (more radios)
//   </div>
// </fieldset>
```

### Accessibility

- ✅ Fieldset + legend grouping (required)
- ✅ All radios share `name` attribute
- ✅ Arrow keys navigate between options
- ✅ `aria-checked` on selected radio
- ✅ Visible focus indicator on focused radio

---

## ObixSelect

Native select dropdown with custom styling.

### Configuration

```typescript
interface SelectConfig {
  name: string;                  // Required
  label?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }> | Array<{
    label: string;               // optgroup label
    options: Array<{ value: string; label: string }>;
  }>;
  selected?: string;             // Selected value
  multiple?: boolean;            // default: false
  disabled?: boolean;            // default: false
  required?: boolean;            // default: false
  ariaLabel?: string;
}
```

### Actions

```typescript
select.actions.change(state, value: string | string[]) → SelectState
select.actions.focus(state) → SelectState
select.actions.blur(state) → SelectState
select.actions.open(state) → SelectState
select.actions.close(state) → SelectState
```

### Examples

**Simple select:**
```typescript
const countrySelect = createSelect({
  name: 'country',
  label: 'Country',
  options: [
    { value: '', label: '-- Select Country --' },
    { value: 'us', label: 'United States' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ],
  required: true
});
```

**With option groups:**
```typescript
const regionSelect = createSelect({
  name: 'region',
  label: 'Region',
  options: [
    {
      label: 'North America',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' }
      ]
    },
    {
      label: 'Europe',
      options: [
        { value: 'gb', label: 'United Kingdom' },
        { value: 'fr', label: 'France' }
      ]
    }
  ]
});
```

### Accessibility

- ✅ Uses native `<select>` (most accessible pattern)
- ✅ Label properly associated
- ✅ Option groups with `<optgroup>`
- ✅ Works with standard browser keyboard (arrow keys, typing)
- ✅ Mobile friendly (native picker on touch devices)

---

## ObixTextarea

Multi-line text input with character counter.

### Configuration

```typescript
interface TextareaConfig {
  name?: string;
  label?: string;                // Required
  placeholder?: string;
  value?: string;                // default: ''
  disabled?: boolean;            // default: false
  required?: boolean;            // default: false
  minLength?: number;
  maxLength?: number;
  rows?: number;                 // default: 4
  resize?: 'vertical' | 'horizontal' | 'both' | 'none'; // default: 'vertical'
  autoExpand?: boolean;          // Grow with content, default: false
  showCharCount?: boolean;       // default: true if maxLength set
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
```

### Actions

```typescript
textarea.actions.change(state, value: string) → TextareaState
textarea.actions.clear(state) → TextareaState
textarea.actions.focus(state) → TextareaState
textarea.actions.blur(state) → TextareaState
```

### Examples

**With character counter:**
```typescript
const bioTextarea = createTextarea({
  name: 'bio',
  label: 'Bio',
  placeholder: 'Tell us about yourself...',
  maxLength: 500,
  rows: 6,
  showCharCount: true,
  autoExpand: true
});

const html = bioTextarea.render(bioTextarea.state);
// <div class="obix-textarea-wrapper">
//   <label for="bio">Bio</label>
//   <textarea name="bio" maxlength="500" rows="6" id="bio"></textarea>
//   <div class="obix-char-count" aria-live="polite">
//     0 / 500
//   </div>
// </div>
```

### Accessibility

- ✅ Character counter announced via `aria-live="polite"`
- ✅ Min/max length constraints enforced
- ✅ Label properly associated
- ✅ Auto-expand respects `prefers-reduced-motion`

---

## ObixForm

Form container with field validation orchestration.

### Configuration

```typescript
interface FormConfig {
  name?: string;
  onSubmit?: (data: object) => void;
  fields: Array<{
    name: string;
    required?: boolean;
    validate?: (value: any) => string | null; // Validation function
  }>;
  showErrorSummary?: boolean;   // default: true (WCAG best practice)
  errorSummaryPosition?: 'top' | 'bottom'; // default: 'top'
}
```

### Actions

```typescript
form.actions.submitForm(state, data: object) → FormState
form.actions.resetForm(state) → FormState
form.actions.setFieldError(state, fieldName: string, error: string) → FormState
form.actions.clearFieldError(state, fieldName: string) → FormState
form.actions.validateAll(state) → FormState
```

### Examples

```typescript
const contactForm = createForm({
  name: 'contact',
  fields: [
    {
      name: 'email',
      required: true,
      validate: (value) => {
        if (!value.includes('@')) return 'Invalid email address';
        return null;
      }
    },
    {
      name: 'message',
      required: true,
      validate: (value) => {
        if (value.length < 10) return 'Message must be at least 10 characters';
        return null;
      }
    }
  ],
  showErrorSummary: true,
  errorSummaryPosition: 'top'
});

const html = contactForm.render(contactForm.state);
// <form class="obix-form">
//   <div class="obix-error-summary" role="alert" aria-live="assertive">
//     <h2>Please correct the following errors:</h2>
//     <ul>
//       <li><a href="#email">Invalid email address</a></li>
//     </ul>
//   </div>
//   ... (form fields)
// </form>
```

### Accessibility

- ✅ Error summary at top (WCAG 3.3.4)
- ✅ Error messages linked to fields via `aria-describedBy`
- ✅ Error summary marked with `role="alert"` and `aria-live="assertive"`
- ✅ Field labels and error messages clearly associated
- ✅ Validation happens on blur (not confusing mid-typing)

---

## ObixDatePicker

Date selection with native fallback.

### Configuration

```typescript
interface DatePickerConfig {
  name?: string;
  label?: string;                // Required
  value?: string;                // ISO format: YYYY-MM-DD
  min?: string;                  // Earliest selectable date
  max?: string;                  // Latest selectable date
  disabled?: boolean;            // default: false
  required?: boolean;            // default: false
  showCalendar?: boolean;        // default: true (fallback to native input)
  highlightToday?: boolean;      // default: true
  ariaLabel?: string;
}
```

### Actions

```typescript
datePicker.actions.selectDate(state, date: string) → DatePickerState
datePicker.actions.openCalendar(state) → DatePickerState
datePicker.actions.closeCalendar(state) → DatePickerState
datePicker.actions.nextMonth(state) → DatePickerState
datePicker.actions.prevMonth(state) → DatePickerState
```

### Examples

```typescript
const departureDatePicker = createDatePicker({
  name: 'departure',
  label: 'Departure Date',
  min: '2026-04-05',  // Today
  max: '2026-12-31',
  required: true,
  highlightToday: true
});

const html = departureDatePicker.render(departureDatePicker.state);
// <div class="obix-date-picker">
//   <label for="departure">Departure Date</label>
//   <input type="date" name="departure" min="2026-04-05" max="2026-12-31" required>
//   <!-- Optional calendar UI falls back to native input -->
// </div>
```

### Accessibility

- ✅ Uses native `<input type="date">` (best accessible pattern)
- ✅ Calendar grid properly labeled with `aria-label`
- ✅ Today highlighted visually and via `aria-current="date"`
- ✅ Arrow keys navigate dates
- ✅ Enter selects date

---

## ObixFileUpload

File upload with drag-drop support.

### Configuration

```typescript
interface FileUploadConfig {
  name?: string;
  label?: string;                // Required
  accept?: string;               // e.g., '.pdf,.docx' or 'image/*'
  multiple?: boolean;            // default: false
  disabled?: boolean;            // default: false
  maxSize?: number;              // In bytes, e.g., 5242880 (5MB)
  maxFiles?: number;             // default: unlimited
  dragDropEnabled?: boolean;     // default: true
  showProgress?: boolean;        // default: true
  ariaLabel?: string;
}
```

### State

```typescript
interface FileUploadState extends FileUploadConfig {
  files: Array<{
    name: string;
    size: number;
    type: string;
    progress?: number;           // 0-100 during upload
    error?: string;              // File-specific error
  }>;
  isDragging?: boolean;
  totalProgress?: number;        // Overall progress
}
```

### Actions

```typescript
fileUpload.actions.addFiles(state, files: File[]) → FileUploadState
fileUpload.actions.removeFile(state, index: number) → FileUploadState
fileUpload.actions.setProgress(state, fileIndex: number, progress: number) → FileUploadState
fileUpload.actions.setFileError(state, fileIndex: number, error: string) → FileUploadState
fileUpload.actions.startDragDrop(state) → FileUploadState
fileUpload.actions.endDragDrop(state) → FileUploadState
fileUpload.actions.clear(state) → FileUploadState
```

### Examples

```typescript
const docUpload = createFileUpload({
  name: 'documents',
  label: 'Upload Documents',
  accept: '.pdf,.docx,.xlsx',
  multiple: true,
  maxSize: 10485760,  // 10MB
  maxFiles: 5,
  dragDropEnabled: true,
  showProgress: true
});

const html = docUpload.render(docUpload.state);
// <div class="obix-file-upload">
//   <label for="documents">Upload Documents</label>
//   <div class="obix-drop-zone" aria-label="Drag files here or click to select">
//     <input type="file" name="documents" accept=".pdf,.docx,.xlsx" multiple>
//     <p>Drag files here or <a href="#">click to select</a></p>
//   </div>
//   <ul class="obix-file-list" aria-live="polite">
//     <li>document1.pdf <progress value="45" max="100"></progress> (45%)</li>
//     <li>document2.docx <progress value="100" max="100"></progress> ✓</li>
//   </ul>
// </div>
```

### Accessibility

- ✅ Drag-drop zone properly labeled with `aria-label`
- ✅ File list announced via `aria-live="polite"`
- ✅ Progress bars with `<progress>` element
- ✅ File size limits stated in label
- ✅ Keyboard accessible (file input always keyboard operable)

---

# Navigation

## ObixNavigation

Site/app navigation with keyboard support.

### Configuration

```typescript
interface NavigationConfig {
  items: Array<{
    label: string;
    href: string;
    current?: boolean;           // Current page
    submenu?: Array<{ label: string; href: string }>;
  }>;
  logo?: { src: string; alt: string; href: string };
  showSkipLink?: boolean;        // default: true (WCAG best practice)
  skipLinkTarget?: string;       // ID of main content, default: 'main'
  mobileMenu?: boolean;          // default: true (hamburger on small screens)
  ariaLabel?: string;
}
```

### Actions

```typescript
nav.actions.setActive(state, href: string) → NavigationState
nav.actions.openMobileMenu(state) → NavigationState
nav.actions.closeMobileMenu(state) → NavigationState
nav.actions.toggleMobileMenu(state) → NavigationState
nav.actions.openSubmenu(state, index: number) → NavigationState
nav.actions.closeSubmenu(state, index: number) → NavigationState
```

### Examples

```typescript
const mainNav = createNavigation({
  logo: { src: '/logo.svg', alt: 'OBINexus', href: '/' },
  items: [
    { label: 'Home', href: '/', current: true },
    { label: 'About', href: '/about' },
    {
      label: 'Products',
      href: '/products',
      submenu: [
        { label: 'OBIX SDK', href: '/products/obix' },
        { label: 'MMUKO OS', href: '/products/mmuko' }
      ]
    },
    { label: 'Contact', href: '/contact' }
  ],
  showSkipLink: true,
  skipLinkTarget: 'main-content',
  mobileMenu: true
});

const html = mainNav.render(mainNav.state);
// <nav aria-label="Main navigation" class="obix-navigation">
//   <a href="#main-content" class="obix-skip-link">Skip to main content</a>
//   <a href="/" class="obix-logo">
//     <img src="/logo.svg" alt="OBINexus">
//   </a>
//   <ul class="obix-nav-list">
//     <li><a href="/" aria-current="page">Home</a></li>
//     <li><a href="/about">About</a></li>
//     <li>
//       <button aria-expanded="false" aria-haspopup="true">Products</button>
//       <ul role="menu">
//         <li><a href="/products/obix">OBIX SDK</a></li>
//         <li><a href="/products/mmuko">MMUKO OS</a></li>
//       </ul>
//     </li>
//   </ul>
//   <button class="obix-hamburger" aria-label="Menu" aria-expanded="false">☰</button>
// </nav>
```

### Accessibility

- ✅ Skip link to main content (WCAG 2.4.1)
- ✅ `aria-current="page"` for active link
- ✅ Submenus marked with `aria-haspopup="true"` and `aria-expanded`
- ✅ Hamburger menu has `aria-label` and `aria-expanded`
- ✅ Keyboard navigation: arrow keys, Escape to close menus
- ✅ Mobile hamburger marked with `role="button"`

---

## ObixBreadcrumb

Hierarchical location trail.

### Configuration

```typescript
interface BreadcrumbConfig {
  items: Array<{
    label: string;
    href?: string;               // Omit for current page
    current?: boolean;           // Mark last item as current
  }>;
  ariaLabel?: string;            // default: "Breadcrumb"
}
```

### Actions

```typescript
breadcrumb.actions.navigate(state, index: number) → BreadcrumbState
```

### Examples

```typescript
const breadcrumb = createBreadcrumb({
  items: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'OBIX SDK', href: '/products/obix' },
    { label: 'Components', current: true }  // Current page
  ],
  ariaLabel: 'Page location'
});

const html = breadcrumb.render(breadcrumb.state);
// <nav aria-label="Page location" class="obix-breadcrumb">
//   <ol>
//     <li><a href="/">Home</a></li>
//     <li><a href="/products">Products</a></li>
//     <li><a href="/products/obix">OBIX SDK</a></li>
//     <li aria-current="page">Components</li>
//   </ol>
// </nav>
```

### Accessibility

- ✅ `<nav>` landmark with `aria-label`
- ✅ `<ol>` for ordered list
- ✅ Last item marked with `aria-current="page"`
- ✅ Separators via CSS (not in DOM—screen readers skip them)

---

## ObixPagination

Multi-page navigation.

### Configuration

```typescript
interface PaginationConfig {
  current: number;               // Current page (1-indexed)
  total: number;                 // Total pages
  onPageChange?: (page: number) => void;
  showPrevNext?: boolean;        // default: true
  showFirstLast?: boolean;       // default: true
  showPageNumbers?: boolean;     // default: true
  maxVisible?: number;           // Max page buttons to show (default: 5)
  ariaLabel?: string;            // default: "Pagination"
}
```

### Actions

```typescript
pagination.actions.goToPage(state, page: number) → PaginationState
pagination.actions.nextPage(state) → PaginationState
pagination.actions.prevPage(state) → PaginationState
pagination.actions.firstPage(state) → PaginationState
pagination.actions.lastPage(state) → PaginationState
```

### Examples

```typescript
const pagination = createPagination({
  current: 3,
  total: 10,
  showPrevNext: true,
  showFirstLast: true,
  maxVisible: 5
});

const html = pagination.render(pagination.state);
// <nav aria-label="Pagination" class="obix-pagination">
//   <button aria-label="First page">« First</button>
//   <button aria-label="Previous page">‹ Prev</button>
//   <button>1</button>
//   <button>2</button>
//   <button aria-current="page">3</button>
//   <button>4</button>
//   <button>5</button>
//   <button aria-label="Next page">Next ›</button>
//   <button aria-label="Last page">Last »</button>
// </nav>
```

### Accessibility

- ✅ `<nav>` landmark with `aria-label`
- ✅ Current page marked with `aria-current="page"`
- ✅ Button labels like "Next page", "Previous page"
- ✅ Disabled buttons have `aria-disabled="true"`
- ✅ Keyboard operable (Tab, Enter)

---

## ObixTabs

Grouped content panels.

### Configuration

```typescript
interface TabsConfig {
  tabs: Array<{
    id: string;                  // Unique ID
    label: string;               // Tab label
    content: string;             // HTML content
    disabled?: boolean;
  }>;
  selected?: string;             // Selected tab ID
  vertical?: boolean;            // default: false (horizontal)
  ariaLabel?: string;
}
```

### State

```typescript
interface TabsState extends TabsConfig {
  selectedIndex?: number;
  focusedIndex?: number;         // For keyboard navigation
}
```

### Actions

```typescript
tabs.actions.selectTab(state, tabId: string) → TabsState
tabs.actions.focusTab(state, tabId: string) → TabsState
tabs.actions.nextTab(state) → TabsState
tabs.actions.prevTab(state) → TabsState
```

### Examples

```typescript
const productTabs = createTabs({
  tabs: [
    {
      id: 'specs',
      label: 'Specifications',
      content: '<p>CPU: Intel i9, RAM: 32GB...</p>'
    },
    {
      id: 'reviews',
      label: 'Reviews',
      content: '<p>★★★★★ Excellent product!</p>'
    },
    {
      id: 'related',
      label: 'Related Products',
      content: '<ul><li>Item 1</li><li>Item 2</li></ul>'
    }
  ],
  selected: 'specs',
  vertical: false
});

const html = productTabs.render(productTabs.state);
// <div class="obix-tabs">
//   <div role="tablist" class="obix-tab-list">
//     <button role="tab" aria-selected="true" aria-controls="specs-panel">Specifications</button>
//     <button role="tab" aria-selected="false" aria-controls="reviews-panel">Reviews</button>
//     <button role="tab" aria-selected="false" aria-controls="related-panel">Related Products</button>
//   </div>
//   <div id="specs-panel" role="tabpanel" aria-labelledby="specs-tab">
//     <p>CPU: Intel i9, RAM: 32GB...</p>
//   </div>
// </div>
```

### Accessibility

- ✅ `role="tablist"`, `role="tab"`, `role="tabpanel"`
- ✅ `aria-selected` on active tab
- ✅ `aria-controls` links tab to panel
- ✅ `aria-labelledby` links panel to tab
- ✅ Arrow keys navigate between tabs
- ✅ Home/End keys jump to first/last tab

---

## ObixStepper

Multi-step form/wizard.

### Configuration

```typescript
interface StepperConfig {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    content?: string;            // HTML content
    completed?: boolean;
    error?: string;
  }>;
  current?: number;              // Current step index
  clickableCompleted?: boolean;  // default: true (can go back)
  linearFlow?: boolean;          // default: false (must complete in order)
  ariaLabel?: string;
}
```

### Actions

```typescript
stepper.actions.nextStep(state) → StepperState
stepper.actions.prevStep(state) → StepperState
stepper.actions.goToStep(state, stepIndex: number) → StepperState
stepper.actions.markCompleted(state, stepIndex: number) → StepperState
stepper.actions.setError(state, stepIndex: number, error: string) → StepperState
```

### Examples

```typescript
const checkoutStepper = createStepper({
  steps: [
    {
      id: 'cart',
      label: 'Your Cart',
      description: 'Review items',
      completed: true
    },
    {
      id: 'shipping',
      label: 'Shipping',
      description: 'Delivery address',
      completed: true
    },
    {
      id: 'payment',
      label: 'Payment',
      description: 'Payment method',
      completed: false
    },
    {
      id: 'confirm',
      label: 'Confirm Order',
      description: 'Review & confirm',
      completed: false
    }
  ],
  current: 2,
  clickableCompleted: true
});

const html = checkoutStepper.render(checkoutStepper.state);
// <div class="obix-stepper" role="progressbar" aria-valuenow="2" aria-valuemin="1" aria-valuemax="4">
//   <ol class="obix-step-list">
//     <li aria-current="step">
//       <button aria-label="Step 1: Your Cart (completed)">1</button>
//       <span>Your Cart</span>
//       <p>Review items</p>
//     </li>
//     ...
//   </ol>
// </div>
```

### Accessibility

- ✅ `role="progressbar"` with `aria-valuenow/min/max`
- ✅ Current step marked with `aria-current="step"`
- ✅ Completed steps visually and semantically marked
- ✅ Descriptive button labels ("Step 1: Your Cart")
- ✅ Keyboard navigation (arrow keys between steps)

---

# Overlays

## ObixModal

Dialog with focus trap.

### Configuration

```typescript
interface ModalConfig {
  title: string;                 // Modal title (required)
  content: string;               // HTML content
  open?: boolean;                // default: false
  closeOnEscape?: boolean;       // default: true
  closeOnBackdropClick?: boolean; // default: true
  size?: 'sm' | 'md' | 'lg';     // default: 'md'
  centered?: boolean;            // default: true
  backdrop?: 'dark' | 'light' | 'blur'; // default: 'dark'
  actions?: Array<{
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: () => void;
  }>;
}
```

### State

```typescript
interface ModalState extends ModalConfig {
  isOpen?: boolean;
  initialFocusElement?: HTMLElement;
  returnFocusElement?: HTMLElement;
}
```

### Actions

```typescript
modal.actions.open(state) → ModalState
modal.actions.close(state) → ModalState
modal.actions.toggle(state) → ModalState
```

### Examples

```typescript
const deleteModal = createModal({
  title: 'Confirm Deletion',
  content: '<p>Are you sure you want to delete this item? This action cannot be undone.</p>',
  closeOnEscape: true,
  closeOnBackdropClick: false,
  size: 'md',
  centered: true,
  backdrop: 'dark',
  actions: [
    { label: 'Cancel', variant: 'secondary', onClick: () => modal.actions.close(modal.state) },
    { label: 'Delete', variant: 'danger', onClick: () => deleteItem() }
  ]
});

const html = deleteModal.render(deleteModal.state);
// <div class="obix-modal-backdrop" data-backdrop="dark">
//   <div class="obix-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
//     <h2 id="modal-title">Confirm Deletion</h2>
//     <p>Are you sure...</p>
//     <div class="obix-modal-actions">
//       <button>Cancel</button>
//       <button>Delete</button>
//     </div>
//   </div>
// </div>
```

### Accessibility

- ✅ `role="dialog"` and `aria-modal="true"`
- ✅ Focus trap (only focusable elements inside receive focus)
- ✅ Return-focus on close
- ✅ Escape key closes (if `closeOnEscape=true`)
- ✅ Modal title linked via `aria-labelledby`
- ✅ Backdrop click optional (bad UX to close on backdrop for critical dialogs)

---

## ObixDropdown

Context menu or picker.

### Configuration

```typescript
interface DropdownConfig {
  trigger: {
    label: string;
    icon?: string;
  };
  items: Array<{
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;           // Visual separator
  }>;
  placement?: 'top' | 'bottom' | 'left' | 'right'; // default: 'bottom'
  trigger?: 'click' | 'hover';   // default: 'click'
  closeOnClick?: boolean;        // default: true
  ariaLabel?: string;
}
```

### Actions

```typescript
dropdown.actions.open(state) → DropdownState
dropdown.actions.close(state) → DropdownState
dropdown.actions.toggle(state) → DropdownState
dropdown.actions.selectItem(state, index: number) → DropdownState
dropdown.actions.focusItem(state, index: number) → DropdownState
dropdown.actions.focusNext(state) → DropdownState
dropdown.actions.focusPrev(state) → DropdownState
```

### Examples

```typescript
const userMenu = createDropdown({
  trigger: {
    label: 'Account',
    icon: '👤'
  },
  items: [
    { label: 'Profile', onClick: () => navigate('/profile') },
    { label: 'Settings', onClick: () => navigate('/settings') },
    { divider: true },
    { label: 'Sign Out', onClick: () => logout() }
  ],
  placement: 'bottom',
  trigger: 'click',
  closeOnClick: true,
  ariaLabel: 'User menu'
});

const html = userMenu.render(userMenu.state);
// <div class="obix-dropdown">
//   <button aria-label="User menu" aria-expanded="false" aria-haspopup="true">
//     Account 👤
//   </button>
//   <ul role="menu" class="obix-dropdown-menu">
//     <li role="menuitem"><button>Profile</button></li>
//     <li role="menuitem"><button>Settings</button></li>
//     <li role="separator"></li>
//     <li role="menuitem"><button>Sign Out</button></li>
//   </ul>
// </div>
```

### Accessibility

- ✅ `role="menu"` for menu pattern
- ✅ `aria-expanded` and `aria-haspopup` on trigger
- ✅ Arrow keys navigate menu items
- ✅ Escape closes menu
- ✅ Keyboard accessible (Enter/Space opens, arrows navigate)

---

## ObixTooltip

Hover information.

### Configuration

```typescript
interface TooltipConfig {
  trigger: HTMLElement | string;  // Element or selector
  content: string;                // Tooltip content
  placement?: 'top' | 'bottom' | 'left' | 'right'; // default: 'top'
  trigger?: 'hover' | 'focus' | 'click'; // default: 'hover'
  delay?: number;                 // ms before showing, default: 0
  closeDelay?: number;            // ms before closing, default: 200
  ariaLabel?: string;
}
```

### Actions

```typescript
tooltip.actions.show(state) → TooltipState
tooltip.actions.hide(state) → TooltipState
tooltip.actions.toggle(state) → TooltipState
```

### Examples

```typescript
const helpTooltip = createTooltip({
  trigger: '.help-icon',
  content: 'Enter your email address to receive updates',
  placement: 'right',
  trigger: 'hover',
  delay: 200,
  closeDelay: 500
});

const html = helpTooltip.render(helpTooltip.state);
// <span class="help-icon" aria-describedby="tooltip-1" tabindex="0">?</span>
// <div id="tooltip-1" role="tooltip" class="obix-tooltip obix-tooltip--right">
//   Enter your email address...
// </div>
```

### Accessibility

- ✅ `role="tooltip"` on tooltip element
- ✅ Trigger element has `aria-describedby` pointing to tooltip
- ✅ Tooltip content linked via IDs
- ✅ Escape closes tooltip
- ✅ No pointer-events on tooltip while hovering (don't trap users)

---

# Feedback

## ObixAlert

Important message with dismissible option.

### Configuration

```typescript
interface AlertConfig {
  message: string;               // Alert content (required)
  type?: 'success' | 'warning' | 'error' | 'info'; // default: 'info'
  dismissible?: boolean;         // default: true
  icon?: boolean;                // default: true
  ariaLive?: 'polite' | 'assertive'; // default: determined by type
}
```

### Actions

```typescript
alert.actions.dismiss(state) → AlertState
```

### Examples

```typescript
const successAlert = createAlert({
  message: 'Changes saved successfully',
  type: 'success',
  dismissible: true,
  ariaLive: 'polite'
});

const errorAlert = createAlert({
  message: 'An error occurred. Please try again.',
  type: 'error',
  dismissible: false,  // Critical errors shouldn't dismiss
  ariaLive: 'assertive'
});

const html = successAlert.render(successAlert.state);
// <div role="alert" aria-live="polite" class="obix-alert obix-alert--success">
//   <span class="obix-alert-icon">✓</span>
//   <p>Changes saved successfully</p>
//   <button aria-label="Dismiss message">×</button>
// </div>
```

### Accessibility

- ✅ `role="alert"` (announces immediately to screen readers)
- ✅ `aria-live="polite"` or `aria-live="assertive"` based on type
- ✅ Icon with `aria-hidden="true"` (decorative)
- ✅ Close button with descriptive `aria-label`
- ✅ Auto-announced (no scroll needed to discover)

---

## ObixToast

Temporary notification.

### Configuration

```typescript
interface ToastConfig {
  message: string;               // Toast content (required)
  type?: 'success' | 'info' | 'warning' | 'error'; // default: 'info'
  duration?: number;             // ms before auto-close, default: 3000
  position?: 'top-left' | 'top-center' | 'top-right' | 
             'bottom-left' | 'bottom-center' | 'bottom-right'; // default: 'bottom-right'
  action?: { label: string; onClick: () => void };
  pauseOnHover?: boolean;        // default: true
}
```

### State

```typescript
interface ToastState extends ToastConfig {
  isVisible?: boolean;
  progress?: number;             // 0-100 for timeout progress
  isPaused?: boolean;            // Paused on hover
}
```

### Actions

```typescript
toast.actions.show(state) → ToastState
toast.actions.hide(state) → ToastState
toast.actions.pause(state) → ToastState
toast.actions.resume(state) → ToastState
```

### Examples

```typescript
const downloadToast = createToast({
  message: 'File downloaded successfully',
  type: 'success',
  duration: 4000,
  position: 'bottom-right',
  action: { label: 'Open', onClick: () => openFile() },
  pauseOnHover: true
});

const html = downloadToast.render(downloadToast.state);
// <div role="status" aria-live="polite" class="obix-toast obix-toast--success obix-toast--bottom-right">
//   <p>File downloaded successfully</p>
//   <button>Open</button>
//   <div class="obix-toast-progress" style="width: 100%"></div>
// </div>
```

### Accessibility

- ✅ `role="status"` and `aria-live="polite"`
- ✅ Auto-dismisses after timeout (but pauses on hover/focus)
- ✅ Optional action button
- ✅ Stacked management (multiple toasts don't overlap)
- ✅ Progress bar shows remaining time

---

## ObixProgress

Task progress indication.

### Configuration

```typescript
interface ProgressConfig {
  value?: number;                // Current progress (0-100)
  min?: number;                  // default: 0
  max?: number;                  // default: 100
  determinate?: boolean;         // default: true
  showLabel?: boolean;           // default: true (shows "45%")
  size?: 'sm' | 'md' | 'lg';     // default: 'md'
  color?: 'primary' | 'success' | 'warning' | 'danger';
  ariaLabel?: string;
  ariaValueText?: string;        // e.g., "Uploading file.zip"
}
```

### Actions

```typescript
progress.actions.setValue(state, value: number) → ProgressState
progress.actions.increment(state, amount?: number) → ProgressState
progress.actions.reset(state) → ProgressState
```

### Examples

**Determinate (known total):**
```typescript
const uploadProgress = createProgress({
  value: 45,
  min: 0,
  max: 100,
  determinate: true,
  showLabel: true,
  size: 'md',
  color: 'primary',
  ariaLabel: 'File upload progress',
  ariaValueText: 'Uploading document.pdf (45 MB of 100 MB)'
});

const html = uploadProgress.render(uploadProgress.state);
// <div role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"
//      aria-label="File upload progress" aria-valuetext="Uploading document.pdf...">
//   <div class="obix-progress-bar" style="width: 45%"></div>
//   <span class="obix-progress-label">45%</span>
// </div>
```

**Indeterminate (unknown total):**
```typescript
const loadingProgress = createProgress({
  determinate: false,
  size: 'md',
  color: 'primary',
  ariaLabel: 'Loading...'
});

const html = loadingProgress.render(loadingProgress.state);
// <div role="progressbar" aria-label="Loading..." class="obix-progress obix-progress--indeterminate">
//   <div class="obix-progress-bar obix-progress-bar--animated"></div>
// </div>
```

### Accessibility

- ✅ `role="progressbar"` with `aria-valuenow/min/max`
- ✅ `aria-valuetext` for additional context
- ✅ Works with `prefers-reduced-motion` (animation disabled)

---

## ObixLoading

Loading indicator with skeleton.

### Configuration

```typescript
interface LoadingConfig {
  show?: boolean;                // default: true
  type?: 'spinner' | 'skeleton' | 'dots'; // default: 'spinner'
  message?: string;              // Optional loading message
  dimensions?: { width: string; height: string }; // For skeleton (CLS prevention)
  ariaLabel?: string;            // For screen readers
  ariaLive?: 'polite' | 'assertive'; // default: 'polite'
}
```

### Actions

```typescript
loading.actions.show(state) → LoadingState
loading.actions.hide(state) → LoadingState
loading.actions.setMessage(state, message: string) → LoadingState
```

### Examples

**Spinner:**
```typescript
const spinnerLoading = createLoading({
  show: true,
  type: 'spinner',
  message: 'Loading...',
  ariaLabel: 'Loading content',
  ariaLive: 'polite'
});

const html = spinnerLoading.render(spinnerLoading.state);
// <div role="status" aria-live="polite" aria-label="Loading content" class="obix-loading">
//   <div class="obix-spinner" aria-hidden="true"></div>
//   <p>Loading...</p>
// </div>
```

**Skeleton:**
```typescript
const skeletonLoading = createLoading({
  show: true,
  type: 'skeleton',
  dimensions: { width: '100%', height: '400px' },  // CLS prevention
  ariaLabel: 'Content is loading'
});

const html = skeletonLoading.render(skeletonLoading.state);
// <div role="status" aria-label="Content is loading" class="obix-loading obix-loading--skeleton"
//      style="width: 100%; height: 400px;">
//   <div aria-hidden="true" class="obix-skeleton-line"></div>
//   <div aria-hidden="true" class="obix-skeleton-line"></div>
// </div>
```

### Accessibility

- ✅ `role="status"` and `aria-live="polite"`
- ✅ Spinner/skeleton content marked with `aria-hidden="true"` (decorative)
- ✅ Explicit dimensions prevent layout shift
- ✅ Optional message announced to screen readers

---

# Controls

## ObixSlider

Range input with keyboard navigation.

### Configuration

```typescript
interface SliderConfig {
  name?: string;
  label?: string;
  value?: number;                // default: min
  min?: number;                  // default: 0
  max?: number;                  // default: 100
  step?: number;                 // default: 1
  disabled?: boolean;            // default: false
  vertical?: boolean;            // default: false (horizontal)
  showValue?: boolean;           // default: true
  ariaLabel?: string;
  ariaValueText?: string;        // e.g., "Volume: 50%"
}
```

### Actions

```typescript
slider.actions.setValue(state, value: number) → SliderState
slider.actions.increment(state, amount?: number) → SliderState
slider.actions.decrement(state, amount?: number) → SliderState
slider.actions.focus(state) → SliderState
slider.actions.blur(state) → SliderState
```

### Examples

```typescript
const volumeSlider = createSlider({
  name: 'volume',
  label: 'Volume',
  value: 50,
  min: 0,
  max: 100,
  step: 5,
  showValue: true,
  ariaLabel: 'Volume control',
  ariaValueText: 'Volume: 50%'
});

const html = volumeSlider.render(volumeSlider.state);
// <div class="obix-slider-wrapper">
//   <label for="volume">Volume</label>
//   <div class="obix-slider" role="slider" aria-label="Volume control"
//        aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"
//        aria-valuetext="Volume: 50%">
//     <input type="range" name="volume" min="0" max="100" step="5" value="50" id="volume">
//     <div class="obix-slider-track">
//       <div class="obix-slider-thumb" style="left: 50%"></div>
//     </div>
//   </div>
//   <span class="obix-slider-value">50%</span>
// </div>
```

### Accessibility

- ✅ `role="slider"` with `aria-valuemin/max/now`
- ✅ Arrow keys increment/decrement (← → for horizontal, ↑ ↓ for vertical)
- ✅ Page Up/Down for larger jumps
- ✅ Home/End jump to min/max
- ✅ Label properly associated

---

## ObixSwitch

Boolean toggle switch.

### Configuration

```typescript
interface SwitchConfig {
  name?: string;
  label: string;                 // Required
  checked?: boolean;             // default: false
  disabled?: boolean;            // default: false
  size?: 'sm' | 'md' | 'lg';     // default: 'md'
  ariaLabel?: string;
  ariaDescribedBy?: string;
}
```

### Actions

```typescript
switchControl.actions.toggle(state) → SwitchState
switchControl.actions.setChecked(state, checked: boolean) → SwitchState
switchControl.actions.focus(state) → SwitchState
switchControl.actions.blur(state) → SwitchState
```

### Examples

```typescript
const darkModeSwitch = createSwitch({
  name: 'theme',
  label: 'Dark Mode',
  checked: false,
  size: 'md',
  ariaLabel: 'Toggle dark mode'
});

const html = darkModeSwitch.render(darkModeSwitch.state);
// <div class="obix-switch-wrapper">
//   <label for="theme">Dark Mode</label>
//   <button type="button" role="switch" aria-checked="false"
//           aria-label="Toggle dark mode" id="theme" class="obix-switch">
//     <span class="obix-switch-thumb"></span>
//   </button>
// </div>
```

### Accessibility

- ✅ `role="switch"` and `aria-checked`
- ✅ Distinct from checkbox (visually and semantically)
- ✅ Label properly associated
- ✅ Space/Enter toggles switch
- ✅ Visible focus indicator

---

# Data

## ObixTable

Structured data display.

### Configuration

```typescript
interface TableConfig {
  caption?: string;              // Table title (WCAG best practice)
  headers: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
  }>;
  rows: Array<Record<string, any>>;
  striped?: boolean;             // default: true (alternating row colors)
  hoverable?: boolean;           // default: true (highlight on hover)
  responsive?: boolean;          // default: true (scrollable on small screens)
  sortBy?: string;               // Current sort key
  sortDir?: 'asc' | 'desc';      // default: 'asc'
}
```

### Actions

```typescript
table.actions.sortBy(state, key: string) → TableState
table.actions.toggleSort(state, key: string) → TableState
```

### Examples

```typescript
const usersTable = createTable({
  caption: 'Registered Users',
  headers: [
    { key: 'name', label: 'Name', sortable: true, width: '30%' },
    { key: 'email', label: 'Email', sortable: true, width: '35%' },
    { key: 'status', label: 'Status', width: '20%' },
    { key: 'joined', label: 'Joined', sortable: true, width: '15%' }
  ],
  rows: [
    { name: 'Alice Johnson', email: 'alice@example.com', status: 'Active', joined: '2025-01-15' },
    { name: 'Bob Smith', email: 'bob@example.com', status: 'Inactive', joined: '2024-12-20' },
    { name: 'Carol Davis', email: 'carol@example.com', status: 'Active', joined: '2025-02-03' }
  ],
  striped: true,
  hoverable: true,
  responsive: true,
  sortBy: 'name',
  sortDir: 'asc'
});

const html = usersTable.render(usersTable.state);
// <table class="obix-table obix-table--striped obix-table--hoverable">
//   <caption>Registered Users</caption>
//   <thead>
//     <tr>
//       <th scope="col">
//         <button aria-label="Sort by Name" aria-sort="ascending">Name</button>
//       </th>
//       <th scope="col">
//         <button aria-label="Sort by Email" aria-sort="other">Email</button>
//       </th>
//       ...
//     </tr>
//   </thead>
//   <tbody>
//     <tr>
//       <td>Alice Johnson</td>
//       <td>alice@example.com</td>
//       ...
//     </tr>
//   </tbody>
// </table>
```

### Accessibility

- ✅ `<caption>` element for table title
- ✅ `<thead>` and `<tbody>` semantic structure
- ✅ `scope="col"` and `scope="row"` on headers
- ✅ `aria-sort` on sortable headers (ascending/descending/other)
- ✅ Responsive table wrapper for small screens

---

## ObixAccordion

Collapsible sections.

### Configuration

```typescript
interface AccordionConfig {
  items: Array<{
    id: string;
    heading: string;
    content: string;             // HTML content
    expanded?: boolean;          // default: false
    disabled?: boolean;
  }>;
  allowMultiple?: boolean;       // default: false (only one open at a time)
  ariaLabel?: string;
}
```

### Actions

```typescript
accordion.actions.toggle(state, itemId: string) → AccordionState
accordion.actions.expand(state, itemId: string) → AccordionState
accordion.actions.collapse(state, itemId: string) → AccordionState
accordion.actions.expandAll(state) → AccordionState
accordion.actions.collapseAll(state) → AccordionState
```

### Examples

```typescript
const faqAccordion = createAccordion({
  items: [
    {
      id: 'q1',
      heading: 'What is OBIX?',
      content: '<p>OBIX is a data-oriented UI/UX SDK...</p>',
      expanded: true
    },
    {
      id: 'q2',
      heading: 'How do I install it?',
      content: '<p>npm install @obinexusltd/obix-component-runtime</p>'
    },
    {
      id: 'q3',
      heading: 'Is it accessible?',
      content: '<p>Yes, WCAG 2.1 AA compliant by default.</p>'
    }
  ],
  allowMultiple: false,  // Only one question open at a time
  ariaLabel: 'Frequently Asked Questions'
});

const html = faqAccordion.render(faqAccordion.state);
// <div class="obix-accordion" aria-label="Frequently Asked Questions">
//   <div class="obix-accordion-item">
//     <button class="obix-accordion-header" aria-expanded="true" aria-controls="q1-panel">
//       What is OBIX?
//     </button>
//     <div id="q1-panel" class="obix-accordion-content">
//       <p>OBIX is a data-oriented UI/UX SDK...</p>
//     </div>
//   </div>
//   ...
// </div>
```

### Accessibility

- ✅ `aria-expanded` on header buttons
- ✅ `aria-controls` links header to content
- ✅ Heading hierarchy preserved
- ✅ Enter/Space toggles section
- ✅ Arrow keys navigate between sections (optional)

---

# Search

## ObixSearch

Search input with results announcement.

### Configuration

```typescript
interface SearchConfig {
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  clearButton?: boolean;         // default: true
  submitButton?: boolean;        // default: false
  onSearch?: (query: string) => void;
  ariaLabel?: string;
}
```

### Actions

```typescript
search.actions.setValue(state, value: string) → SearchState
search.actions.clear(state) → SearchState
search.actions.submit(state) → SearchState
search.actions.focus(state) → SearchState
search.actions.blur(state) → SearchState
```

### Examples

```typescript
const siteSearch = createSearch({
  name: 'q',
  label: 'Search',
  placeholder: 'Search site...',
  clearButton: true,
  submitButton: true,
  ariaLabel: 'Search the site'
});

const html = siteSearch.render(siteSearch.state);
// <form role="search" class="obix-search">
//   <label for="q">Search</label>
//   <div class="obix-search-input-wrapper">
//     <input type="search" name="q" placeholder="Search site..." id="q"
//            aria-label="Search the site">
//     <button type="button" aria-label="Clear search">✕</button>
//   </div>
//   <button type="submit">Search</button>
// </form>
```

### Accessibility

- ✅ `role="search"` on form
- ✅ `<input type="search">` (semantic)
- ✅ Clear button with descriptive label
- ✅ Results announced via `aria-live="polite"` (when connected to results)
- ✅ Keyboard operable (Enter submits, Escape clears)

---

## ObixAutocomplete

Autocomplete with suggestions.

### Configuration

```typescript
interface AutocompleteConfig {
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  suggestions?: Array<{ label: string; value: string }>;
  minChars?: number;             // default: 1 (start suggesting after N chars)
  maxSuggestions?: number;       // default: 10
  disabled?: boolean;
  ariaLabel?: string;
  onSelect?: (value: string) => void;
}
```

### State

```typescript
interface AutocompleteState extends AutocompleteConfig {
  filteredSuggestions?: Array<{ label: string; value: string }>;
  focusedIndex?: number;         // Which suggestion has focus
  isOpen?: boolean;
}
```

### Actions

```typescript
autocomplete.actions.setValue(state, value: string) → AutocompleteState
autocomplete.actions.selectSuggestion(state, index: number) → AutocompleteState
autocomplete.actions.focusSuggestion(state, index: number) → AutocompleteState
autocomplete.actions.nextSuggestion(state) → AutocompleteState
autocomplete.actions.prevSuggestion(state) → AutocompleteState
autocomplete.actions.openMenu(state) → AutocompleteState
autocomplete.actions.closeMenu(state) → AutocompleteState
```

### Examples

```typescript
const countryAutocomplete = createAutocomplete({
  name: 'country',
  label: 'Country',
  placeholder: 'Start typing...',
  suggestions: [
    { label: 'United States', value: 'us' },
    { label: 'United Kingdom', value: 'gb' },
    { label: 'Canada', value: 'ca' },
    { label: 'Australia', value: 'au' },
    { label: 'United Arab Emirates', value: 'ae' }
  ],
  minChars: 1,
  maxSuggestions: 5,
  ariaLabel: 'Search countries'
});

const html = countryAutocomplete.render(countryAutocomplete.state);
// <div class="obix-autocomplete">
//   <label for="country">Country</label>
//   <div class="obix-combobox-wrapper" role="combobox" aria-expanded="false" aria-haspopup="listbox">
//     <input type="text" name="country" placeholder="Start typing..." id="country"
//            aria-label="Search countries" aria-autocomplete="list" aria-controls="country-listbox">
//   </div>
//   <ul id="country-listbox" role="listbox" class="obix-autocomplete-menu">
//     <li role="option" aria-selected="false">United States</li>
//     <li role="option" aria-selected="false">United Kingdom</li>
//     ...
//   </ul>
// </div>
```

### Accessibility

- ✅ `role="combobox"` on input wrapper
- ✅ `role="listbox"` and `role="option"` for suggestions
- ✅ `aria-expanded` and `aria-haspopup`
- ✅ `aria-activedescendant` tracks focused suggestion
- ✅ Arrow keys navigate suggestions
- ✅ Enter/Tab selects suggestion
- ✅ Escape closes menu

---

## Next Steps

- [Part 3: Integration Patterns](./OBIX_COMPONENT_DOCUMENTATION_PART3.md) — Real-world usage examples
- [Part 4: Accessibility Guide](./OBIX_COMPONENT_DOCUMENTATION_PART4.md) — WCAG compliance details

