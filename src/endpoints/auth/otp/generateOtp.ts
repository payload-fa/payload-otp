// copied from: https://discord.com/channels/967097582721572934/1306521342601855056

import { customAlphabet } from 'nanoid'
import { NextResponse } from 'next/server'
import { object, string } from 'zod'

import type { Endpoint } from 'payload'
import { sendOtp } from '../../../lib/sendOtp'

const nanoid = customAlphabet('1234567890')

const requestBodySchema = object({
  email: string(),
})

const otpLength = 4 // digits
const otpExpiryDuration = 2 // minutes

export const generateOtp: Endpoint = {
  path: '/auth/otp/generate',
  method: 'post',
  handler: async (req) => {
    let email = ''

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
    }

    const users = await req.payload.find({
      collection: 'users',
      limit: 1,
      depth: 0,
      where: { email: { equals: email } },
    })

    if (!users.docs.length) {
      return NextResponse.json(
        {
          message: 'Invalid user',
        },
        {
          status: 401,
        },
      )
    }

    const user = users.docs[0]

    // Check if there's an existing OTP that hasn't expired yet
    if (user.otp?.expiry && new Date(user.otp.expiry) > new Date()) {
      const remainingMs = new Date(user.otp.expiry).getTime() - Date.now()
      const minutes = Math.floor(remainingMs / (60 * 1000))
      const seconds = Math.ceil((remainingMs % (60 * 1000)) / 1000)
      const timeMessage =
        minutes > 0 ? `${minutes} minutes and ${seconds} seconds` : `${seconds} seconds`
      return NextResponse.json(
        {
          message: `Please wait ${timeMessage} for the previous code to expire`,
        },
        {
          status: 429,
        },
      )
    }

    const otp = nanoid(otpLength)

    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        otp: {
          code: otp,
          expiry: new Date(Date.now() + otpExpiryDuration * 60 * 1000).toISOString(),
        },
      },
    })

    await sendOtp(email, otp)

    return NextResponse.json(
      {
        message: 'Verification code sent successfully',
      },
      { status: 200 },
    )
  },
}
