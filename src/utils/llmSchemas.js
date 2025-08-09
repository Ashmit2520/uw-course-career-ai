import { z } from "zod";

export const coursesSchema = z.object({
  courses: z.array(z.string()),
});
export const userInfo = z.object({
  major: z.string(),
  academicInterests: z.array(z.string()),
  specificDetails: z.array(z.string()),
  targetYears: z.number(),
  credits: z.number(),
  isUndergrad: z.boolean(),
});

export const semesterSchema = z.object({
  name: z.enum(["Fall", "Spring"]),
  courses: z.array(z.string()),
});

export const yearPlanSchema = z.object({
  year: z.number(), // e.g., 1 for Freshman year
  semesters: z.array(semesterSchema),
});

export const fourYearPlanSchema = z.object({
  yearPlans: z.array(yearPlanSchema),
});
