# Comprehensive Visual Builder Enhancement

## 🔴 CRITICAL: BREAK NOTHING!

**Rules:**
- ✅ Only ADD new features, never modify existing working code
- ✅ Keep existing node types unchanged
- ✅ Preserve all current functionality
- ✅ Follow EXACT patterns from recent bug fixes
- ✅ Test incrementally
- ✅ Each change must be non-breaking

## Objective

Transform visual builder from "rules only" to complete model creation tool that matches ALL functionality in the form, but as interactive nodes.

## Current State (What Works - DON'T TOUCH)

**Existing Node Types (KEEP AS-IS):**
- ✅ Entry condition nodes (working)
- ✅ Exit condition nodes (working)
- ✅ Position sizing nodes (working)
- ✅ Risk management nodes (working)
- ✅ Text input nodes (working)
- ✅ Select nodes (working)
- ✅ Number input nodes (working)

**Existing Generation Logic (KEEP AS-IS):**
- ✅ `generateStrategy()` function
- ✅ Node collection and parsing
- ✅ Custom rules building
- ✅ `onComplete` callback

## What to ADD (New Features Only)

### Phase 1: Add Setup Nodes (Top Priority)

**New Node Types to Create:**

#### 1. Model Name Node
```typescript
type: 'modelName'
data: {
  label: 'Model Name',
  value: string,  // e.g., "Momentum Trader Pro"
  placeholder: 'e.g., GPT-4 Momentum Trader'
}
```

#### 2. AI Model Selector Node
```typescript
type: 'aiModel'
data: {
  label: 'AI Model',
  value: string,  // e.g., "gpt-4o"
  options: ['gpt-4o', 'claude-3-5-sonnet', 'gpt-o1-mini', ...]
}
```

#### 3. Trading Style Node
```typescript
type: 'tradingStyle'
data: {
  label: 'Trading Style',
  value: string,  // 'scalping' | 'day-trading' | 'swing-trading' | 'investing'
  options: [...]
}
```

#### 4. Initial Cash Node
```typescript
type: 'initialCash'
data: {
  label: 'Initial Cash',
  value: number,  // e.g., 10000
  min: 1000,
  max: 1000000
}
```

### Phase 2: Add Trading Configuration Nodes

#### 5. Trading Actions Node
```typescript
type: 'tradingActions'
data: {
  label: 'Trading Actions',
  shortSelling: boolean,
  multiLegOptions: boolean,
  hedging: boolean
}
```

#### 6. Order Types Node
```typescript
type: 'orderTypes'
data: {
  label: 'Order Types',
  market: boolean,
  limit: boolean,
  stop: boolean,
  stopLimit: boolean,
  trailingStop: boolean,
  bracket: boolean
}
```

#### 7. Custom Instructions Node
```typescript
type: 'customInstructions'
data: {
  label: 'Custom Instructions',
  value: string,  // Multiline text
  placeholder: 'Focus on value investing...'
}
```

### Phase 3: Strategy Coach Panel

**File:** `frontend-v2/components/strategy-coach.tsx`

**Features:**
- Real-time progress tracking (0-100%)
- Required vs recommended components
- Dynamic tips based on current state
- Validation before generation
- Instructions on what to do
- Minimizable to save space

**Progress Calculation:**
```typescript
Required (must have for generation):
- Model name ✅
- AI model ✅
- Trading style ✅
- Entry condition ✅
- Exit condition ✅

Recommended (should have):
- Initial cash
- Position sizing
- Risk management
- Order types
- Trading actions

Progress = (required completed / 5) * 70 + (recommended completed / 5) * 30
```

**Coach Panel Sections:**
1. Progress bar (visual + percentage)
2. Completed items (✅ checkmarks)
3. Required missing (⚠️ warnings)
4. Recommended items (💡 suggestions)
5. Current tip (rotating every 10s)
6. Instructions (collapsible)
7. Generate button with validation

## Implementation Strategy

