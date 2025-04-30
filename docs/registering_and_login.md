# ft_transcendence – Registration & Login with 2FA

This project demonstrates a Django REST API with JWT authentication (via `django-rest-framework-simplejwt`), including two-factor authentication (2FA). The frontend is a simple Single Page Application (SPA) built with JavaScript (Fetch API).

## Table of Contents

1. [Overview](#overview)
2. [Flow Diagrams (Mermaid)](#flow-diagrams)
    - [Registration & 2FA](#registration--2fa)
    - [Login Process](#login-process)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Endpoints & Code Structure](#endpoints--code-structure)
    - [Registration](#registration)
    - [Send & Verify 2FA Code](#send--verify-2fa-code)
    - [Login](#login)
    - [Profile](#profile)
6. [Important Notes](#important-notes)

## Overview

1. User registers by providing a username, email, and password.
2. Backend creates the user (`is_verified = False`) and sends a 2FA code via email.
3. User enters the verification code.
4. Backend sets `is_verified = True`.
5. User can now log in and receive a JWT (Access + Refresh tokens).

## Flow Diagrams

### Registration & 2FA

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Frontend (SPA)
    participant Django (Backend)
    participant DB

    User->>Frontend (SPA): Opens signup form (Username/Email/Password)
    Frontend (SPA)->>Django (Backend): POST /api/users/register/ with {username, email, password}
    Django (Backend)->>DB: Stores new user (is_verified = False)
    Django (Backend)->>User: Response (User ID)
    Frontend (SPA)->>Django (Backend): POST /api/users/verify/send/ with { email }
    Django (Backend)->>DB: Generates verification_code, stores it
    Django (Backend)->>User: Sends email with verification_code
    User->>Frontend (SPA): Clicks "Verify Code" and enters code
    Frontend (SPA)->>Django (Backend): POST /api/users/verify/ with { email, code }
    Django (Backend)->>DB: Sets is_verified = True, deletes code
    Django (Backend)->>User: "User verified!"
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Frontend (SPA) fill:#bbf,stroke:#333,stroke-width:2px
    style Django (Backend) fill:#bfb,stroke:#333,stroke-width:2px
    style DB fill:#ff9,stroke:#333,stroke-width:2px
```

### Login Process

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Frontend (SPA)
    participant Django (Backend)
    participant DB

    User->>Frontend (SPA): Opens login form (Username/Password)
    Frontend (SPA)->>Django (Backend): POST /api/users/login/ (username + password)
    Django (Backend)->>DB: Verifies user data and is_verified
    alt is_verified == True
        Django (Backend)->>Frontend (SPA): {access: <token>, refresh: <token>}
        Frontend (SPA)->>LocalStorage: Stores tokens
        Frontend (SPA)->>User: "Login successful"
    else is_verified == False
        Django (Backend)->>Frontend (SPA): Error (HTTP 400/401)
        Frontend (SPA)->>User: "Login failed. User not verified."
    end
    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Frontend (SPA) fill:#bbf,stroke:#333,stroke-width:2px
    style Django (Backend) fill:#bfb,stroke:#333,stroke-width:2px
    style DB fill:#ff9,stroke:#333,stroke-width:2px
```

## Backend Setup

- Python version: e.g., 3.9+
- Virtual environment (optional but recommended)
- Install dependencies:

```sh
pip install -r requirements.txt
```

- Apply Django migrations:

```sh
python manage.py migrate
```

- Start the server:

```sh
python manage.py runserver
```

## Frontend Setup

The frontend is an SPA using pure JavaScript (Fetch API). To test it, you can:

- Open `index.html` locally or serve it using `python -m http.server`.
- Ensure your URLs (e.g., `http://127.0.0.1:8000/api/users/...`) are correct.

If you encounter cross-origin issues, enable CORS (e.g., via `django-cors-headers`).

## Endpoints & Code Structure

### Registration

- URL: `POST /api/users/register/`
- Body: `{ "username": "...", "email": "...", "password": "..." }`
- Response: User data (JSON) or error

### Send & Verify 2FA Code

- URL: `POST /api/users/verify/send/`
  - Body: `{ "email": "..." }`
  - Generates a `verification_code`, stores it in the database, and sends it via email.
- URL: `POST /api/users/verify/`
  - Body: `{ "email": "...", "code": "..." }`
  - If the code is correct: Sets `is_verified = True`.

### Login

- URL: `POST /api/users/login/`
- Body: `{ "username": "...", "password": "..." }`
- Response: `{ "access": "...", "refresh": "..." }` or error if `is_verified = False`.

### Profile

- URL: `GET /api/users/profile/`
  - Header: `Authorization: Bearer <access-token>`
  - Returns user data (e.g., username, email, bio, avatar).
- URL: `PUT /api/users/profile/`
  - Body: Fields to update (e.g., `{ "bio": "...", "avatar": "..." }`).
  - Header: `Authorization: Bearer <access-token>`
  - Updates the profile only if `is_verified = True`.

## Important Notes

- **JWT Refresh**: The access token expires after a short time; use the refresh token to request a new access token (`POST /api/users/token/refresh/`).
- **Logout**: With JWT, logout is typically client-side by deleting tokens (`localStorage.removeItem(...)`). Optionally, you can set up SimpleJWT blacklisting.
- **Security**:
  - Ensure you use SSL/HTTPS in production when transmitting passwords or tokens.
  - Verify that CSRF and CORS handling in Django settings are correctly configured if the frontend runs separately from the backend.