import pandas as pd
import sqlite3

# Adjust paths as needed
csv_file = '../scripts/grades_distribution_dummy_cleaned.csv'
db_file = '../../../courses.db'  # adjust if your .db is elsewhere

df = pd.read_csv(csv_file)

conn = sqlite3.connect(db_file)
cur = conn.cursor()

for _, row in df.iterrows():
    cur.execute("""
        INSERT OR REPLACE INTO courses
        (college, department, subject_code, subject_name_section, class_description, num_grades, ave_gpa, A, AB, B, BC, C, D, F, S, U, CR, N, P, I, NW, NR, Other)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        row['College Name'],
        row['Department Name'],
        row['Subject Code'],
        row['Subject Name + First Section'],
        row['Class Description'],
        row['# Grades'],
        row['Ave GPA'],
        row['A'],
        row['AB'],
        row['B'],
        row['BC'],
        row['C'],
        row['D'],
        row['F'],
        row['S'],
        row['U'],
        row['CR'],
        row['N'],
        row['P'],
        row['I'],
        row['NW'],
        row['NR'],
        row['Other']
    ))

conn.commit()
conn.close()
print("✅ Courses loaded into SQLite!")
