# TicketHub – Event Ticketing System Design

## 1. Requirements

### Functional Requirements
- Users can browse and search events by date, city, genre, and price.
- Users can view an event’s details and an interactive seat map showing which seats are available, held, or sold.
- Authenticated users can select seats and place a temporary hold (10 minutes).
- Users can pay for held seats and receive digital tickets (with QR code).
- Users can view their purchased tickets.
- The system must never allow two people to buy the same seat.

### Non-Functional Requirements (Critical)
- **Speed**: Normal page loads < 200 ms. Seat map and hold creation < 500 ms even under peak load. Payment confirmation < 2 seconds.
- **Correctness**: Strong consistency on seat inventory. Zero overselling. Seat assignment and payment must be atomic.
- **Fairness**: During a popular on-sale, users who arrive early must not be blocked by bots or later users. Abandoned holds must release seats quickly so others can buy them. A waiting room / rate limiter is used when traffic exceeds capacity.
- **Availability**: 99.9% uptime for browsing. During big sales the system degrades gracefully (queue users) rather than crashing.
- **Scalability**: Must handle both normal traffic and sudden multi-ten times spikes without rewriting the system.

## 2. Traffic Estimates

### Normal Day
- 2 000 000 registered users
- 50 000 people visit the site
- Each person views 10 pages → **500 000 page views per day**
- Average request rate: 500 000 ÷ 86 400 ≈ **5.8 requests/second**
- Peak hours (evenings) ≈ 4× average → **≈ 25 requests/second**
- 5 000 tickets sold → very low write rate (\~0.06 sales/second)

### Big Sale (Popular Concert)
- 20 000 seats go on sale
- 200 000 people try to buy them in the first 10 minutes
- Arrival rate: 200 000 ÷ 600 seconds = **≈ 333 people per second**
- Each person does multiple actions (view event → load seat map → select seats → hold → pay). Realistic peak load on the critical path: **1 000 – 2 000 requests/second**
- All contention is focused on only 20 000 seat rows

**Comparison**  
Normal peak ≈ 25 RPS  
Big-sale peak ≈ 1 500 RPS  
→ Roughly **60× traffic spike**, concentrated on a few endpoints and a small number of database rows. This is the classic “flash sale” problem.

## 3. API Design

Base path: `/api/v1`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/events` | Browse / search events (query: date, city, genre, page, limit) |
| GET | `/events/{eventId}` | Get full event details |
| GET | `/events/{eventId}/seats` | Get seat map + current availability |
| POST | `/events/{eventId}/holds` | Hold one or more seats for 10 minutes |
| POST | `/orders` | Pay for a hold and create the order + tickets |
| GET | `/tickets` | List the current user’s tickets |
| GET | `/tickets/{ticketId}` | Get a single ticket (includes QR data) |

These five core endpoints (browse, seats, hold, pay, view tickets) fully cover the required user journeys.

## 4. Data Model

### Tables

**users**
- id (UUID, Primary key)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)

**events**
- id (UUID, Primary key)
- title (VARCHAR)
- description (TEXT)
- venue (VARCHAR)
- start_time (TIMESTAMP)
- status (ENUM: draft / published / on_sale / sold_out)
- created_at (TIMESTAMP)

**seats**
- id (UUID, Primary key)
- event_id (UUID, FK → events)
- section (VARCHAR)
- row (VARCHAR)
- number (VARCHAR)
- price_cents (INTEGER)
- status (ENUM: available / held / sold)
- hold_id (UUID, nullable)
- held_until (TIMESTAMP, nullable)
- Unique constraint: (event_id, section, row, number)

**orders**
- id (UUID, Primary key)
- user_id (UUID, FK → users)
- event_id (UUID, FK → events)
- status (ENUM: pending / paid / cancelled)
- total_cents (INTEGER)
- created_at (TIMESTAMP)
- paid_at (TIMESTAMP, nullable)

**order_items**
- id (UUID, Primary key)
- order_id (UUID, FK → orders)
- seat_id (UUID, FK → seats, unique)
- price_cents (INTEGER)

### Relationships
- One Event → many Seats
- One User → many Orders
- One Order → many Order Items
- One Seat → at most one Order Item

### How Double-Booking Is Prevented
We use database constraints and transactions:

1. Unique constraint on (event_id, section, row, number)
2. When holding seats we run a transaction:
   BEGIN;
   SELECT * FROM seats WHERE id IN (...) AND status = 'available' FOR UPDATE;
   UPDATE seats SET status = 'held', hold_id = ..., held_until = now() + interval '10 minutes' WHERE id IN (...);
   COMMIT;
3. The FOR UPDATE lock makes sure only one person can take a seat.
4. Holds expire after 10 minutes and seats become available again.
5. Final payment changes status from held to sold inside another short transaction.

This guarantees no two people can buy the same seat.

## 5. Architecture

Clients → CDN → API Gateway + Load Balancer (with Waiting Room) → Browse Service / Seat-Hold Service / Order Service → Redis + PostgreSQL → Payment Gateway

- CDN handles static files
- Waiting Room protects the system during big sales
- Redis stores temporary holds with automatic expiry
- PostgreSQL is the source of truth and uses transactions + row locks
- This design survives the 200,000 people trying to buy 20,000 seats

## 6. Trade-offs

1. Strong consistency vs speed: We use locking so double-booking is impossible, even if it is a bit slower under heavy load.
2. 10-minute hold time: Gives users enough time to pay, but temporarily locks seats. Shorter holds free seats faster but frustrate real users.
