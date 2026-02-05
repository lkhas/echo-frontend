
# Plan: Add Multi-Language Support

## Overview
Add language switching functionality to support **English, Hindi (हिंदी), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), and Telugu (తెలుగు)**. Users will be able to switch languages easily from any screen.

## Supported Languages
| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Hindi | hi | हिंदी |
| Kannada | kn | ಕನ್ನಡ |
| Malayalam | ml | മലയാളം |
| Telugu | te | తెలుగు |

## User Experience
- Language selector dropdown in the header of every page
- Selected language persists in browser storage
- All text (labels, buttons, error messages, placeholders) will be translated
- Language changes instantly without page reload

## Implementation Steps

### 1. Install i18n Library
Install `react-i18next` and `i18next` for internationalization support.

### 2. Create Translation Files
Create JSON files for each language with all translatable text:

**Structure:**
```text
src/
  i18n/
    index.ts          (i18n configuration)
    locales/
      en.json         (English translations)
      hi.json         (Hindi translations)
      kn.json         (Kannada translations)
      ml.json         (Malayalam translations)
      te.json         (Telugu translations)
```

### 3. Create Language Selector Component
A dropdown component showing language options with their native names and flags/icons.

### 4. Update All Components
Replace hardcoded text with translation keys using the `useTranslation` hook.

**Components to update:**
- `BasicDetailsForm.tsx` - Registration form labels and messages
- `LoginForm.tsx` - Login form labels and messages
- `ProblemDetailsForm.tsx` - Problem reporting labels
- `SuccessScreen.tsx` - Success messages
- `GPSStatus.tsx` - GPS status messages
- `VoiceRecorder.tsx` - Recording labels
- `ImageUploader.tsx` - Image upload labels
- `MapPreview.tsx` - Map labels
- `Index.tsx` - Page header and footer
- `Login.tsx` - Page header and footer

---

## Technical Details

### Translation Keys Structure
```text
{
  "common": {
    "continue": "Continue",
    "login": "Login",
    "register": "Register",
    "submit": "Submit",
    "back": "Back",
    "retry": "Retry"
  },
  "auth": {
    "createAccount": "Create Account",
    "welcomeBack": "Welcome Back",
    "fullName": "Full Name",
    "phoneNumber": "Phone Number",
    "password": "Password",
    "enterName": "Enter your full name",
    "enterPhone": "Enter your phone number",
    "enterPassword": "Enter your password",
    "createPassword": "Create a password",
    "passwordHint": "Must be at least 6 characters",
    "alreadyHaveAccount": "Already have an account?",
    "dontHaveAccount": "Don't have an account?"
  },
  "validation": {
    "nameRequired": "Name is required",
    "phoneRequired": "Phone number is required",
    "phoneInvalid": "Please enter a valid phone number",
    "passwordRequired": "Password is required",
    "passwordLength": "Password must be at least 6 characters"
  },
  "problem": {
    "describeTheProblem": "Describe the Problem",
    "provideDetails": "Provide details using text, voice, or images",
    "problemDescription": "Problem Description",
    "optional": "optional",
    "describePlaceholder": "Describe the issue you're reporting...",
    "submitReport": "Submit Report"
  },
  "gps": {
    "fetchingLocation": "Fetching accurate location...",
    "locationAcquired": "Location Acquired",
    "improvingAccuracy": "Improving GPS accuracy...",
    "enableLocation": "Please enable location services and try again",
    "waitingForGps": "Waiting for accurate GPS location before submission..."
  },
  "voice": {
    "voiceRecording": "Voice Recording",
    "tapToRecord": "Tap to start recording",
    "recording": "Recording...",
    "recordingSaved": "Recording saved"
  },
  "images": {
    "images": "Images",
    "camera": "Camera",
    "upload": "Upload",
    "add": "Add"
  },
  "success": {
    "reportSubmitted": "Report Submitted!",
    "thankYou": "Thank you for your report. Our team will review it and take the necessary action.",
    "submitAnother": "Submit Another Report"
  },
  "footer": {
    "dataSecure": "Your data is secure and will only be used to process your report",
    "authDataSecure": "Your data is secure and will only be used to authenticate you"
  }
}
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/i18n/index.ts` | i18n configuration with language detection and persistence |
| `src/i18n/locales/en.json` | English translations |
| `src/i18n/locales/hi.json` | Hindi translations |
| `src/i18n/locales/kn.json` | Kannada translations |
| `src/i18n/locales/ml.json` | Malayalam translations |
| `src/i18n/locales/te.json` | Telugu translations |
| `src/components/LanguageSelector.tsx` | Language dropdown component |

### Files to Modify
| File | Changes |
|------|---------|
| `src/main.tsx` | Import i18n configuration |
| `src/pages/Index.tsx` | Add LanguageSelector, use translations |
| `src/pages/Login.tsx` | Add LanguageSelector, use translations |
| `src/components/BasicDetailsForm.tsx` | Replace hardcoded text with `t()` |
| `src/components/LoginForm.tsx` | Replace hardcoded text with `t()` |
| `src/components/ProblemDetailsForm.tsx` | Replace hardcoded text with `t()` |
| `src/components/SuccessScreen.tsx` | Replace hardcoded text with `t()` |
| `src/components/GPSStatus.tsx` | Replace hardcoded text with `t()` |
| `src/components/VoiceRecorder.tsx` | Replace hardcoded text with `t()` |
| `src/components/ImageUploader.tsx` | Replace hardcoded text with `t()` |
| `src/components/MapPreview.tsx` | Replace hardcoded text with `t()` |

### Sample Hindi Translations
```text
{
  "auth": {
    "createAccount": "खाता बनाएं",
    "welcomeBack": "वापसी पर स्वागत है",
    "fullName": "पूरा नाम",
    "phoneNumber": "फ़ोन नंबर",
    "password": "पासवर्ड"
  }
}
```

### Language Selector Design
```text
+---------------------------+
| 🌐 English          ▼    |
+---------------------------+
| 🇬🇧 English              |
| 🇮🇳 हिंदी                 |
| 🇮🇳 ಕನ್ನಡ                 |
| 🇮🇳 മലയാളം                |
| 🇮🇳 తెలుగు                |
+---------------------------+
```

### Dependencies to Add
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings for i18next
- `i18next-browser-languagedetector` - Auto-detect user's language
