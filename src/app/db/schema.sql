-- src/app/db/schema.sql

CREATE TABLE courses (
    college              TEXT,
    department           TEXT,
    subject_code         TEXT,
    subject_name_section TEXT PRIMARY KEY,  -- using this as unique ID
    class_description    TEXT,
    num_grades           INTEGER,
    ave_gpa              REAL,
    A                    REAL,
    AB                   REAL,
    B                    REAL,
    BC                   REAL,
    C                    REAL,
    D                    REAL,
    F                    REAL,
    S                    REAL,
    U                    REAL,
    CR                   REAL,
    N                    REAL,
    P                    REAL,
    I                    REAL,
    NW                   REAL,
    NR                   REAL,
    Other                TEXT
);
