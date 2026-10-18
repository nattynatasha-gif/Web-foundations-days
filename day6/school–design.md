# School Database Design

## Tables

### students
Stores information about each student.  
Columns: `id` (primary key), `name` (required), `email` (required and unique so that each student has a distinct contact address).

### courses
Stores information about each course offered by the school.  
Columns: `id` (primary key), `title` (required), `code` (required and unique course identifier such as DB101).

### enrolments
Records the fact that a student is enrolled on a particular course and holds the grade for that enrolment.  
Columns: `id` (primary key), `student_id` (foreign key to students), `course_id` (foreign key to courses), `grade` (optional – a student may be enrolled before a grade is assigned).  
A UNIQUE constraint on `(student_id, course_id)` prevents the same student from being enrolled on the same course more than once.

## Relationships

- **students ↔ enrolments**: one-to-many. One student can have many enrolment records; each enrolment belongs to exactly one student.
- **courses ↔ enrolments**: one-to-many. One course can have many enrolment records; each enrolment belongs to exactly one course.
- **students ↔ courses**: many-to-many. A student can enrol in multiple courses and a course can have multiple students. The `enrolments` table is the join (associative) table that realises this relationship and also carries the extra attribute `grade`. A pure join table would only contain the two foreign keys; because we also need to store a grade for each student–course pair, the join table is the natural place for that data.

## Index Recommendation

I would add an index on `enrolments(student_id)`:

```sql
CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);
```

Reason: Queries that retrieve “all courses for a given student” (or that filter enrolments by student) will benefit from a fast lookup on `student_id`. Because the table is expected to grow with every new enrolment, this index keeps those common look-ups efficient.

## SQL vs NoSQL Choice

For a school enrolment system I would choose **SQL** (a relational database). The data model is highly structured and the relationships between students, courses and enrolments are well-defined and stable. We need strong consistency guarantees (a student cannot be enrolled twice on the same course, foreign-key integrity must be enforced, grades must be updated reliably) and we regularly run set-based queries that involve joins and aggregation (students per course, courses per student, students with no enrolments). These requirements map naturally onto the relational model and the declarative power of SQL. A document-oriented NoSQL store would force us either to denormalise heavily or to implement the same integrity rules and join logic in application code, which would be more error-prone and harder to maintain for this domain.