### Step 1: Create Node Components (Additive Only)

**File:** `frontend-v2/components/strategy-builder.tsx`

**ADD after existing node components (lines 243-252):**

```typescript
// NEW Setup Nodes
function ModelNameNode({ data, id }: { data: any; id: string }) {
  const [value, setValue] = useState(data.value || '')
  
  useEffect(() => {
    data.onChange?.(id, value)
  }, [value, id])
  
  return (
    <div className="bg-[#1a1a1a] border-2 border-[#3b82f6] rounded-lg p-4 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📝</span>
        <span className="text-sm font-medium text-white">Model Name</span>
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., GPT-4 Momentum Trader"
        className="bg-[#0a0a0a] border-[#262626] text-white text-sm"
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// Similar for AI Model, Trading Style, Initial Cash...
```

**UPDATE nodeTypes object (ADD to existing, don't replace):**

```typescript
const nodeTypes = {
  // Existing types (DON'T TOUCH)
  entry: EntryConditionNode,
  exit: ExitConditionNode,
  positionSizing: PositionSizingNode,
  riskManagement: RiskManagementNode,
  textInput: TextInputNode,
  select: SelectNode,
  numberInput: NumberInputNode,
  
  // NEW types (ADD these)
  modelName: ModelNameNode,
  aiModel: AIModelNode,
  tradingStyle: TradingStyleNode,
  initialCash: InitialCashNode,
  tradingActions: TradingActionsNode,
  orderTypes: OrderTypesNode,
  customInstructions: CustomInstructionsNode,
}
```

### Step 2: Update Categories (Additive Only)

**ADD new category to existing categories object:**

```typescript
const categories = {
  // Existing categories (DON'T TOUCH)
  entry: [...existing entry nodes...],
  exit: [...existing exit nodes...],
  position: [...existing position nodes...],
  risk: [...existing risk nodes...],
  
  // NEW category (ADD this)
  setup: [
    { type: 'modelName', label: 'Model Name', icon: '📝' },
    { type: 'aiModel', label: 'AI Model', icon: '🤖' },
    { type: 'tradingStyle', label: 'Trading Style', icon: '⚡' },
    { type: 'initialCash', label: 'Initial Cash', icon: '💰' },
    { type: 'tradingActions', label: 'Trading Actions', icon: '📊' },
    { type: 'orderTypes', label: 'Order Types', icon: '📈' },
    { type: 'customInstructions', label: 'Custom Instructions', icon: '💭' },
  ],
}
```

### Step 3: Update Generate Logic (Safe Extension)

**EXTEND generateStrategy() function WITHOUT breaking existing logic:**

```typescript
const generateStrategy = () => {
  console.log('[Builder] Generating strategy from nodes:', nodes.length)
  
  // Existing logic for entry/exit/position/risk (KEEP AS-IS)
  const entryNodes = nodes.filter(n => n.type === 'entry')
  const exitNodes = nodes.filter(n => n.type === 'exit')
  const positionNodes = nodes.filter(n => n.type === 'positionSizing')
  const riskNodes = nodes.filter(n => n.type === 'riskManagement')
  
  // NEW: Extract setup nodes (ADDITIVE)
  const nameNode = nodes.find(n => n.type === 'modelName')
  const aiModelNode = nodes.find(n => n.type === 'aiModel')
  const styleNode = nodes.find(n => n.type === 'tradingStyle')
  const cashNode = nodes.find(n => n.type === 'initialCash')
  const actionsNode = nodes.find(n => n.type === 'tradingActions')
  const orderTypesNode = nodes.find(n => n.type === 'orderTypes')
  const instructionsNode = nodes.find(n => n.type === 'customInstructions')
  
  // Build config object (EXTEND existing logic)
  const config = {
    // NEW setup fields
    name: nameNode?.data.value,
    default_ai_model: aiModelNode?.data.value,
    trading_style: styleNode?.data.value,
    initial_cash: cashNode?.data.value,
    
    // NEW trading configuration
    allow_short_selling: actionsNode?.data.shortSelling,
    allow_multi_leg_options: actionsNode?.data.multiLegOptions,
    allow_hedging: actionsNode?.data.hedging,
    
    // NEW order types
    allowed_order_types: orderTypesNode?.data.selectedTypes || [],
    
    // Existing custom_rules (KEEP AS-IS)
    custom_rules: customRules.trim(),
    
    // EXTEND custom_instructions with node data
    custom_instructions: instructionsNode?.data.value || 
                        'Strategy designed with visual builder. Follow all rules above without exception.',
  }
  
  // Existing onComplete call (KEEP AS-IS)
  onComplete(config)
}
```

### Step 4: Create Strategy Coach Component

**File:** `frontend-v2/components/strategy-coach.tsx` (NEW FILE)

**Progress Tracking:**
```typescript
const calculateProgress = (nodes: Node[]) => {
  const has = {
    // Required
    name: nodes.some(n => n.type === 'modelName' && n.data.value),
    aiModel: nodes.some(n => n.type === 'aiModel' && n.data.value),
    style: nodes.some(n => n.type === 'tradingStyle' && n.data.value),
    entry: nodes.some(n => n.type === 'entry'),
    exit: nodes.some(n => n.type === 'exit'),
    
    // Recommended
    cash: nodes.some(n => n.type === 'initialCash' && n.data.value),
    position: nodes.some(n => n.type === 'positionSizing'),
    risk: nodes.some(n => n.type === 'riskManagement'),
    orderTypes: nodes.some(n => n.type === 'orderTypes'),
    actions: nodes.some(n => n.type === 'tradingActions'),
  }
  
  const requiredCount = [has.name, has.aiModel, has.style, has.entry, has.exit].filter(Boolean).length
  const recommendedCount = [has.cash, has.position, has.risk, has.orderTypes, has.actions].filter(Boolean).length
  
  return {
    percentage: (requiredCount / 5) * 70 + (recommendedCount / 5) * 30,
    canGenerate: requiredCount === 5,
    missing: {
      name: !has.name,
      aiModel: !has.aiModel,
      style: !has.style,
      entry: !has.entry,
      exit: !has.exit,
    },
    recommended: {
      cash: !has.cash,
      position: !has.position,
      risk: !has.risk,
      orderTypes: !has.orderTypes,
      actions: !has.actions,
    }
  }
}
```

### Step 5: Integration (Safe, Non-Breaking)

**File:** `frontend-v2/components/strategy-builder.tsx`

**ADD state for coach (doesn't affect existing state):**
```typescript
const [coachMinimized, setCoachMinimized] = useState(false)
```

**ADD coach panel to render (additive only):**
```typescript
{/* Existing ReactFlow component - DON'T TOUCH */}
<ReactFlow ... />

{/* NEW: Strategy Coach Panel - additive only */}
<StrategyCoach
  nodes={nodes}
  onGenerateStrategy={generateStrategy}
  canGenerate={validationStatus.canGenerate}
  isMinimized={coachMinimized}
  onToggleMinimize={() => setCoachMinimized(!coachMinimized)}
/>
```

**UPDATE Generate button validation (safe enhancement):**
```typescript
// OLD (keep this logic)
disabled={nodes.length === 0}

// NEW (safer validation)
disabled={!validationStatus.canGenerate}

// validationStatus checks for required nodes, not just any nodes
```

## Testing Strategy (Non-Breaking)

1. Test existing nodes still work
2. Test generation with OLD strategy (entry/exit only) still works
3. Test generation with NEW complete strategy works
4. Test coach panel doesn't interfere with builder
5. Test form creation still works as fallback
6. Verify no new API call duplicates

## Rollback Plan

If anything breaks:
- Remove new node types from nodeTypes object
- Remove coach panel component
- Revert Generate button validation
- Everything returns to current working state

**Ready to create the full detailed implementation plan?**
