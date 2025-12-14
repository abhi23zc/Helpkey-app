# 🏨 Hotel Admin Setup Guide
## Multi-Tenant Hotel Booking Platform

## 🎯 Overview

Your hotel booking platform supports **multiple hotel admins**, where each hotel has its own admin who receives notifications when customers book their specific hotel.

## 🔄 How It Works

### When a Customer Books a Hotel:
1. **Guest Notification**: ✅ Customer receives booking confirmation
2. **Hotel Admin Lookup**: System finds the specific admin for that hotel
3. **Admin Notification**: ✅ **Only that hotel's admin** receives the booking alert

## 📋 Hotel Admin Assignment

### Method 1: Hotel Document with Admin Field (Recommended)

Each hotel document should have a `hotelAdmin` field containing the **user ID** of the hotel admin:

```javascript
// Hotel document in 'hotels' collection
{
  id: "hotel_123",
  name: "Grand Horizon Hotel",
  location: "Keshavpuram",
  // ... other hotel fields
  hotelAdmin: "admin_user_id_123" // User ID from 'users' collection
}
```

### Method 2: Admin User in Users Collection

The admin user should exist in the `users` collection with a phone number:

```javascript
// Admin user document in 'users' collection
{
  uid: "admin_user_id_123",
  fullName: "Hotel Manager Name",
  email: "admin@grandhotel.com",
  phoneNumber: "919876543210", // Admin's WhatsApp number
  role: "hotel-admin", // or whatever role you use
  // ... other user fields
}
```

## 🎯 Complete Flow Example

### Hotel Setup:
```javascript
// Hotel: Grand Horizon Hotel
{
  id: "hotel_grand_horizon",
  name: "Grand Horizon Hotel",
  hotelAdmin: "user_admin_grand" // Links to admin user
}

// Admin User: Grand Hotel Manager  
{
  uid: "user_admin_grand",
  fullName: "Raj Kumar",
  phoneNumber: "919876543210",
  role: "hotel-admin"
}
```

### When Customer Books:
1. Customer books "Grand Horizon Hotel"
2. System looks up `hotel_grand_horizon` → finds `hotelAdmin: "user_admin_grand"`
3. System looks up user `user_admin_grand` → finds `phoneNumber: "919876543210"`
4. **Raj Kumar receives WhatsApp notification** about the new booking

## 🚀 Current System Behavior

### ✅ **If Hotel Has Specific Admin**:
- Notification goes to **that hotel's admin only**
- Perfect for multi-tenant platform

### ⚠️ **If Hotel Has No Admin Configured**:
- System falls back to your super-admin account (`919473634215`)
- You'll receive the notification as system admin
- Console will log warning about missing hotel admin

### ❌ **If No Admin Found At All**:
- Admin notification fails (guest notification still works)
- Error logged in console with helpful instructions

## 🔧 Setting Up Hotel Admins

### For Each Hotel Admin:

1. **Create Admin User** (if not exists):
   ```javascript
   // Add to 'users' collection
   {
     uid: "unique_admin_id",
     fullName: "Admin Name",
     email: "admin@hotel.com", 
     phoneNumber: "91XXXXXXXXXX", // With country code
     role: "hotel-admin"
   }
   ```

2. **Link Hotel to Admin**:
   ```javascript
   // Update hotel document
   {
     // ... existing hotel fields
     hotelAdmin: "unique_admin_id" // User ID from step 1
   }
   ```

## 📱 Phone Number Format

Ensure admin phone numbers are in correct format:
- ✅ `919876543210` (with country code 91)
- ✅ `917894561230` 
- ❌ `9876543210` (missing country code)
- ❌ `+91 9876543210` (spaces - will be auto-formatted)

## 🧪 Testing Hotel-Specific Notifications

### Using NotificationTester Component:

1. Open NotificationTester in your app
2. Enter a hotel admin's phone number
3. Test "Admin New Booking" notification type
4. Verify that specific admin receives the message

### Test Scenarios:

1. **Hotel with Admin**: Should notify specific admin
2. **Hotel without Admin**: Should notify system admin (you)
3. **Invalid Hotel ID**: Should fail gracefully

## 📊 Monitoring & Debugging

### Console Logs to Watch:
```
✅ Found hotel-specific admin phone via hotel lookup
👤 Admin details: { name: "Hotel Manager", email: "...", role: "hotel-admin" }
📱 Sending admin notification to hotel admin: 919876543210
```

### Warning Signs:
```
⚠️ Using system admin fallback: 0TgS3HwbSzMsyCOJQBf9sGB75it1
💡 Consider adding hotelAdmin field to hotel document
```

### Error Signs:
```
❌ Failed to resolve admin phone: Hotel hotel_123 has no hotelAdmin field
❌ Admin user not found with ID: invalid_admin_id
```

## 🎯 Best Practices

### 1. **One Admin Per Hotel** (Recommended)
```javascript
hotelAdmin: "single_admin_user_id"
```

### 2. **Multiple Admins Per Hotel** (Advanced)
```javascript
hotelAdmins: ["admin1_id", "admin2_id"] // Array of admin IDs
```
*Note: Current system supports single admin. For multiple admins, you'd need to modify the resolver.*

### 3. **Admin Role Management**
- Use consistent role names: `"hotel-admin"`, `"property-manager"`, etc.
- Validate admin permissions in your admin dashboard

### 4. **Phone Number Validation**
- Always include country code (91 for India)
- System auto-validates and formats phone numbers
- Invalid numbers are logged with helpful error messages

## 🔄 Migration Strategy

### If You Have Existing Hotels Without Admins:

1. **Identify Hotel Owners**: List all hotels and their current owners/managers
2. **Create Admin Users**: Add admin users to `users` collection
3. **Link Hotels**: Add `hotelAdmin` field to each hotel document
4. **Test**: Verify notifications work for each hotel

### Batch Update Script Example:
```javascript
// Update multiple hotels at once
const hotelAdminMappings = [
  { hotelId: "hotel_1", adminId: "admin_1" },
  { hotelId: "hotel_2", adminId: "admin_2" },
  // ... more mappings
];

// Use Firebase Admin SDK to batch update
```

## ✅ Verification Checklist

For each hotel in your system:

- [ ] Hotel document has `hotelAdmin` field with valid user ID
- [ ] Admin user exists in `users` collection
- [ ] Admin user has valid `phoneNumber` field
- [ ] Phone number is in correct format (91XXXXXXXXXX)
- [ ] Test booking creates notification to correct admin
- [ ] Admin receives WhatsApp message with booking details

## 🎉 Result

Once properly configured:
- **Customer books Hotel A** → **Admin A gets notification**
- **Customer books Hotel B** → **Admin B gets notification**  
- **Customer books Hotel C** → **Admin C gets notification**

Each hotel admin only receives notifications for their own hotel bookings! 🎯