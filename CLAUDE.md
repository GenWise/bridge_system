# Project-Level Configuration for Uma + PS Bridge System

## Critical Instructions

### ABSOLUTE REQUIREMENTS
1. **NEVER make up content** - Use ONLY what's in the PDF documents
2. **Use EXACT text** - "Puppetted bid" not "Forced", preserve every word exactly
3. **Preserve exact colors**:
   - Walsh, Reverse Flannery, Artificial reverse, Natural reverse → GREEN text (#059669)
   - "Opener Rebids" → RED text (#dc2626)
   - Opener cells → GREEN background (#d1fae5)
   - Responder cells → BLUE background (#dbeafe)
   - Description cells → WHITE background
4. **Maintain thin TOC layout** - 200px left column, NOT 2x2 grid

### CRITICAL DISCOVERY - Table Structure
**WRONG APPROACH**: Hierarchical nested tables with indentation
**CORRECT APPROACH**: Multi-column auction tables where bids shift right:
```
[Empty] | 2♣ (green bg) | "Puppet to 2♦" (white bg)
[Empty] | 2♦ (blue bg) | "Puppetted bid" (white bg)
[Empty] | [Empty] | Pass (green bg) | "to play" (white bg)
```

Pages 4-12 ALL use this column-shifting auction structure, NOT nested hierarchy.

### Source Documents
- Primary content: `/Users/rajeshpanchanathan/Downloads/1 Club Opening for html.pdf`
- Layout design: `/Users/rajeshpanchanathan/Downloads/design for html.pdf`

### Project Structure
```
bridge_system/
├── index.html          # Main application
├── app.js             # Interactive functionality
├── styles.css         # Styling with table colors
├── data.json          # Bridge content structure
├── server.py          # Local dev server
├── launch.sh          # Quick launch script
├── HANDOVER.md        # Thread handover document
└── CLAUDE.md          # This file
```

### Development Guidelines
- Test all changes with exact PDF comparison
- Use subagents for complex multi-step tasks
- Preserve all table structure with proper indentation
- Keep definitions exactly as written (e.g., "Something" not elaborated)

### Validation Framework - ACTIVE HOOKS
**Dual Hook System Implemented**:

#### User-Level Hook (Smart Detection)
- **Location**: `~/.claude/hooks/validate-bridge-content.py`
- **Trigger**: Edit/Write operations on bridge-related paths
- **Validates**: Color usage, content accuracy, cell backgrounds

#### Project-Level Hook (Always Active)
- **Location**: `./.claude/hooks/bridge-validation.py`
- **Trigger**: All Edit/Write/MultiEdit operations in this directory
- **Enhanced Validation**: Stricter PDF accuracy, layout requirements, bridge notation

**Active Validations**:
- GREEN (#059669): Walsh, Reverse Flannery, Artificial reverse, Natural reverse
- RED (#dc2626): "Opener Rebids" links
- GREEN background (#d1fae5): Opener cells
- BLUE background (#dbeafe): Responder cells
- Content accuracy: Blocks made-up content patterns
- Layout: 200px TOC column requirement

### User Expectations
- Exact document fidelity over interpretative improvements
- Visual accuracy with proper cell backgrounds
- Functional interactive links with correct colors
- No unnecessary additions or elaborations
- Direct action over asking permission
- **First Time Right (FTR) mindset**: Thorough analysis before implementation
- **Verification before claiming completion**: Use subagents to validate changes
- **No assumptions about content**: Always check PDF for exact text

### Session Learnings (Sep 30, 2025)

#### Header Consolidation Implementation
- **Requirement**: Split titles at colon (":"), show first part as breadcrumb, second part as subtitle in header tile
- **Implementation**: `app.js:239-268` (displaySection), `app.js:702-748` (showLevelB)
- **Key fix**: Remove duplicate subtitle/overview from content body (`app.js:333-337`, `app.js:804-805`)
- **CSS**: `.title-main` and `.title-subtitle` classes at `styles.css:163-174`

#### Bid Color Corrections
- **Issue**: Conflicting CSS rules at lines 723-755 vs 874-889
- **Resolution**: Earlier rules must match correct colors (Opener=GREEN #d1fae5, Responder=BLUE #dbeafe)
- **Lesson**: Check all instances of color definitions, not just first occurrence

#### Content Accuracy Enforcement
- **"Forced" → "Puppetted bid"**: 6 instances corrected in data.json via Edit replace_all
- **Color annotations removed**: 19 instances via sed command
- **Validation**: Subagent verification confirmed all changes before claiming completion

#### Development Workflow Clarifications
- **No hot-reload**: Server requires restart (kill + python3 server.py) for changes to load
- **Browser cache**: Hard refresh (Cmd+Shift+R) required after server restart
- **Default port**: 9999 (changed from 8000 in server.py)