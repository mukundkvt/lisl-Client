# Frontend UI Flow and Screen Ownership

This file describes what each major screen does, what data it needs, and what backend step it advances.

## 1. Entry and authentication

### `Homepage`

Purpose:

- first-touch onboarding screen
- handles mobile OTP, email OTP, and login-style entry

Inputs:

- mobile number
- email
- OTP values

Backend dependencies:

- send/resend/verify mobile OTP
- send/resend/verify email OTP
- login

Output:

- authenticated user session via stored token
- progression into onboarding routes

## 2. PAN stage

### `PANPage` -> `PANCard`

Purpose:

- verify PAN by number or extract PAN from uploaded PAN image

Main behaviors:

- manual PAN number validation with regex
- direct PAN verification path
- fallback modal if PAN details are not automatically available
- PAN image upload path with drag-drop support
- immediate extraction API call on image selection
- confirmation modal after successful PAN extraction

Important UX rules currently implemented:

- only image uploads are accepted
- loader appears during extraction
- closing the popup clears uploaded PAN file state
- selecting another file re-triggers extraction

Backend dependencies:

- `check_pan`
- `extract_pan`
- `confirm_pan`
- `confirm_extract_pan`

Advances to:

- `/address`

## 3. Address and identity stage

### `DigiLockerLanding`

Purpose:

- decide whether identity/address is sourced from DigiLocker, CAMS KRA, or manual entry

Main behaviors:

- loads existing user details
- initiates DigiLocker URL creation
- triggers CAMS KRA processing
- fetches district/state dependent data
- supports manual KYC fallback when automated pull is not enough

Related follow-up screens:

- `DigiLockerSuccess`
- `DigiLockerFailed`

Backend dependencies:

- `get_user_details`
- `create_digilocker_url`
- `get_digilocker_details`
- `process_cams_kra`
- `verify_cams_kra`
- `submit_manual_kyc`
- `get_districts/:state`

Advances to:

- `/bank-verification`

## 4. Bank verification stage

### `BankVerification`

Purpose:

- validate bank account ownership
- collect and upload bank proof when required

Main behaviors:

- hybrid bank verification flow
- reverse penny drop initiation and verification
- confirm bank details
- optional/proof upload path

Backend dependencies:

- `hybrid_bank_account_verification`
- `reverse_penny_drop_create_link`
- `verify_reverse_penny_drop`
- `confirm_bank`
- `upload_bank_proof`

Advances to:

- `/profile`

## 5. Profile stage

### `Profile`

Purpose:

- collect or edit the bulk of the user demographic, communication, and financial profile

Main behaviors:

- prefill from `get_address` / `get_profile`
- collect addresses, occupation, income, nominee and other onboarding fields
- load district list dynamically

Backend dependencies:

- `get_address`
- `get_profile`
- `submit_profile`
- `get_districts/:state`

Advances to:

- `/exchange`

## 6. Exchange selection stage

### `ExchangeSelection`

Purpose:

- capture exchange preferences and exchange-related upload data

Main behaviors:

- fetch saved exchange selection
- upload a supporting file
- submit selected exchanges

Backend dependencies:

- `get_exchange`
- `upload`
- `submit_exchange`

Advances to:

- `/ipv`

## 7. IPV stage

### `IPV`

Purpose:

- capture geolocation and start in-person verification flow

Main behaviors:

- save location coordinates
- create IPV verification URL/session

### `IPVVerify`

Purpose:

- retrieve or confirm the IPV result

Backend dependencies:

- `save_geo_location`
- `create_ipv_url`
- `get_ipv_details`

Advances to:

- `/signature`

## 8. Signature stage

### `Signature`

Purpose:

- collect and upload user signature asset

Backend dependencies:

- `signature/upload`

Advances to:

- `/esign`

## 9. PDF / eSign / contract stage

### `Esign`

Purpose:

- prepare final onboarding artifacts and trigger contract/Annexure workflows

Main behaviors:

- fetch user details
- generate filled forms
- generate Annexure J
- create contract and Annexure URLs
- save DDPI consent

### `EsignVerify`

Purpose:

- pull generated/signed contract state and continue the finalization flow

Backend dependencies:

- `get_user_details`
- `fill_form`
- `fill_annexure_j`
- `create_contract_url`
- `pull_contract`
- `create_annexure_j_url`
- `pull_annexure_j`
- `save_ddpi_consent`

Advances to:

- `/thank-you`

## 10. Completion stage

### `ThankYou`

Purpose:

- final terminal success state after onboarding completion

## Shared UI and support components

### `Header`

- session awareness
- route-driven top navigation behavior

### `DdpiModal`

- DDPI consent helper modal used in the eSign stage

### `EditStepModal`

- step editing helper used when revisiting onboarding sections

### `KRAAddressModal`

- address confirmation / KRA assistance UI

### `LocationModal`

- location guidance and permission help

### `StepToOpenAccount`

- step guidance / progress helper content

## Integration notes for future AI changes

- If a screen starts calling a new endpoint, update both this file and `AI_FRONTEND_CONTEXT.md`
- If a step order changes, update route progression notes here
- If a modal becomes the primary recovery path for a step, document that here
- If uploads gain new rules, note accepted types, preview rules, error handling, and when API calls are fired
