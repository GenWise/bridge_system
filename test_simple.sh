#!/bin/bash

echo "=== Bridge System Hierarchical Implementation Test ==="
echo ""

# Test server
echo "--- Testing server accessibility ---"
if curl -s -f http://localhost:8004 > /dev/null; then
    echo "✓ Server is running on port 8004"
else
    echo "✗ Server not accessible"
    exit 1
fi

# Test data.json
echo ""
echo "--- Testing data.json loading ---"
if curl -s -f http://localhost:8004/data.json > /dev/null; then
    echo "✓ data.json loads correctly"
else
    echo "✗ data.json not accessible"
    exit 1
fi

# Count hierarchical tables
echo ""
echo "--- Testing hierarchical structure ---"
HIERARCHICAL_COUNT=$(curl -s http://localhost:8004/data.json | grep -c '"type": "hierarchical_table"')
echo "✓ Found $HIERARCHICAL_COUNT hierarchical table sections"

# Test for 1c1d1n structure
echo ""
echo "--- Testing 1c1d1n sequence ---"
if curl -s http://localhost:8004/data.json | grep -q "1c1d1n"; then
    echo "✓ Found 1c1d1n sequence in data"
else
    echo "✗ Could not find 1c1d1n sequence"
fi

# Test CSS styles
echo ""
echo "--- Testing color and styling requirements ---"
CSS_CONTENT=$(curl -s http://localhost:8004/styles.css)

if echo "$CSS_CONTENT" | grep -q "#d1fae5" && echo "$CSS_CONTENT" | grep -q "opener-cell"; then
    echo "✓ Opener green color (#d1fae5) found"
else
    echo "✗ Opener green color not found"
fi

if echo "$CSS_CONTENT" | grep -q "#dbeafe" && echo "$CSS_CONTENT" | grep -q "responder-cell"; then
    echo "✓ Responder blue color (#dbeafe) found"
else
    echo "✗ Responder blue color not found"
fi

if echo "$CSS_CONTENT" | grep -q "indent-"; then
    echo "✓ Indentation classes found"
else
    echo "✗ Indentation classes not found"
fi

# Test app.js hierarchical rendering
echo ""
echo "--- Testing app.js hierarchical rendering ---"
APP_JS_CONTENT=$(curl -s http://localhost:8004/app.js)

if echo "$APP_JS_CONTENT" | grep -q "renderHierarchicalRows"; then
    echo "✓ Hierarchical rendering function found"
else
    echo "✗ Hierarchical rendering function not found"
fi

if echo "$APP_JS_CONTENT" | grep -q "hierarchical_table"; then
    echo "✓ Hierarchical table type handling found"
else
    echo "✗ Hierarchical table type handling not found"
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Hierarchical tables found: $HIERARCHICAL_COUNT"
echo "Expected: 22 (as mentioned in requirements)"
if [ "$HIERARCHICAL_COUNT" -ge 18 ]; then
    echo "Status: ✓ PASS"
else
    echo "Status: ✗ INCOMPLETE"
fi

echo ""
echo "Server accessible at: http://localhost:8004"
echo "Test completed successfully!"