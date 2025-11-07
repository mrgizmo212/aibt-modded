# Interactive Strategy Coach Panel

## Overview
Create a comprehensive floating coach panel that guides users through the entire strategy building process, providing real-time instructions, validation, tips, and progress tracking.

## Visual Design

```
┌──────────────────────────────────────────┐
│ 🤖 Strategy Coach                   [─]  │
├──────────────────────────────────────────┤
│                                          │
│ 📊 Progress: 50% Complete                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                          │
│ ✅ COMPLETED                             │
│ • Entry condition defined                │
│ • Exit condition defined                 │
│                                          │
│ ⚠️  REQUIRED (Missing)                   │
│ • None - you're good to go!              │
│                                          │
│ 💡 RECOMMENDED                           │
│ • Add position sizing rules              │
│ • Add risk management limits             │
│                                          │
│ 📚 WHAT YOU CAN DO:                      │
│ • Drag components from sidebar           │
│ • Click any component to edit            │
│ • Connect components with arrows         │
│ • Delete by selecting + pressing Del     │
│                                          │
│ 💭 TIPS:                                 │
│ "Entry + Exit = Minimum viable strategy" │
│ "Add risk management to protect capital" │
│                                          │
│ [Generate Strategy] ← Enabled/Disabled   │
└──────────────────────────────────────────┘
```

## Components Needed

### 1. StrategyCoach Component
**File:** `frontend-v2/components/strategy-coach.tsx`

**Props:**
```typescript
interface StrategyCoachProps {
  nodes: Node[]
  edges: Edge[]
  onGenerateStrategy: () => void
  canGenerate: boolean
  isMinimized: boolean
  onToggleMinimize: () => void
}
```

**State:**
```typescript
- completionStatus: { entry: boolean, exit: boolean, position: boolean, risk: boolean }
- progressPercentage: number
- missingRequired: string[]
- recommendations: string[]
- currentTip: string
```

### 2. Validation Logic

**Required Components:**
- Entry condition (at least 1)
- Exit condition (at least 1)

**Recommended Components:**
- Position sizing (1+)
- Risk management (1+)

**Progress Calculation:**
```typescript
const calculateProgress = (nodes: Node[]) => {
  const has = {
    entry: nodes.some(n => n.type === 'entry'),
    exit: nodes.some(n => n.type === 'exit'),
    position: nodes.some(n => n.type === 'positionSizing'),
    risk: nodes.some(n => n.type === 'riskManagement'),
  }
  
  const required = [has.entry, has.exit].filter(Boolean).length
  const recommended = [has.position, has.risk].filter(Boolean).length
  
  // Required = 75% of progress, Recommended = 25%
  const progress = (required / 2) * 75 + (recommended / 2) * 25
  
  return {
    percentage: Math.round(progress),
    canGenerate: required === 2,
    missing: {
      entry: !has.entry,
      exit: !has.exit,
    },
    recommended: {
      position: !has.position,
      risk: !has.risk,
    }
  }
}
```

### 3. Dynamic Tips System

**Tips Based on State:**
```typescript
const tips = {
  empty: "Start by dragging an Entry Condition to define when to buy",
  hasEntry: "Great! Now add an Exit Condition to define when to sell",
  hasExit: "Excellent! Your basic strategy is complete. Consider adding position sizing",
  hasPosition: "Looking good! Add risk management to protect your capital",
  complete: "Perfect! Your strategy is complete. Click Generate when ready"
}
```

**Rotate tips every 10 seconds** to show different helpful information.

### 4. Instructions Section

**What You Can Do:**
- Drag components from the left sidebar
- Click any component to edit its values
- Connect components with arrows (optional for visual flow)
- Delete components by selecting and pressing Delete key
- Zoom in/out with mouse wheel
- Pan canvas by dragging background

**What You Should Do:**
1. Add at least one Entry Condition (when to buy/enter)
2. Add at least one Exit Condition (when to sell/close)
3. (Recommended) Add Position Sizing to control trade sizes
4. (Recommended) Add Risk Management to limit losses

### 5. Coach Panel Sections

**Section 1: Progress Bar**
- Visual progress bar (0-100%)
- Percentage text
- Color: Red < 50%, Yellow 50-75%, Green > 75%

**Section 2: Completed Items**
- ✅ Entry condition defined
- ✅ Exit condition defined
- ✅ Position sizing configured
- ✅ Risk limits set

