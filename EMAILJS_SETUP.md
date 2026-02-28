# 📧 EmailJS Setup Guide for Event Registration Confirmation

This guide explains how to set up EmailJS to send automatic confirmation emails to students after they register for events.

---

## 📋 Overview

When a student successfully registers for an event, they receive an automatic confirmation email containing:

- ✅ Event details (name, date, time, venue)
- ✅ Student's registration information (name, email, phone, college, branch, year, gender)
- ✅ Custom field responses (if any)
- ✅ Payment status and amount (for paid events)
- ✅ Organizer contact information
- ✅ Registration date and time

---

## 🚀 Setup Steps

### Step 1: Create EmailJS Account

1. Go to [EmailJS Website](https://www.emailjs.com/)
2. Click **Sign Up** and create a free account
3. Verify your email address

---

### Step 2: Add Email Service

1. After logging in, click **Email Services** in the left sidebar
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (Recommended for personal use)
   - **Outlook**
   - **Yahoo**
   - Or any other provider
4. Click **Connect Account** and authorize EmailJS
5. Give your service a name (e.g., "Festify Event Registration")
6. **Copy the Service ID** (e.g., `service_s3vs3vu`) - you'll need this later
7. Click **Create Service**

---

### Step 3: Create Email Template

1. Click **Email Templates** in the left sidebar
2. Click **Create New Template**
3. **Template Name:** `Event Registration Confirmation`
4. **Email Subject:** `Registration Confirmed - {{event_name}}`

#### Email Content (Copy this):

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section h3 { color: #f97316; margin-top: 0; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Registration Confirmed!</h1>
      <p>Thank you for registering</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h3>📅 Event Details</h3>
        <div class="info-row"><span class="label">Event Name:</span> {{event_name}}</div>
        <div class="info-row"><span class="label">Fest:</span> {{fest_name}}</div>
        <div class="info-row"><span class="label">Date:</span> {{event_date}}</div>
        <div class="info-row"><span class="label">Time:</span> {{event_time}}</div>
        <div class="info-row"><span class="label">Venue:</span> {{event_venue}}</div>
      </div>
      
      <div class="section">
        <h3>👤 Your Registration Details</h3>
        <div class="info-row"><span class="label">Name:</span> {{student_name}}</div>
        <div class="info-row"><span class="label">Email:</span> {{student_email}}</div>
        <div class="info-row"><span class="label">Phone:</span> {{student_phone}}</div>
        <div class="info-row"><span class="label">College:</span> {{student_college}}</div>
        <div class="info-row"><span class="label">Branch:</span> {{student_branch}}</div>
        <div class="info-row"><span class="label">Year:</span> {{student_year}}</div>
        <div class="info-row"><span class="label">Gender:</span> {{student_gender}}</div>
        <div class="info-row"><span class="label">Registered On:</span> {{registration_date}}</div>
      </div>
      
      <div class="section">
        <h3>📝 Additional Information</h3>
        <div style="white-space: pre-line;">{{custom_fields}}</div>
      </div>
      
      <div class="section">
        <h3>💳 Payment Status</h3>
        <div class="info-row"><span class="label">Status:</span> {{payment_status}}</div>
        <div class="info-row"><span class="label">Amount:</span> {{payment_amount}}</div>
      </div>
      
      <div class="section">
        <h3>📞 Organizer Contacts</h3>
        <div style="white-space: pre-line;">{{organizer_contacts}}</div>
      </div>
      
      <div class="footer">
        <p>If you have any questions, please contact the event organizers.</p>
        <p><strong>Festify</strong> - Your Campus Event Platform</p>
      </div>
    </div>
  </div>
</body>
</html>
```

5. **Copy the Template ID** (e.g., `template_xyz789`) - you'll need this later
6. Click **Save**

---

### Step 4: Get Your Public Key

1. Click **Account** in the left sidebar
2. Scroll down to **API Keys** section
3. **Copy the Public Key** (e.g., `abcdefg123456`)

---

### Step 5: Add Environment Variables

1. Open your project's `.env` file
2. Add the following variables with your copied values:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefg123456
```

3. Replace the values with your actual IDs from EmailJS
4. Save the file

---

### Step 6: Update .env.example (Optional)

Add these lines to `.env.example` so other developers know what to configure:

```env
# EmailJS Configuration (for sending confirmation emails)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

### Step 7: Restart Development Server

```bash
npm run dev
```

---

## ✅ Testing

1. Create a test event (as organizer)
2. Register for the event (as student)
3. Check your email inbox (and spam folder)
4. You should receive a confirmation email within a few seconds

---

## 📊 EmailJS Free Tier Limits

- ✅ **200 emails per month** (Free plan)
- ✅ Unlimited email templates
- ✅ All email services supported

If you need more emails, you can upgrade to a paid plan starting at $7/month for 1000 emails.

---

## 🔍 Troubleshooting

### Email Not Received?

1. **Check spam/junk folder**
2. **Verify environment variables:**
   ```bash
   # In your terminal
   echo $VITE_EMAILJS_SERVICE_ID
   echo $VITE_EMAILJS_TEMPLATE_ID
   echo $VITE_EMAILJS_PUBLIC_KEY
   ```
3. **Check browser console** for error messages
4. **Verify EmailJS dashboard** - Check "History" tab to see if email was sent
5. **Test email service** - Send a test email from EmailJS dashboard

### Emails Going to Spam?

1. Use a custom domain email (instead of Gmail)
2. Set up SPF and DKIM records
3. Ask users to add your email to their contacts

### Rate Limit Exceeded?

You've reached the free tier limit (200 emails/month). Either:
- Wait until next month
- Upgrade to a paid plan
- Use a different email service

---

## 🎯 Email Content Customization

You can customize the email template in EmailJS dashboard:

1. Go to **Email Templates**
2. Click on your template
3. Edit the HTML content
4. Use these variables:
   - `{{to_name}}` - Student name
   - `{{event_name}}` - Event name
   - `{{fest_name}}` - Fest name
   - `{{event_date}}` - Event date
   - `{{event_time}}` - Event time
   - `{{event_venue}}` - Event venue
   - `{{student_name}}` - Student name
   - `{{student_email}}` - Student email
   - `{{student_phone}}` - Student phone
   - `{{student_college}}` - Student college
   - `{{student_branch}}` - Student branch
   - `{{student_year}}` - Student year
   - `{{student_gender}}` - Student gender
   - `{{registration_date}}` - Registration timestamp
   - `{{custom_fields}}` - Custom form responses
   - `{{payment_status}}` - Payment status
   - `{{payment_amount}}` - Payment amount
   - `{{organizer_contacts}}` - Organizer contact details

---

## 🛠️ Technical Details

### How It Works

1. Student submits registration form
2. Registration data is saved to Firestore
3. `sendRegistrationConfirmationEmail()` function is called
4. Email is sent using EmailJS API
5. Success/error is logged to console
6. Registration continues regardless of email status (email failure doesn't block registration)

### File Structure

```
src/
  services/
    emailService.js         # Email sending logic
  pages/
    EventDetails.jsx        # Calls email service after registration
```

### Key Functions

- `sendRegistrationConfirmationEmail(emailData)` - Sends the confirmation email
- `formatCustomFieldsForEmail(customFields)` - Formats custom fields for email display
- `formatContactsForEmail(contacts)` - Formats organizer contacts for email display

---

## 🔒 Security Notes

- ✅ Email service configuration is stored in `.env` file (not committed to Git)
- ✅ Only the public key is used in client-side code
- ✅ EmailJS handles email delivery securely
- ✅ No sensitive data is exposed in the code

---

## 📚 Additional Resources

- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [EmailJS Pricing](https://www.emailjs.com/pricing/)
- [EmailJS Email Templates Guide](https://www.emailjs.com/docs/user-guide/creating-email-template/)

---

## 🆘 Support

If you encounter any issues:

1. Check the [EmailJS Documentation](https://www.emailjs.com/docs/)
2. Review browser console logs
3. Check EmailJS dashboard history
4. Verify all environment variables are set correctly

---

**✨ Your students will now receive professional confirmation emails after registering for events!**
