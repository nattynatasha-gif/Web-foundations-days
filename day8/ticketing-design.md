# TicketHub Design Document

## 1. Requirements

### Functional Requirements
- Users can browse upcoming events (concerts, sports, theater) with filters by date, location, genre, and price range.
- Users can view detailed event pages including venue map, available seats, and pricing tiers.
- Authenticated users can select and temporarily hold seats for a limited time (e.g., 10 minutes).
- Users can complete payment for held seats and receive digital tickets.
- Users can view their past and upcoming tickets in a personal dashboard.
- Administrators can create/manage events, set seat inventories, and monitor sales.
- The system must prevent two users from purchasing the same seat (double-booking prevention).

### Non-Functional Requirements
- **Speed / Latency**: Page loads under 200 ms for normal browsing; seat availability and hold operations under 500 ms even under peak load. Ticket purchase confirmation within 2 seconds.
- **Correctness**: Strong consistency for seat inventory and order placement. No overselling of seats. Atomic payment + seat assignment.
- **Fairness**: During high-demand sales, a fair queuing or rate-limiting mechanism so early arrivals are not starved by bots or later users. Holds expire after a fixed window so abandoned carts release seats.
- **Availability**: 99.9% uptime for browsing; ticket sales remain available during traffic spikes (graceful degradation preferred over total outage).
- **Scalability**: Handle normal daily traffic and sudden 4×–10× spikes without redesign.
- **Security**: Secure authentication, PCI-compliant payment handling (via payment gateway), protection against inventory racing conditions.

## 2. Traffic Estimates

### Normal Day
- 2,000,000 registered users (total base).
- 50,000 unique visitors per day.
- Each visitor views ~10 pages → **500,000 page views / day**.
- Average ~5.8 requests/second (500k / 86,400).
- 5,000 tickets sold per day → roughly 0.06 ticket sales per second average.
- Peak hours (evenings) might reach 3–5× average → ~20–30 RPS for browsing.

### Big Sale (Popular Concert On-Sale)
- 20,000 seats released.
- 200,000 people attempt to buy within the first 10 minutes.
- Arrival rate ≈ 200,000 / 600 s ≈ **333 attempts per second**.
- Each user typically performs several actions: view event, load seat map, select seats, hold, pay → conservative estimate of **1,000–2,000 RPS** during the opening minutes.
- Successful sales: 20,000 seats → high contention on a small set of seat records.
- Comparison: Normal peak (~25 RPS) vs Big Sale (~1,500 RPS) → roughly **60× traffic spike** focused on a few endpoints and a narrow set of database rows.

## 3. API Design

Base URL: `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List/browse events. Query params: `date`, `city`, `genre`, `page`, `limit`. Returns paginated event summaries. |
| GET | `/events/{eventId}` | Event details + venue info. |
| GET | `/events/{eventId}/seats` | Seat map and availability for an event. Returns sections, rows, seat status (available/held/sold). |
| POST | `/events/{eventId}/holds` | Hold one or more seats. Body: `{ seatIds: [], quantity? }`. Creates a short-lived hold (TTL 10 min) tied to the authenticated user. Returns `holdId` and expiry. |
| POST | `/orders` | Complete purchase. Body: `{ holdId, paymentToken }`. Validates hold, processes payment, converts hold → confirmed order + tickets. |
| GET | `/tickets` | List the current user’s tickets (upcoming + past). |
| GET | `/tickets/{ticketId}` | Single ticket details (QR code / barcode data). |

Additional supporting endpoints (auth, admin) exist but are outside the minimum five required.

## 4. Data Model

### Tables

**users**
- `id` (PK, UUID)
- `email` (unique)
- `password_hash`
- `name`
- `created_at`

**events**
- `id` (PK, UUID)
- `title`
- `description`
- `venue_id` (or embedded venue fields)
- `start_time`
- `status` (draft / published / on_sale / sold_out / cancelled)
- `created_at`

**seats**
- `id` (PK, UUID)
- `event_id` (FK → events
... 
