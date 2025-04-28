// copied from: https://discord.com/channels/967097582721572934/1306521342601855056

import { SignJWT } from 'jose'
import { NextResponse } from 'next/server'
import { object, string } from 'zod'

import type { Endpoint } from 'payload'

const jwtSign = async ({
  fieldsToSign,
  secret,
  tokenExpiration,
}: {
  fieldsToSign: Record<string, unknown>
  secret: string
  tokenExpiration: number
}) => {
  const secretKey = new TextEncoder().encode(secret)
  const issuedAt = Math.floor(Date.now() / 1000)
  const exp = issuedAt + tokenExpiration
  const token = await new SignJWT(fieldsToSign)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(issuedAt)
    .setExpirationTime(exp)
    .sign(secretKey)
  return { exp, token }
}

const requestBodySchema = object({
  email: string(),
  otp: string(),
})

export const verifyOtp: Endpoint = {
  path: '/auth/otp/verify',
  method: 'post',
  handler: async (req) => {
    let email = ''
    let otp = ''

    /** Parse request body */
    if (req.json) {
      const data = await req.json()
      const parsedData = requestBodySchema.safeParse(data)

      if (!parsedData.success) {
        return NextResponse.json(
          {
            message: 'Invalid request',
            errors: parsedData.error.format(),
          },
          {
            status: 400,
          },
        )
      }

      email = parsedData.data.email
      otp = parsedData.data.otp
    }

    /** Find matching Customer */
    const users = await req.payload.find({
      collection: 'users',
      limit: 1,
      depth: 0,
      where: {
        email: { equals: email },
      },
    })

    if (!users.docs.length) {
      return NextResponse.json(
        {
          message: 'Invalid verification code',
        },
        {
          status: 401,
        },
      )
    }

    const user = users.docs[0]

    if (!user.otp?.expiry || Number(user.otp.expiry) < Date.now()) {
      return NextResponse.json(
        {
          message: 'Verification code has expired',
        },
        {
          status: 401,
        },
      )
    }

    if (user.otp.code !== otp) {
      return NextResponse.json(
        {
          message: 'Invalid verification code',
        },
        {
          status: 401,
        },
      )
    }

    const collectionConfig = req.payload.collections.users.config

    /** Unset OTP fields */
    const updatedUser = await req.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        otp: {
          code: null,
          expiry: null,
        },
      },
    })

    /** Generate JWT */
    const { token, exp } = await jwtSign({
      fieldsToSign: {
        id: user.id,
        collection: collectionConfig.slug,
        email: user.email,
      },
      secret: req.payload.secret,
      tokenExpiration: collectionConfig.auth.tokenExpiration,
    })

    return NextResponse.json({
      user,
      token,
      exp,
    })
  },
}
