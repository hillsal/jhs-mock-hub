# Hills Mock Mastery

Build the following feature into my existing Hills Educational Consult / Hills Examination Board website.

FEATURE: JHS SCHOOL MEMBERSHIP + MOCK PREDICTION PURCHASE

Create a complete online system specifically for JHS schools.

The purpose is:

School Registration → Select Student/Candidate Numbers → Select Mock Type → Select Prediction → Pay Online → Receive Email → Download Prediction

Do not redesign or break the existing website. Keep the current branding, navigation and existing features.

1. JHS MEMBERSHIP REGISTRATION

Create a page called:

JHS MEMBERSHIP REGISTRATION

The registration form should collect:

School Information

School Name

School Type

Region

District/Municipality

School Address

School Phone

School Email

WhatsApp Number

School Contact Person

Headteacher/Headmaster/Headmistress Name

Mock Coordinator Name

Coordinator Phone

Coordinator WhatsApp

Coordinator Email

Student Information

Add:

TOTAL NUMBER OF JHS STUDENTS

The school enters the total number of JHS students.

Then add:

SELECT NUMBER OF MOCK CANDIDATES

Use a dropdown with options such as:

10

20

30

40

50

60

70

80

90

100

150

200

Other

The number of candidates selected MUST NOT exceed the total number of JHS students.

Show an error if it does.

2. SELECT MOCK TYPE

After registration, allow the school to select the mock examination.

Example options:

BECE Mock Examination

JHS School Mock Examination

Other Mock Examination

The admin must be able to add/edit/remove mock types from the admin dashboard.

3. SELECT PREDICTION

After selecting the mock, display the available prediction packages.

For example:

FULL BECE PREDICTION

Subjects may include:

English Language

Mathematics

Integrated Science

Social Studies

Computing

RME

French

Ghanaian Language

Also allow individual subject predictions if the administrator enables them.

The administrator must be able to control which subjects are included.

4. PRICE CALCULATION

The system must automatically calculate the amount to pay based on:

Mock Type + Prediction Package + Number of Candidates

Example:

50 candidates × GH₵10 = GH₵500

Show:

ORDER SUMMARY

School Name

Mock Type

Number of Candidates

Prediction Package

Price

Total Amount

Prices must be controlled from the admin dashboard/database.

Do not hard-code prices in the frontend.

5. ONLINE PAYMENT

The prediction must be paid for online.

Use Paystack.

Add button:

PAY FOR PREDICTION

Payment process:

Create order.

Calculate amount.

Open Paystack.

School makes payment.

Verify payment securely on the backend.

Change payment status to PAID.

Activate prediction access.

Send confirmation email.

Allow the school to download the prediction.

IMPORTANT:

Never grant access simply because the frontend says payment was successful. Verify the Paystack transaction on the backend.

6. SCHOOL ACCOUNT

After registration, create an account for the school.

Automatically generate a unique membership number such as:

HEB-JHS-2026-0001

Allow login using:

Email

Password

Include:

Login

Logout

Forgot Password

Password Reset

7. SCHOOL DASHBOARD

After login, show:

Welcome, [School Name]

Dashboard cards:

MEMBERSHIP

Membership ID

Membership Status

STUDENTS

Total JHS Students

MOCK CANDIDATES

Number of Candidates

MOCK

Selected Mock

PREDICTIONS

Number of Purchased Predictions

PAYMENTS

Total Amount Paid

8. MY PREDICTIONS

Create:

MY PREDICTIONS

Show all predictions purchased by the school.

Each prediction should display:

Prediction Name

Mock Type

Subjects

Number of Candidates

Purchase Date

Payment Status

Availability Status

Buttons:

VIEW PREDICTION

DOWNLOAD PREDICTION

The prediction should normally be a PDF.

Only schools that have successfully paid should have access.

9. EMAIL ACCESS

After successful payment, automatically send an email to the school's registered email.

Subject:

Your Hills Examination Board Mock Prediction Is Ready

The email should contain:

School Name

Mock Type

Number of Candidates

Prediction Package

Amount Paid

Payment Reference

Date

Include a secure button:

ACCESS YOUR PREDICTION

The button should take the school to the website where they can log in and access/download their prediction.

Do not expose prediction files through unrestricted public URLs.

10. PAYMENT HISTORY

Create:

MY PAYMENTS

Display:

Transaction ID

Order Number

Date

Mock

Prediction

Candidates

Amount

Payment Status

Statuses:

Pending

Paid

Failed

Cancelled

11. ADMIN DASHBOARD

Create an admin dashboard for managing the system.

SCHOOLS

Admin can:

View schools

Search schools

View school details

Approve registration

Suspend school

Activate school

Edit school information

Show:

School Name

Membership ID

Region

District

Total JHS Students

Mock Candidates

Mock Type

Registration Date

Status

PRODUCTS

Admin can:

Create prediction products

Edit products

Delete products

Set price

Set candidate limits

Set validity period

Upload prediction PDF

Activate/deactivate products

ORDERS

Admin can:

View orders

Search orders

Filter orders

View school

View candidates

View payment reference

View amount

View payment status

PAYMENTS

Show:

Total Revenue

Successful Payments

Pending Payments

Failed Payments

PREDICTIONS

Admin can upload and manage prediction PDFs.

12. DATABASE

Create appropriate database tables for:

schools

users

mock_types

prediction_products

orders

payments

prediction_access

Important school fields:

school_name

membership_id

region

district

school_email

phone

whatsapp

total_jhs_students

mock_candidates

mock_type

membership_status

Important order fields:

order_number

school_id

product_id

candidate_count

amount

payment_status

created_at

Important payment fields:

order_id

school_id

paystack_reference

amount

currency

status

paid_at

13. SECURITY

Use proper authentication and database security.

A school must only see its own:

Account

Registration

Student information

Orders

Payments

Predictions

School A must never be able to access School B's information or predictions.

Use Row Level Security where supported.

Prediction files should be stored securely.

14. REGISTRATION FLOW

Make registration a simple multi-step process:

STEP 1 — SCHOOL INFORMATION

↓

STEP 2 — STUDENT & CANDIDATE INFORMATION

↓

STEP 3 — SELECT MOCK

↓

STEP 4 — SELECT PREDICTION

↓

STEP 5 — ORDER SUMMARY

↓

STEP 6 — ONLINE PAYMENT

↓

STEP 7 — PREDICTION ACCESS

Show a progress indicator at the top.

15. COMPLETE WORKFLOW

The final system must work exactly like this:

School visits website

↓

JHS Membership Registration

↓

Enters total number of JHS students

↓

Selects number of mock candidates

↓

Selects type of mock

↓

Selects prediction package

↓

System calculates price

↓

School pays online with Paystack

↓

Payment is verified

↓

Prediction is unlocked

↓

School receives email

↓

School logs into website

↓

Opens MY PREDICTIONS

↓

Views/Downloads prediction PDF

IMPORTANT

First inspect the existing project before making changes.

Reuse the existing:

Authentication

Database

UI components

Branding

Payment system

Email system

Storage

Do not create duplicate systems if they already exist.

Do not use fake payment confirmation.

Do not use fake prediction access.

Everything should be connected to the real database.

Make the entire feature fully responsive and professional on both phone and computer.

After implementation, test the complete workflow from registration through payment, email notification and prediction download.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://jhs-mock-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5d31eac-09f3-4106-aa10-be86d85e1d9f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
