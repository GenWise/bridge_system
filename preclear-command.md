# /preclear Command Implementation

## Command: /preclear

### Purpose
Prepare for thread handover by documenting critical context, requirements, and state.

### Actions Performed

1. **Create/Update HANDOVER.md**
   - Current project state
   - Critical requirements from user
   - Working features list
   - Pending tasks
   - User preferences learned
   - Brief handover prompt

2. **Update CLAUDE.md** (Project-level)
   - Absolute requirements (e.g., no made-up content)
   - Source document locations
   - Development guidelines
   - User expectations

3. **Update README.md** (if needed)
   - Current implementation status
   - Known issues or limitations

4. **Consider Hooks/Subagents**
   - Validation hook: Check content against PDF
   - Color verification hook: Ensure green/red/blue text correct
   - Table structure hook: Verify cell backgrounds

5. **Generate Handover Prompt**

### Usage
Type `/preclear` before ending session to preserve context.

### Handover Prompt Template
```
Continue working on [PROJECT]. [CURRENT STATE]. See HANDOVER.md for critical requirements.
Next priorities: [TASKS]. Source docs: [LOCATIONS]. User insists on [KEY REQUIREMENTS].
```

### Suggested Hooks for .claude_config.yml
```yaml
hooks:
  pre-edit:
    - name: "PDF Content Validator"
      description: "Verify edits match PDF content exactly"
      command: "grep -r 'Something' *.md || echo 'Keep placeholder text'"

  pre-commit:
    - name: "Color Checker"
      description: "Ensure Walsh=green, Opener Rebids=red"
      command: "grep -E '(Walsh|green-text)|(Opener Rebids|red-text)' app.js"
```

### Suggested Subagent Prompts

**Content Extraction Agent**:
"Extract bridge content from PDF at /Users/rajeshpanchanathan/Downloads/1 Club Opening for html.pdf.
Preserve EXACT text including placeholders like 'Something'. Create structured JSON with bid, description,
and link metadata. Mark opener bids vs responder bids for cell coloring."

**Table Generator Agent**:
"Generate HTML tables for bridge bidding sequences. Use blue background (#dbeafe) for opener cells,
green (#d1fae5) for responder cells. Preserve exact indentation structure from PDF."

### Critical Reminders
- ❌ Do NOT elaborate on "Something" or "something"
- ❌ Do NOT add content not in PDFs
- ✅ DO preserve exact colors: Walsh=green, Opener Rebids=red
- ✅ DO maintain table structure with blue/green cells
- ✅ DO keep thin TOC column (200px)

### Files to Preserve Between Sessions
- HANDOVER.md - Thread context
- CLAUDE.md - Project requirements
- data.json - Bridge content structure
- All *.html, *.css, *.js files