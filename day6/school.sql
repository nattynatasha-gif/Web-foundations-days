-- School Database Schema and Sample Data
-- SQLite compatible

-- Students table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- Enrolments table (join table for many-to-many relationship)
-- Prevents the same student enrolling on the same course twice via UNIQUE constraint
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);

-- Insert at least 3 students
INSERT INTO students (name, email) VALUES
    ('Alice Johnson', 'alice.johnson@example.com'),
    ('Bob Smith', 'bob.smith@example.com'),
    ('Carol Williams', 'carol.williams@example.com'),
    ('David Brown', 'david.brown@example.com');

-- Insert at least 3 courses
INSERT INTO courses (title, code) VALUES
    ('Introduction to Databases', 'DB101'),
    ('Web Development Fundamentals', 'WEB101'),
    ('Data Structures and Algorithms', 'CS201'),
    ('Software Engineering Principles', 'SE301');

-- Insert at least 5 enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 'A'),   -- Alice in DB101
    (1, 2, 'B+'),  -- Alice in WEB101
    (2, 1, 'B'),   -- Bob in DB101
    (2, 3, 'A-'),  -- Bob in CS201
    (3, 2, 'A'),   -- Carol in WEB101
    (3, 3, 'B+'),  -- Carol in CS201
    (3, 4, NULL);  -- Carol in SE301 (no grade yet)

-- ============================================================
-- Five required queries
-- ============================================================

-- 1. All courses for one student (by name) - Alice Johnson
SELECT c.title, c.code, e.grade
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
WHERE s.name = 'Alice Johnson';

-- 2. All students on one course - Introduction to Databases (DB101)
SELECT s.name, s.email, e.grade
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON e.student_id = s.id
WHERE c.code = 'DB101';

-- 3. The number of students per course
SELECT c.title, c.code, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.title, c.code
ORDER BY student_count DESC;

-- 4. Students who have no enrolments
SELECT s.name, s.email
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- 5. An update of one enrolment's grade
-- Update Carol's grade for Software Engineering Principles from NULL to 'A-'
UPDATE enrolments
SET grade = 'A-'
WHERE student_id = 3 AND course_id = 4;

-- Verify the update
SELECT s.name, c.title, e.grade
FROM enrolments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
WHERE s.name = 'Carol Williams' AND c.code = 'SE301';
