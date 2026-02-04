
# Plan: Create Login Page

## Overview
Create a separate login page that allows existing users to sign in with their phone number and password. This will complement the existing registration form.

## Implementation Steps

### 1. Create Login Page Component
**File:** `src/pages/Login.tsx`

Create a new login page with:
- Phone number input field (with validation)
- Password input field (with show/hide toggle)
- "Login" button
- Link to registration page ("Don't have an account? Create one")
- Consistent styling matching the registration form

### 2. Create Login Form Component
**File:** `src/components/LoginForm.tsx`

A focused form component with:
- Phone number field with icon and validation (minimum 10 digits)
- Password field with eye icon toggle
- Form validation and error display
- Submit handler that passes credentials to parent

### 3. Update App Router
**File:** `src/App.tsx`

Add new route:
- `/login` - Login page
- Keep `/` as the registration/problem reporting flow

### 4. Add Navigation Between Pages
- Add "Already have an account? Login" link on registration page
- Add "Don't have an account? Register" link on login page

---

## Technical Details

### Login Form Structure
```text
+----------------------------------+
|            [App Logo]            |
|                                  |
|           Welcome Back           |
|    Sign in to your account       |
|                                  |
|  Phone Number                    |
|  +-----------------------------+ |
|  | [Phone Icon] 9876543210     | |
|  +-----------------------------+ |
|                                  |
|  Password                        |
|  +-----------------------------+ |
|  | [Lock Icon] ********  [Eye] | |
|  +-----------------------------+ |
|                                  |
|  +-----------------------------+ |
|  |          Login              | |
|  +-----------------------------+ |
|                                  |
|  Don't have an account? Register |
+----------------------------------+
```

### Validation Rules
- Phone: Required, minimum 10 digits, valid phone format
- Password: Required, minimum 6 characters

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Login.tsx` | Login page container |
| `src/components/LoginForm.tsx` | Login form with validation |

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/login` route |
| `src/components/BasicDetailsForm.tsx` | Add "Already have an account?" link |

### Component Reuse
- Uses existing UI components: `Button`, `Input`, `Label`
- Uses existing icons from `lucide-react`: `Phone`, `Lock`, `Eye`, `EyeOff`, `ArrowRight`
- Follows same validation patterns as registration form
