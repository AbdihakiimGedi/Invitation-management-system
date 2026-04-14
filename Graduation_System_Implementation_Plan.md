# Graduation Invitation Management System: Implementation Plan

## 1. Overall System Workflow
The system follows a linear, dependency-driven workflow to ensure data integrity and organizational order throughout the event lifecycle.

1.  **Event Selection:** The administrator selects a pre-created event (e.g., "Engineering Class of 2026") from the dashboard.
2.  **Student Eligibility Verification:** The system pulls data for all students linked to the department/event and checks for "Eligible" status (e.g., passing finance/exam checks).
3.  **GPA Sorting:** The system automatically sorts the list of eligible students in descending order based on their Grade Point Average.
4.  **Seat Assignment:** Based on the sorted list, the system assigns seat numbers in the venue, prioritizing top-performing students for front-row/VIP placement.
5.  **Invitation Generation:** Once seats are locked, the system generates specific invitation records for the student and their allotted guests.
6.  **QR Code Generation:** A unique, secure QR code is cryptographically generated for every individual invitation.
7.  **Notification Dispatch:** The system sends invitations via Email, with a fallback to WhatsApp if the email address is missing or delivery fails.
8.  **Final Entry Validation:** Security staff at the venue scan QR codes using a mobile interface to authorize entry and prevent duplicate usage.

---

## 2. Seat Assignment Logic
Seat assignment is the core mechanism for venue organization, ensuring that the physical space is utilized efficiently and fairly.

*   **Seat Creation:** Seats are generated per event based on the venue's physical layout (Zones, Rows, and Seat Numbers).
*   **Total Capacity:** The system calculates capacity by summing all created seat records. The number of eligible students plus their guest invitations cannot exceed this total.
*   **GPA Sorting Strategy:** Students are ranked from highest to lowest GPA. The assignment engine processes this list sequentially, filling "Category: Normal" or "Category: VIP" seats accordingly.
*   **Mapping Rules:** High-GPA students are assigned to premium zones (e.g., "Honors Zone") closer to the stage to recognize their academic achievements.
*   **Capacity Handling:** If the number of invited individuals exceeds seat capacity, the system triggers a "Capacity Overflow" alert to the administrator before assignment begins, preventing over-booking.

---

## 3. Invitation Generation Logic
Invitations are generated only after seat assignment to ensure every physical card or digital message contains a confirmed location.

*   **Predefined Template System:** The system uses "Invitation Templates" to define the structure. A template dictates how many "Slots" a student is entitled to based on event parameters.
*   **Slot-Based Structure:** 
    *   **Slot 1 (Mandatory):** Automatically assigned to the "Student".
    *   **Slot 2+ (Optional/Guest):** Assigned to "Parent/Guests".
*   **Type Identification:** The system distinguishes invitation types (Student vs. Guest) based on the Slot Number defined in the template. This allows the system to use specific wording for students (e.g., "Graduate Invitation") versus guests (e.g., "Parent/Guest Invitation").

---

## 4. Parent / Guest Handling Logic
Reliable guest management is achieved through relational database linking, avoiding the pitfalls of name-based lookups.

*   **Data Storage:** Guest data is stored in a dedicated `parents_guests` table, maintaining a 1-to-MANY relationship with the student.
*   **Relational Linking:** Instead of relying on last-name matching (which is unreliable), the system uses the unique `student_id` as the foreign key. This ensures a guest is always definitively linked to a specific student.
*   **Registration Flow:**
    *   **Pre-registered:** Data provided during the initial bulk upload.
    *   **Self-Registration:** A student portal allows graduates to enter guest names and phone numbers directly, which are then validated against the student's slot allotment.

---

## 5. Database Design Requirements
To support these new features, the following architectural additions are required:

### New Tables & Relations:
*   **`seats` Table:**
    *   **Purpose:** Stores every individual chair/spot in the venue.
    *   **Fields:** `seat_id`, `event_id`, `zone`, `row`, `number`, `status` (Available/Occupied).
    *   **Connection:** Links to `events`.
*   **`parents_guests` Table:**
    *   **Purpose:** Stores contact info for guests.
    *   **Fields:** `guest_id`, `student_id`, `full_name`, `phone`, `email`.
    *   **Connection:** Links to `students` via `student_id`.
*   **`invitations` Table:**
    *   **Purpose:** The central logic table connecting an attendee to a seat.
    *   **Fields:** `invitation_id`, `attendee_type` (Student/Guest), `seat_id`, `qrcode_id`, `status` (Pending/Sent/Used).
*   **`invitation_templates` Table:**
    *   **Purpose:** Defines rules for invitation packages.
    *   **Fields:** `template_id`, `event_id`, `max_guests_per_student`, `design_theme`.

---

## 6. QR Code System Design
The QR code acts as a secure, one-time-use digital key for venue access.

*   **Data Content:** The QR code contains a unique, encrypted token (UUID) that maps to a specific record in the `invitations` table. It does not store personal data in plain text.
*   **Scan Validation Logic:**
    1.  **Scanner Auth:** Only authorized staff can scan.
    2.  **Lookup:** The system finds the invitation record associated with the QR code.
    3.  **Status Check:** If the status is already "Used", access is denied and an alert is shown.
*   **One-Time Usage:** Immediately upon a successful scan, the system updates the status to "Used" and logs the scan time, preventing the code from being shared or reused.

---

## 7. Notification System (Email + WhatsApp)
Communication is automated to ensure high delivery rates and attendee convenience.

*   **Timing:** Notifications are triggered automatically once the administrator confirms "Final Generation".
*   **Fallback Logic:**
    *   **Primary:** The system attempts an **Email** dispatch with the invitation attachment.
    *   **Fallback:** If no email exists or the email fails, the system triggers a **WhatsApp API** message containing the QR code image and event details.
*   **Targeted Content:** Students receive a "Graduate Entry Pass", while parents receive a "Guest Entry Pass" with the student's name clearly displayed.

---

## 8. Full System Architecture Flow

1.  **Event Creation:** Admins define venue and date.
2.  **Students Upload:** Bulk import of student lists and academic data.
3.  **GPA Sorting:** Automated ranking for seat priority.
4.  **Seat Assignment:** Allocation of physical spots based on rank.
5.  **Invitation Templates:** Defining the "Package" (1 Student + X Guests).
6.  **QR Generation:** Creating the unique security tokens.
7.  **Notification:** Automated dispatch via Email/WhatsApp.
8.  **Entry Scan Validation:** Mobile-based security check at the gate.

---

## 9. Business Rules and Validations
*   **Dependency Rule:** Invitations cannot be generated until seat assignment is finalized.
*   **Uniqueness Rule:** No two invitations can share the same QR code or seat.
*   **Data Integrity:** Guest names must be linked to a valid `student_id`; orphan guest records are prohibited.
*   **Security Rule:** QR codes are marked as "Used" on first successful scan; no second entry allowed.
*   **Validation Rule:** Students with "Financial Issues" or "Exam Failures" are automatically excluded from the generation batch.

---

## 10. Final Summary
The **Graduation Invitation Management System** is an advanced enterprise-grade solution designed to automate the complex logistics of university ceremonies. By leveraging a high-performance database schema, academic-based seating algorithms, and dual-channel notification systems (Email/WhatsApp), it ensures a structured and prestigious environment. The integration of cryptographic QR code validation provides superior security, guaranteeing that only authorized graduates and their guests gain entry, thereby maintaining the highest standards of safety and ceremony integrity.