**Section 3: Required (Missing)**
- ⚠️ Add exit condition
- ⚠️ Add entry condition
- (Empty if all required items completed)

**Section 4: Recommended**
- 💡 Add position sizing rules
- 💡 Add risk management limits
- 💡 Add multiple entry conditions for different scenarios

**Section 5: Instructions**
- Collapsed by default
- Click to expand
- Shows full "What You Can Do" list

**Section 6: Current Tip**
- Rotating helpful tips
- Context-aware based on current state

**Section 7: Generate Button**
- Disabled if missing required components
- Shows error message when disabled
- Enabled and highlighted when ready

### 6. Visual Styling

**Colors:**
- Background: `bg-[#0a0a0a]`
- Border: `border-[#262626]`
- Text primary: `text-white`
- Text secondary: `text-[#a3a3a3]`
- Text muted: `text-[#737373]`
- Success: `text-[#10b981]`
- Warning: `text-[#f59e0b]`
- Error: `text-[#ef4444]`
- Info: `text-[#3b82f6]`

**Progress Bar Colors:**
- 0-49%: `bg-[#ef4444]` (red)
- 50-74%: `bg-[#f59e0b]` (yellow/orange)
- 75-100%: `bg-[#10b981]` (green)

### 7. Position

**Desktop:**
- Fixed position bottom-left
- Above the node palette
- Width: 320px
- Max height: 500px with scroll

**Mobile:**
- Collapsible/minimizable
- Shows as floating button when minimized
- Expands to overlay when opened

### 8. Animation

- Slide in from left on mount
- Smooth transitions for progress updates
- Pulse animation on warnings
- Glow effect when ready to generate

### 9. Integration

**Update strategy-builder.tsx:**
```typescript
const [coachMinimized, setCoachMinimized] = useState(false)

// Calculate validation status
const validationStatus = useMemo(() => 
  calculateProgress(nodes),
  [nodes]
)

// Add coach panel
<StrategyCoach
  nodes={nodes}
  edges={edges}
  onGenerateStrategy={generateStrategy}
  canGenerate={validationStatus.canGenerate}
  isMinimized={coachMinimized}
  onToggleMinimize={() => setCoachMinimized(!coachMinimized)}
/>
```

**Update Generate Button:**
```typescript
<Button
  onClick={generateStrategy}
  disabled={!validationStatus.canGenerate}
  className={...}
>
  {validationStatus.canGenerate 
    ? "Generate Strategy" 
    : "Complete Required Fields"}
</Button>
```

### 10. Example States

**State 1: Empty Canvas (0%)**
```
Progress: 0%
Required: 
  ⚠️ Add entry condition
  ⚠️ Add exit condition
Tip: "Start by adding when you want to enter trades"
Button: Disabled
```

**State 2: Only Entry (25%)**
```
Progress: 25%
Completed:
  ✅ Entry condition
Required:
  ⚠️ Add exit condition
Tip: "Great start! Now define when to exit positions"
Button: Disabled
```

**State 3: Entry + Exit (50%)**
```
Progress: 50%
Completed:
  ✅ Entry condition
  ✅ Exit condition
Recommended:
  💡 Add position sizing
  💡 Add risk management
Tip: "Your strategy is functional! Add risk management for safety"
Button: Enabled ✅
```

**State 4: Complete (100%)**
```
Progress: 100%
Completed:
  ✅ Entry condition
  ✅ Exit condition
  ✅ Position sizing
  ✅ Risk management
Tip: "Perfect! Your strategy is complete and ready to use"
Button: Enabled ✅ (Highlighted)
```

## Testing Checklist

- [ ] Coach panel appears when strategy builder opens
- [ ] Progress updates as nodes are added/removed
- [ ] Required items show as warnings
- [ ] Completed items show with checkmarks
- [ ] Generate button disabled when incomplete
- [ ] Generate button enabled when requirements met
- [ ] Tips rotate every 10 seconds
- [ ] Minimize/expand works correctly
- [ ] Mobile responsive
- [ ] Styled consistently with app theme

## Benefits

- ✅ Users never create incomplete strategies
- ✅ Clear guidance on what to add next
- ✅ Real-time feedback and validation
- ✅ Educational (explains what each component does)
- ✅ Prevents confusion and errors
- ✅ Increases successful strategy completions

