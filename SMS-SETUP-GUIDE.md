# SMS Setup Guide for Family Hub

This guide will walk you through setting up SMS notifications for appointments using Supabase Edge Functions and Twilio.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com - free trial available)
2. A Supabase project (you already have this!)

## Step 1: Get Twilio Credentials

1. Go to https://console.twilio.com
2. Get your **Account SID** and **Auth Token** from the dashboard
3. Get a **Twilio Phone Number** (you'll get one free with trial)
4. Save these for later:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER` (format: +1234567890)

## Step 2: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

## Step 3: Create Supabase Edge Function

1. In your project root, create the edge function:

```bash
supabase functions new send-sms-reminder
```

2. This creates a folder: `supabase/functions/send-sms-reminder/`

## Step 4: Create the SMS Function Code

Create/edit `supabase/functions/send-sms-reminder/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!

serve(async (req) => {
  try {
    const { phoneNumber, message } = await req.json()

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('From', TWILIO_PHONE_NUMBER)
    formData.append('To', phoneNumber)
    formData.append('Body', message)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send SMS')
    }

    return new Response(
      JSON.stringify({ success: true, sid: data.sid }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 5: Deploy the Edge Function

1. Link your Supabase project (if not already linked):
```bash
supabase link --project-ref your-project-ref
```

2. Set environment variables:
```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

3. Deploy the function:
```bash
supabase functions deploy send-sms-reminder
```

## Step 6: Create Scheduled Function to Check Appointments

Create `supabase/functions/check-appointments/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get appointments that need reminders
    const today = new Date()
    const appointments = await supabase
      .from('appointments')
      .select('*')
      .eq('sms_enabled', true)
      .eq('reminder_sent', false)
      .not('phone_number', 'is', null)

    if (!appointments.data) {
      return new Response(JSON.stringify({ message: 'No appointments found' }))
    }

    const remindersToSend = appointments.data.filter(apt => {
      const appointmentDate = new Date(`${apt.appointment_date}T${apt.appointment_time}`)
      const daysUntil = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil === apt.sms_days_before
    })

    // Send SMS for each appointment
    for (const apt of remindersToSend) {
      const message = `Reminder: ${apt.title} on ${apt.appointment_date} at ${apt.appointment_time}. Location: ${apt.location || 'TBD'}`

      // Call the send-sms-reminder function
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: apt.phone_number,
          message: message,
        }),
      })

      if (response.ok) {
        // Mark reminder as sent
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', apt.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${remindersToSend.length} reminders` 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

Deploy it:
```bash
supabase functions deploy check-appointments
```

## Step 7: Set Up Cron Job

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job:
   - **Name**: `check-appointment-reminders`
   - **Schedule**: `0 9 * * *` (runs daily at 9 AM)
   - **Function**: `check-appointments`

Or use pg_cron SQL:
```sql
SELECT cron.schedule(
  'check-appointment-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-appointments',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

## Step 8: Test It!

1. Create an appointment with SMS enabled
2. Set the appointment date to tomorrow
3. Set "Days Before" to 1
4. Wait for the cron job to run, or manually trigger the function

## Alternative: Simpler Approach (No Edge Functions)

If you prefer a simpler setup, you can use a Vercel serverless function instead. Let me know if you want that approach!

