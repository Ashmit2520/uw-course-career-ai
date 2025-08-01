DROP TABLE IF EXISTS courses;

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  course_name TEXT,
  subject_name TEXT,
  description TEXT,
  prerequisites TEXT,
  satisfies TEXT,
  students INTEGER,
  avg_gpa REAL,
  grade_a INTEGER,
  grade_ab INTEGER,
  grade_b INTEGER,
  grade_bc INTEGER,
  grade_c INTEGER,
  grade_d INTEGER,
  grade_f INTEGER,
  terms_offered TEXT,
  filename TEXT
);
