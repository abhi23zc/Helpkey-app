# 🔧 Push Notification Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to send notification" Error

**Possible Causes:**
- Invalid push token format
- Network connectivity issues
- Expo Push API rate limiting
- Invalid EAS project ID

**Solutions:**
1. **Check Push Token Format:**
   ```
   Valid: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   Invalid: null, undefined, or different format
   ```

2. **Verify EAS Project ID:**
   - Check `app.json` has correct `extra.eas.projectId`
   - Should match your Expo project ID: `cbf44b03-6026-46ac-b160-5850ec46f1be`

3. **Test Network Connection:**
   - Ensure device has internet connection
   - Try on different network (WiFi vs mobile data)

### 2. Push Token Not Generated

**Possible Causes:**
- Running on simulator/emulator
- Notification permissions denied
- Device not supported

**Solutions:**
1. **Use Physical Device:**
   - Push notifications only work on physical devices
   - iOS Simulator and Android Emulator don't support push notifications

2. **Check Permissions:**
   ```typescript
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Permission status:', status);
   ```

3. **Request Permissions:**
   ```typescript
   const { status } = await Notifications.requestPermissionsAsync();
   ```

### 3. Notifications Not Appearing

**Possible Causes:**
- App is in foreground (notifications may not show)
- Notification channels not configured (Android)
- Do Not Disturb mode enabled

**Solutions:**
1. **Test with App in Background:**
   - Send notification while app is closed or backgrounded
   - Foreground notifications may not show banner

2. **Check Notification Settings:**
   - Device notification settings for your app
   - Do Not Disturb mode
   - Battery optimization settings

### 4. Firebase User Token Not Saved

**Possible Causes:**
- User not authenticated
- Firebase permissions
- Network issues

**Solutions:**
1. **Check User Authentication:**
   ```typescript
   const { user } = useAuth();
   console.log('User ID:', user?.uid);
   ```

2. **Verify Firebase Rules:**
   - Ensure users can update their own documents
   - Check Firestore security rules

## Debugging Steps

### Step 1: Check Basic Setup
```typescript
// In your component
const { expoPushToken, isNotificationPermissionGranted } = useNotifications();

console.log('🔍 Debug Info:');
console.log('Push Token:', expoPushToken);
console.log('Permission:', isNotificationPermissionGranted);
console.log('Device:', Device.isDevice);
console.log('Platform:', Platform.OS);
```

### Step 2: Test Local Notifications First
```typescript
// Test local notification (doesn't require network)
const { sendTestNotification } = useNotifications();
await sendTestNotification();
```

### Step 3: Check Console Logs
Look for these log messages:
- `🔔 Initializing push notifications...`
- `📱 Expo Push Token received:`
- `✅ Push notifications initialized successfully`
- `📤 Sending push notification:`
- `📥 Push API Response:`

### Step 4: Verify Firebase Integration
```typescript
// Check if user document has push token
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const checkUserToken = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  console.log('User push token:', userData?.expoPushToken);
};
```

## Testing Checklist

- [ ] Running on physical device (not simulator)
- [ ] Notification permissions granted
- [ ] Valid push token generated
- [ ] User authenticated in Firebase
- [ ] Internet connection available
- [ ] App not in Do Not Disturb mode
- [ ] Correct EAS project ID in app.json
- [ ] Firebase user document has expoPushToken field

## Error Messages and Solutions

### "Invalid push token format"
- **Cause:** Token doesn't start with "ExponentPushToken["
- **Solution:** Regenerate token by calling `initializeNotifications()`

### "User not found"
- **Cause:** Firebase user document doesn't exist
- **Solution:** Ensure user is properly created in Firebase

### "No push token found for user"
- **Cause:** User document missing expoPushToken field
- **Solution:** Call `initializeNotifications()` to save token

### "HTTP Error: 400"
- **Cause:** Invalid request to Expo Push API
- **Solution:** Check token format and message structure

### "Permission denied"
- **Cause:** User denied notification permissions
- **Solution:** Guide user to enable in device settings

## Advanced Debugging

### Enable Detailed Logging
Add this to your app for more detailed logs:
```typescript
// In your main app file
if (__DEV__) {
  console.log = (...args) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}]`, ...args);
  };
}
```

### Test Expo Push API Directly
```bash
curl -H "Content-Type: application/json" \
     -X POST \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "title": "Test",
       "body": "Direct API test"
     }' \
     https://exp.host/--/api/v2/push/send
```

### Monitor Firebase Logs
Check Firebase console for:
- User document updates
- Notification logs collection
- Security rule violations

## Performance Tips

1. **Cache Push Tokens:** Don't regenerate tokens unnecessarily
2. **Batch Notifications:** Use bulk sending for multiple users
3. **Rate Limiting:** Add delays between notifications
4. **Error Handling:** Implement retry logic for failed notifications
5. **Token Refresh:** Update tokens when they change

## Production Considerations

1. **Remove Debug Components:** Remove NotificationTestPanel in production
2. **Error Reporting:** Implement proper error tracking
3. **Analytics:** Track notification delivery rates
4. **Fallbacks:** Provide alternative communication methods
5. **User Preferences:** Allow users to control notification types

## Getting Help

If you're still having issues:

1. **Check Console Logs:** Look for detailed error messages
2. **Test on Different Devices:** Try iOS and Android
3. **Verify Expo Version:** Ensure compatible versions
4. **Check Expo Status:** Visit status.expo.dev for service issues
5. **Review Documentation:** Check latest Expo Notifications docs