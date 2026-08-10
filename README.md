# StudyMate: Your Academic Hub

Build a professional, production-style full-stack web application called StudyMate – Student Timetable & Study Planner.

The target users are college students who need one place to manage their class timetable, study tasks, subjects, exams, assignments, and academic progress.

DESIGN / UI

Create a modern, premium SaaS-style UI that looks impressive enough for a college project and resume portfolio.

Clean and minimal interface

Responsive on desktop, tablet, and mobile

Modern dashboard layout with sidebar navigation

Professional typography and spacing

Attractive but not overly colorful

Smooth hover effects and subtle animations

Cards with rounded corners and clean shadows

Light and dark mode

Use icons consistently

Make the interface feel like a real productivity application, not a basic college project

TECH STACK

Use:

React

TypeScript

Tailwind CSS

Modern component architecture

Supabase for authentication and database

Proper reusable components

Clean folder structure

No unnecessary libraries

AUTHENTICATION

Implement:

Sign up

Login

Logout

Protected dashboard

User-specific data

After login, each student should only see their own timetable, tasks, subjects and notes.

MAIN DASHBOARD

Create a dashboard showing:

Good morning/afternoon greeting

Today's date

Today's classes

Today's study tasks

Upcoming assignments/exams

Study progress

Quick statistics:

Total subjects

Classes today

Pending tasks

Completed tasks

Include quick-action buttons such as:

Add Class

Add Task

Add Subject

TIMETABLE

Create a weekly timetable.

Features:

Monday to Sunday

Time slots

Subject name

Faculty name

Classroom

Start time and end time

Color-coded subjects

Add class

Edit class

Delete class

View today's schedule

Highlight the current day

Make the timetable visually clean and easy to read.

SUBJECTS

Create a Subjects page.

Each subject should contain:

Subject name

Subject code

Faculty

Credits

Color

Notes

Allow users to:

Add subject

Edit subject

Delete subject

View subject details

STUDY PLANNER

Create a study planner where students can create tasks.

Each task should have:

Task title

Subject

Description

Priority

Due date

Status

Statuses:

Pending

In Progress

Completed

Allow:

Add task

Edit task

Delete task

Mark task complete

Filter by subject/status/priority

Sort by due date

EXAMS & ASSIGNMENTS

Create an academic deadlines page.

Allow students to add:

Exam

Assignment

Project

Other deadline

Fields:

Title

Subject

Type

Date

Description

Status

Display upcoming deadlines prominently on the dashboard.

NOTES

Create a simple notes section.

Students should be able to:

Create notes

Edit notes

Delete notes

Associate notes with a subject

Search notes

PROGRESS

Create a progress dashboard showing:

Completed tasks

Pending tasks

Tasks by subject

Study completion percentage

Upcoming deadlines

Use simple charts/cards where useful, but don't overcomplicate the application.

DATABASE

Create a proper Supabase database structure for:

users/profiles

subjects

timetable/classes

tasks

deadlines

notes

Use relationships between tables where appropriate.

Implement Row Level Security so users can only access their own data.

RESPONSIVENESS

The application must work properly on:

Desktop

Laptop

Tablet

Mobile

On mobile, convert the sidebar into a clean mobile navigation/menu.

IMPORTANT

Do NOT create fake/static data as the main functionality.

All important user data should be stored in Supabase and persist after refreshing the page.

Make all CRUD operations functional.

Handle:

Loading states

Empty states

Form validation

Error messages

Success notifications

Confirmation before destructive actions

Create a polished landing/login experience and then the authenticated student dashboard.

Prioritize working functionality, clean architecture, professional UI/UX, and maintainable code over adding unnecessary features.

At the end, make sure the application runs without errors and all navigation, authentication, database operations, forms, and CRUD functionality work correctly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://study-buddy-pro-937.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/24e08160-a592-4a76-aceb-2c3dee69ab7c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
