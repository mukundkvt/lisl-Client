# Frontend AI Context

## Stack

- React 18
- `react-router-dom` for routing
- `react-hot-toast` for transient notifications
- CSS modules for component styling
- `react-scripts` / CRA-style build pipeline

## Entry points

- `src/index.js`
- `src/App.js`

The frontend is a route-based SPA that talks to the backend through `process.env.REACT_APP_API_URL`.

## Application route map

Defined in `src/App.js`:

- `/` -> `Homepage`
- `/pan` -> `PANPage`
- `/get-started` -> `GetStartedPage`
- `/address` -> `DigiLockerLanding`
- `/digilocker-success` -> `DigiLockerSuccess`
- `/digilocker-failed` -> `DigiLockerFailed`
- `/bank-verification` -> `BankVerification`
- `/profile` -> `Profile`
- `/exchange` -> `ExchangeSelection`
- `/ipv` -> `IPV`
- `/ipv-verify` -> `IPVVerify`
- `/signature` -> `Signature`
- `/esign` -> `Esign`
- `/esign-verify` -> `EsignVerify`
- `/thank-you` -> `ThankYou`

Global UI mounted outside routes:

- `Header`
- `Toaster`

## User journey summary

The intended onboarding path is roughly:

1. mobile/email entry and verification
2. PAN verification or PAN extraction from image
3. address / identity retrieval via DigiLocker or CAMS/manual path
4. bank verification / bank proof upload
5. profile completion
6. exchange selection
7. IPV
8. signature upload
9. PDF / contract / Annexure / eSign
10. completion / thank-you state

`flow.txt` currently contains a simplified early flow reminder:

- `email -> get_started -> pan -> profile`

The actual current route graph in `App.js` is broader than `flow.txt`.

## Major component ownership

### Top-level pages

- `Pages/PANPage.js`
- `Pages/GetStartedPage.js`

These are thin page wrappers that render route-level components.

### Cross-cutting layout

- `components/Header.js`
- `components/Footer.js`
- `components/Homepage.js`

### Onboarding organism components

- `PANCard.js`
  - PAN entry
  - PAN image upload / drag-drop extraction
  - PAN confirmation modal
- `DigiLockerLanding.js`
  - address proof flow
  - DigiLocker redirect initiation
  - CAMS KRA and manual fallback behavior
- `DigiLockerSuccess.js`
  - post-DigiLocker callback completion and data pull
- `DigiLockerFailed.js`
  - failed DigiLocker state
- `BankVerification.jsx`
  - hybrid bank verification
  - reverse penny drop
  - bank proof upload
- `Profile.js`
  - main personal/profile form
- `ExchangeSelection.js`
  - exchange preferences and file upload
- `IPV.js`
  - geolocation + IPV initiation
- `IPVVerify.js`
  - polling / retrieval of IPV details
- `Signature.js`
  - signature capture and upload
- `Esign.js`
  - PDF generation, contract and Annexure handling, DDPI save
- `EsignVerify.jsx`
  - contract pull / verification continuation
- `ThankYou.jsx`
  - terminal completion state

### Helper / modal components

- `DdpiModal`
- `EditStepModal`
- `KRAAddressModal`
- `LocationModal`
- `StepToOpenAccount`

### Atoms / molecules

- `components/atom/*`
- `components/molecules/GetStarted.js`

These support the main route-level organisms.

## API integration map by component

### Homepage

Calls:

- `/api/send_mobile_otp`
- `/api/verify_mobile_otp`
- `/api/resend_mobile_otp`
- `/api/send_email_otp`
- `/api/resend_email_otp`
- `/api/verify_email_otp`
- `/api/login_user`

### Header

Calls:

- `/api/is_logged_in`

### PANCard

Calls:

- `/api/check_pan`
- `/api/extract_pan`
- `/api/confirm_pan`
- `/api/confirm_extract_pan`

Current PAN image behavior:

- accepts image files only
- supports drag-and-drop and browse
- triggers extraction immediately when file is selected
- shows loader while extraction is in progress
- clears uploaded file state when popups are closed

### DigiLockerLanding / DigiLockerSuccess

Calls:

- `/api/get_user_details`
- `/api/verify_cams_kra`
- `/api/get_districts/:state`
- `/api/create_digilocker_url`
- `/api/process_cams_kra`
- `/api/submit_manual_kyc`
- `/api/get_digilocker_details`

### BankVerification

Calls:

- `/api/hybrid_bank_account_verification`
- `/api/reverse_penny_drop_create_link`
- `/api/verify_reverse_penny_drop`
- `/api/confirm_bank`
- `/api/upload_bank_proof`

### Profile

Calls:

- `/api/get_address`
- `/api/submit_profile`
- `/api/get_districts/:state`
- `/api/get_profile`

### ExchangeSelection

Calls:

- `/api/get_exchange`
- `/api/upload`
- `/api/submit_exchange`

### IPV / IPVVerify

Calls:

- `/api/save_geo_location`
- `/api/create_ipv_url`
- `/api/get_ipv_details`

### Signature

Calls:

- `/api/signature/upload`

### Esign / EsignVerify

Calls:

- `/api/get_user_details`
- `/api/fill_form`
- `/api/fill_annexure_j`
- `/api/create_contract_url`
- `/api/pull_contract`
- `/api/create_annexure_j_url`
- `/api/pull_annexure_j`
- `/api/save_ddpi_consent`

## State and persistence patterns

- auth token is stored in `localStorage` as `authToken`
- most protected API calls send `Authorization: Bearer <token>`
- route navigation encodes onboarding stage progression
- modal-heavy UX is used for confirmation and fallback recovery

## Styling and assets

- each major component has a paired `*.module.css`
- image / icon assets live under `src/assets`
- large SVG/icon usage can trigger verbose build output but still compile

## Current known frontend notes

- `npm run build` currently succeeds with warnings
- Jest/test execution is fragile because one SVG filename contains `&` and breaks the default test pipeline parser
- There are existing lint warnings in files outside the active onboarding changes; do not treat those warnings as proof that recent features are broken

## Documentation maintenance rule

If any frontend change touches:

- routing
- onboarding step order
- API endpoints consumed by the client
- component ownership of a step
- upload/preview/modal UX

then update this file and `AI_UI_FLOW.md`.
