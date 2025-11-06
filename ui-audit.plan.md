# Complete UI/UX Audit - Find All Non-Functional Elements

## Objective
Systematically test EVERY button, link, action, and interactive element in the frontend to identify and remove/fix non-functional UI elements.

---

## Testing Methodology

### Browser Testing with Screenshots
- Navigate to each page
- Click every button
- Test every link
- Try every action
- Document what works vs what doesn't

### Areas to Audit

1. **Navigation & Sidebar**
   - Dashboard button
   - New Chat button
   - Model selection
   - Conversation selection
   - Create Model button
   - Admin button
   - Settings button
   - Logout button

2. **Chat Interface**
   - Welcome message (already cleaned)
   - Suggested action buttons
   - Message input
   - Send button
   - Stop streaming button

3. **Context Panel**
   - Model Info display
   - Live Updates section
   - Positions section
   - All Runs section
   - Run cards (clickable?)
   - Delete run buttons
   - AI Decision Logs section
   - Edit Model button
   - Stop All Runs button

4. **Model Dialogs**
   - Model Edit Dialog
   - Trading Form (Start Trading button)
   - Create Model wizard

5. **Admin Panel**
   - Global settings
   - Save button
   - Model parameters

---

## Testing Checklist

### Dashboard/Home (`/new`)
- [ ] New Chat button → Creates new conversation?
- [ ] Model list displays
- [ ] Clicking model → Navigates to model page?
- [ ] Create Model button → Opens dialog?
- [ ] Admin button → Opens admin page?
- [ ] Settings button → Opens settings?
- [ ] Logout button → Logs out?

### Model Conversation (`/m/184/c/90`)
- [ ] Chat input works
- [ ] Send button works
- [ ] AI responds (verified working)
- [ ] Tool usage displays
- [ ] Model Info displays
- [ ] Runs list displays
- [ ] Click run → Embeds in chat?
- [ ] Delete run button → Deletes?
- [ ] Edit Model button → Opens dialog?
- [ ] Start Trading toggle → Opens trading form?
- [ ] Stop All Runs → Stops?

### Admin Page (`/admin`)
- [ ] Page loads
- [ ] Settings display
- [ ] Can edit settings
- [ ] Save button → Saves?
- [ ] Changes persist

---

## Expected Findings

### Known Non-Functional (To Remove):
- Suggested action buttons (already removed)
- Pattern matching responses (disabled)

### Potentially Non-Functional (To Test):
- Settings page (button exists but page might not)
- Some embedded components (stats_grid, model_cards, etc.)
- Trading form dialog
- Model creation wizard (multi-step)
- Delete operations
- Edit operations

---

## Implementation

After audit, create tasks:
1. Remove non-functional buttons
2. Fix broken functionality
3. Update documentation
4. Clean up unused components

---

**This will ensure clean, working UI with no dead buttons!**

