# SnapShare Photo-Sharing App – Scaling Plan

## Assumptions

- 10 million registered users.
- 10% of registered users are active each day → **Daily Active Users (DAU) = 1,000,000**.
- Each active user uploads **1 photo per day**.
- Each active user views **50 feed pages per day**.
- Average photo size = **2 MB**.
- Each photo also produces a **50 KB thumbnail**.
- Traffic is relatively evenly distributed across the day for average calculations; peak traffic is estimated at **5×** average.
- Photos are permanent (no automatic deletion); storage grows linearly with uploads.
- “Feed page view” means a request that returns a page of photo metadata + thumbnail URLs (not the full-resolution images themselves).
- Thumbnails are generated asynchronously after upload.

## Traffic & Storage Estimates

### Daily Active Users
```
DAU = 10,000,000 × 0.10 = 1,000,000
```

### Uploads
```
Uploads per day     = 1,000,000
Uploads per second  = 1,000,000 / 86,400 ≈ 11.57 uploads/sec
Peak uploads/sec    = 11.57 × 5 ≈ 57.9 uploads/sec
```

### Feed Views
```
Feed views per day      = 1,000,000 × 50 = 50,000,000
Feed views per second   = 50,000,000 / 86,400 ≈ 578.7 views/sec
Peak feed views/sec     = 578.7 × 5 ≈ 2,893.5 views/sec
```

### Storage per Year
```
Photo storage/year      = 1,000,000 photos/day × 2 MB × 365 ≈ 730 TB
Thumbnail storage/year  = 1,000,000 × 0.05 MB × 365 ≈ 18.25 TB
Total new storage/year  ≈ 748 TB
```

## Read-Heavy vs Write-Heavy

The system is **read-heavy**.

- Write QPS (uploads) ≈ 12/sec average
- Read QPS (feed views) ≈ 579/sec average (≈ 50× higher)

This means the design should prioritise:

- Caching of feed data and popular thumbnails
- Read replicas for the database
- CDN for static assets (especially thumbnails and photos)
- Asynchronous processing of non-critical write-side work (thumbnail generation)

## Why Photos Should Not Be Stored in the Database

Storing multi-megabyte binary blobs inside a relational database is inefficient: it bloats the database, slows down backups/replication, increases I/O contention, and makes horizontal scaling of the data tier much harder.  

Instead, photo files (and their thumbnails) should be stored in **object storage** (e.g. S3, GCS, or equivalent). The database only stores lightweight metadata (user_id, photo_id, object key/URL, timestamp, caption, etc.).

## Architecture Diagram (Text)

```
                         ┌─────────────┐
                         │    Users    │
                         └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │     CDN     │  (thumbnails + photos)
                         └──────┬──────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Load Balancer      │
                    └───────────┬───────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │ App Srv 1│   │ App Srv 2│   │ App Srv N│
         └────┬─────┘   └────┬─────┘   └────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌──────────────┐
       │   Cache    │ │  Database  │ │ Object Store │
       │ (Redis)    │ │ (Primary + │ │ (Photos +    │
       │            │ │ Read Replica)│ │ Thumbnails) │
       └────────────┘ └──────┬─────┘ └──────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │    Queue    │
                      └──────┬──────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ Thumbnail   │
                      │   Worker    │
                      └─────────────┘
```

## Component Responsibilities (One Sentence Each)

- **CDN** – Serves photos and thumbnails from edge locations close to users, reducing latency and origin load.
- **Load Balancer** – Distributes incoming HTTP traffic evenly across multiple application servers for high availability and horizontal scale.
- **App Servers** – Handle business logic: authentication, feed generation, upload orchestration, and API responses.
- **Cache (Redis)** – Stores hot feed pages, user session data, and frequently accessed metadata to absorb the majority of read traffic.
- **Database (Primary + Read Replica)** – Stores user accounts, follow relationships, and photo metadata; the read replica offloads feed and profile queries.
- **Object Storage** – Durable, highly scalable storage for the actual photo binary files and generated thumbnails.
- **Queue + Thumbnail Worker** – Decouples the upload path from the CPU-intensive thumbnail generation so that the user receives a fast response.

## Step-by-Step Upload Flow

1. Client authenticates and sends the photo (multipart upload) to the load balancer → app server.
2. App server validates the request, generates a unique photo ID, and writes the original file to Object Storage.
3. App server inserts a metadata record (photo_id, user_id, object_key, status=“processing”, …) into the primary database.
4. App server enqueues a “generate-thumbnail” job containing the photo_id and object key into the Queue.
5. App server immediately returns a success response (with the photo_id) to the client.
6. Thumbnail Worker dequeues the job, downloads the original from Object Storage, generates the 50 KB thumbnail, and uploads the thumbnail back to Object Storage.
7. Worker updates the photo metadata record (thumbnail_key, status=“ready”).
8. Subsequent feed requests can now include the thumbnail URL (served via CDN).

## Trade-offs

1. **Synchronous vs Asynchronous Thumbnail Generation**  
   Generating the thumbnail synchronously would give the user an immediately complete photo, but it would increase upload latency and couple the critical path to a CPU-bound task. Asynchronous generation (via queue + worker) keeps the upload fast at the cost of a short period where the photo appears without a thumbnail (or with a placeholder).

2. **Strong Consistency vs Eventual Consistency for Feed**  
   Writing the photo metadata to the primary and then immediately reading from a replica (or cache) can produce a short window where the newly uploaded photo does not yet appear in the uploader’s own feed. Accepting eventual consistency simplifies scaling the read path and improves overall throughput, but requires careful UX design (e.g. optimistic UI updates on the client).
