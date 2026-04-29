# CSS Class Reference Guide

## Layout Classes

### Page Layout
```
.page-content          /* Main container for pages, adds padding */
.container             /* Centered container with max-width */
.card                  /* White card with shadow and rounded corners */
```

## Typography Classes

```
h1 - h6               /* Heading sizes with responsive scaling */
p                     /* Paragraph with proper line-height */
.text-primary         /* Primary text color */
.text-secondary       /* Secondary text color */
.text-center          /* Center aligned text */
.text-muted           /* Light gray text */
```

## Button Classes

### Primary Buttons
```
.btn                  /* Base button styling */
.btn-primary          /* Blue background, white text */
.btn-secondary        /* Green background */
.btn-outline          /* Blue border, transparent background */
.btn-danger           /* Red background for destructive actions */
.btn:hover            /* Hover effect with opacity change */
.btn:disabled         /* Disabled state styling */
```

## Form Classes

### Form Structure
```
.form-container       /* Centered form wrapper, max-width 450px */
.form-header          /* Title and subtitle for forms */
.form-group           /* Wrapper for each form field */
.form-label           /* Label styling */
.form-input           /* Input/textarea styling with focus state */
.form-select          /* Select dropdown styling */
.form-submit          /* Submit button wrapper */
.form-message         /* Error/success message styling */
```

### Form States
```
input:focus           /* Blue border and shadow on focus */
.error-message        /* Red background with error styling */
.success-message      /* Green background with success styling */
.warning-message      /* Yellow background with warning styling */
```

## Card Components

### Card Structure
```
.card                 /* Main card container */
.card-header          /* Top section of card */
.card-title           /* Title inside card */
.card-body            /* Main content area */
.card-footer          /* Bottom section with actions */
```

### Status Cards
```
.stat-card            /* Statistics card with number display */
.appointment-card     /* Appointment display card */
.provider-card        /* Healthcare provider card */
.record-card          /* Medical record card */
```

## Grid Layouts

```
.provider-grid        /* 3-column responsive grid for providers */
.appointment-grid     /* Full-width appointment cards */
.stats-grid           /* 3-column statistics grid */
.slots-container      /* Flexible slot buttons */
```

## Status & Badge Classes

### Status Indicators
```
.appointment-status            /* Status badge container */
.appointment-status.scheduled  /* Scheduled appointment (blue) */
.appointment-status.completed  /* Completed appointment (green) */
.appointment-status.cancelled  /* Cancelled appointment (red) */
.appointment-status.pending    /* Pending appointment (orange) */
```

### Badges
```
.badge                /* Small informational badge */
.badge-primary        /* Blue badge */
.badge-success        /* Green badge */
.badge-danger         /* Red badge */
```

## Navigation Classes

```
.navbar               /* Top navigation bar */
.navbar-toolbar       /* Flex container for navbar items */
.navbar-brand         /* Application logo/name */
.navbar-menu          /* Navigation menu items */
.navbar-button        /* Navigation button styling */
```

## Search & Filter Classes

```
.search-filter-container    /* Container for search and filters */
.search-input               /* Search input field */
.filter-tags                /* Container for filter buttons */
.filter-tag                 /* Individual filter button */
.filter-tag.active          /* Active filter styling */
```

## Utility Classes

### Spacing
```
.mt-xs, .mt-sm, .mt-md, .mt-lg    /* Margin top */
.mb-xs, .mb-sm, .mb-md, .mb-lg    /* Margin bottom */
.ml-xs, .ml-sm, .ml-md, .ml-lg    /* Margin left */
.mr-xs, .mr-sm, .mr-md, .mr-lg    /* Margin right */
.p-xs, .p-sm, .p-md, .p-lg        /* Padding all sides */
```

### Flexbox
```
.flex                    /* Display: flex */
.flex-between            /* flex + justify-content: space-between */
.flex-center             /* flex + justify-content: center */
.flex-column             /* flex + flex-direction: column */
.flex-wrap               /* flex + flex-wrap: wrap */
.gap-xs, .gap-sm, .gap-md, .gap-lg   /* Gap between flex items */
```

### Display
```
.text-center            /* text-align: center */
.hidden                 /* display: none */
.block                  /* display: block */
.flex-1                 /* flex: 1 */
```

## State Classes

```
.loading-container     /* Centered loading spinner */
.spinner               /* Animated loading spinner */
.empty-state           /* Container for empty state message */
.empty-icon            /* Large emoji/icon for empty state */
.empty-title           /* Title for empty state */
.empty-text            /* Description text for empty state */
.empty-action          /* CTA button for empty state */
```

## Modal/Overlay Classes

```
.modal-overlay         /* Fixed background overlay */
.modal-content         /* Modal container styling */
.modal-header          /* Modal title section */
.modal-body            /* Modal content section */
.modal-footer          /* Modal action buttons */
```

## Responsive Classes

### Mobile-First Approach
```
/* Defined in @media (max-width: 768px) for tablets */
/* Defined in @media (max-width: 480px) for mobile */

.grid-responsive       /* Auto-adjusting grid layout */
.hide-on-mobile        /* Hidden on mobile devices */
.show-on-mobile        /* Visible only on mobile */
```

## Color Classes

```
.text-primary          /* #0066cc text */
.text-secondary        /* #00a86b text */
.text-accent           /* #ff6b6b text */
.text-success          /* #00c853 text */
.text-danger           /* #d32f2f text */
.text-muted            /* #999999 text */

.bg-primary-light      /* #e6f0ff background */
.bg-secondary-light    /* #f0fdf4 background */
.bg-danger-light       /* #fef2f2 background */
```

## Special Components

### Appointment Slot Selection
```
.slots-container       /* Container for time slot buttons */
.slot-button           /* Individual slot button */
.slot-button.selected  /* Selected slot styling */
.slot-button:disabled  /* Unavailable slot styling */
```

### Action Buttons
```
.appointment-actions      /* Action buttons wrapper */
.appointment-action-btn   /* Individual action button */
.appointment-action-btn.danger  /* Destructive action */
```

### Avatar/Profile
```
.avatar                /* Circular avatar container */
.avatar-sm             /* Small avatar (32px) */
.avatar-md             /* Medium avatar (48px) */
.avatar-lg             /* Large avatar (64px) */
.avatar-initials       /* Initials-based avatar */
```

## Usage Examples

### Complete Login Form
```html
<div class="form-container">
  <div class="form-header">
    <h2 class="card-title">Sign In</h2>
  </div>
  <form class="form-group">
    <label class="form-label">Email</label>
    <input type="email" class="form-input" />
    
    <label class="form-label">Password</label>
    <input type="password" class="form-input" />
    
    <button type="submit" class="btn btn-primary form-submit">Login</button>
  </form>
</div>
```

### Provider Card Grid
```html
<div class="provider-grid">
  <div class="provider-card">
    <div class="card-header">Dr. Name</div>
    <div class="card-body">Provider details...</div>
    <div class="card-footer">
      <button class="btn btn-primary">Book</button>
    </div>
  </div>
</div>
```

### Status Badge
```html
<span class="appointment-status scheduled">Scheduled</span>
<span class="appointment-status completed">Completed</span>
<span class="appointment-status cancelled">Cancelled</span>
```

## CSS Variables Available

```css
--primary: #0066cc
--primary-dark: #0052a3
--primary-light: #e6f0ff
--secondary: #00a86b
--accent: #ff6b6b
--success: #00c853
--warning: #ffa500
--danger: #d32f2f
--text-primary: #2c2c2c
--text-secondary: #666666
--bg-light: #f5f7fa
--border-light: #e0e0e0
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1)

--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
```
