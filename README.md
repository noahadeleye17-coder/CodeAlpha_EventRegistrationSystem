# Event Registration System

CodeAlpha Backend Development Internship — Task 2.

A backend system for browsing events, registering for them, and managing capacity/waitlists, with an admin panel for creating and managing events.

## Features

- Browse events by category (Conference, Workshop, Seminar, Meetup, Webinar, Other)
- Register for an event with name, email, phone
- Automatic waitlisting when an event is full, with atomic capacity checks to avoid overbooking under concurrent requests
- Automatic promotion of the next waitlisted person when a confirmed registration is cancelled
- Admin login (JWT-based)
- Admin: create events, cancel events, view registrants per event, manually cancel a registration

## Stack

Node.js, Express, MongoDB/Mongoose, JWT auth, vanilla HTML/CSS/JS frontend.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your MongoDB URI and a JWT secret
3. Create your first admin account:
   ```
   POST /api/auth/register
   { "name": "Admin", "email": "you@example.com", "password": "yourpassword" }
   ```
   (Consider removing/protecting this route after creating your account.)
4. `npm run dev` (or `npm start`)
5. Visit `http://localhost:5000`

## API Overview

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | /api/events | No | List events (optional `?category=`) |
| GET | /api/events/:id | No | Get event detail |
| POST | /api/events | Admin | Create event |
| PUT | /api/events/:id | Admin | Update event |
| DELETE | /api/events/:id | Admin | Cancel event |
| POST | /api/events/:id/register | No | Register (confirmed or waitlisted) |
| GET | /api/events/:id/registrations | Admin | List registrants for an event |
| DELETE | /api/registrations/:id | Admin | Cancel a registration (auto-promotes waitlist) |
| POST | /api/auth/register | No | Create admin account |
| POST | /api/auth/login | No | Admin login |

## Notes

- Capacity checks use an atomic `findOneAndUpdate` with a conditional filter so two people registering for the last spot at the same time can't both get in.
- One registration per email per event is enforced at the database level.
