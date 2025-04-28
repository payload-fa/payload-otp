# Payload OTP Authentication Example 

This example provides a complete OTP (One-Time Password) authentication system built on Payload CMS. It includes endpoints for generating and verifying OTP codes.

## Getting Started

1. Clone the repository:

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

4. Open your browser and navigate to <http://localhost:3000/admin>
5. Create an admin account and a user account

## OTP Authentication

Here's how to use it:

### Generate OTP

```http
POST /api/auth/otp/generate
Content-Type: application/json

{
    "email": "user@example.com"
}
```

### Verify OTP

```http
POST /api/auth/otp/verify
Content-Type: application/json

{
    "email": "user@example.com",
    "otp": "1234"
}
```

For more details, check:

- [Payload Discord Discussion](https://discord.com/channels/967097582721572934/1306521342601855056)
- [Payload Documentation](https://payloadcms.com/docs)
