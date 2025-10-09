# Settings Page Test Guide

## 🧪 How to Test Settings Page

### 1. Start the Admin Panel
```bash
cd admin-panel
npm run dev
```
Access: http://localhost:3001

### 2. Login
- Email: `admin@taliyo.com`
- Password: `admin123`

### 3. Navigate to Settings
- Click "Settings" in the sidebar OR
- Click user avatar → "Settings" in header dropdown

### 4. Test Each Tab

#### Profile Tab ✅
1. Update "Full Name" → Click "Save Changes"
2. Update "Phone Number" → Click "Save Changes"  
3. Update "Bio" → Click "Save Changes"
4. Refresh page → Verify data persists

#### Notifications Tab ✅
1. Toggle "Email Notifications" → Click "Save Changes"
2. Toggle "New Bookings" → Click "Save Changes"
3. Toggle other options → Click "Save Changes"
4. Refresh page → Verify settings persist

#### Security Tab ✅
1. Verify "2FA Disabled" notice is shown
2. Verify "Change Password" is disabled
3. Click "Clear Session" → Should logout and redirect to login
4. Login again → Verify you can access settings

#### System Tab ✅
1. Toggle "Maintenance Mode" → Click "Save Changes"
2. Change "Max File Size" → Click "Save Changes"
3. Update "Support Email" → Click "Save Changes"
4. Refresh page → Verify settings persist

### 5. Test Data Persistence

#### Check localStorage:
Open browser DevTools → Application → Local Storage → localhost:3001

Should see:
- `adminProfile` - Profile data
- `adminNotifications` - Notification settings
- `adminSystemSettings` - System configuration
- `adminAuth` - Authentication session

### 6. Test Responsive Design
- Resize browser window
- Test on mobile viewport
- Verify sidebar collapses properly
- Check all tabs work on small screens

## ✅ Expected Results

### Profile Updates
- Name changes immediately
- Phone updates correctly
- Bio saves properly
- Email remains read-only

### Notifications
- All toggles work smoothly
- Settings save instantly
- Success message appears
- Data persists after refresh

### Security
- 2FA shows as disabled
- Password change is disabled
- Session clear works
- Security notices display

### System Settings
- Toggles work properly
- File size accepts 1-100 MB
- Email validation works
- All settings persist

## 🚨 Troubleshooting

### If Settings Don't Save:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Clear localStorage and try again

### If Page Doesn't Load:
1. Check if all dependencies installed: `npm install`
2. Verify port 3001 is available
3. Check for syntax errors in console

### If Authentication Fails:
1. Clear localStorage completely
2. Use exact credentials: `admin@taliyo.com` / `admin123`
3. Check simpleAuth.js is working

## 🎯 Success Criteria

✅ All 4 tabs load without errors
✅ Profile data saves and persists
✅ Notification toggles work
✅ 2FA shows as disabled
✅ System settings save properly
✅ Responsive design works
✅ No console errors
✅ Data persists after refresh
✅ Session management works

The settings page is **fully functional** with 2FA disabled as requested!