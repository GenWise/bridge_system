#!/usr/bin/env python3
"""
Bridge System Project-Specific Validation Hook
Always active when in bridge_system project directory
"""
import json
import sys
import re
import os

def validate_colors(content, file_path):
    """Validate bridge system color requirements"""
    issues = []

    # Required GREEN color usage (#059669)
    green_terms = ['Walsh', 'Reverse Flannery', 'Artificial reverse', 'Natural reverse']
    for term in green_terms:
        if term in content and '#059669' not in content:
            issues.append(f"'{term}' requires GREEN color (#059669)")

    # Required RED color usage (#dc2626)
    if 'Opener Rebids' in content and '#dc2626' not in content:
        issues.append("'Opener Rebids' requires RED color (#dc2626)")

    # Cell background validation
    if ('opener' in content.lower() or 'Opener' in content) and 'background' in content:
        if '#dbeafe' not in content:
            issues.append("Opener cells require BLUE background (#dbeafe)")

    if ('responder' in content.lower() or 'Responder' in content) and 'background' in content:
        if '#d1fae5' not in content:
            issues.append("Responder cells require GREEN background (#d1fae5)")

    return issues

def validate_pdf_accuracy(content, file_path):
    """Validate content matches PDF exactly"""
    issues = []

    # Check for made-up content patterns
    forbidden_patterns = [
        r'(detailed|comprehensive|extensive)\s+(explanation|description|analysis)',
        r'(let\'s|we should|you can|one might)',
        r'(comprehensive|thorough|detailed)\s+(guide|overview|summary)'
    ]

    for pattern in forbidden_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append(f"Potentially made-up content detected: avoid elaborative language")
            break

    # Preserve exact placeholder text
    if re.search(r'\bsomething\b', content, re.IGNORECASE) and 'Something' not in content:
        issues.append("Use 'Something' (capitalized) exactly as in PDF")

    # Check for bridge notation consistency
    if any(suit in content for suit in ['spades', 'hearts', 'diamonds', 'clubs']):
        if not any(symbol in content for symbol in ['♠', '♥', '♦', '♣']):
            issues.append("Use bridge symbols (♠♥♦♣) not word names")

    return issues

def validate_layout_requirements(content, file_path):
    """Validate layout follows PDF design"""
    issues = []

    # TOC column width check - only for CSS/HTML structure changes, not JS content changes
    if ('toc' in content.lower() or 'table-of-contents' in content.lower()) and ('.css' in file_path or '.html' in file_path):
        if '200px' not in content:
            issues.append("TOC column must be 200px wide, not 2x2 grid")

    # Table structure validation - skip for colgroup additions
    if '<table' in content and 'bridge' in file_path.lower() and 'colgroup' not in content:
        if 'thin' not in content.lower():
            issues.append("Maintain thin table layout as per PDF design")

    return issues

def main():
    try:
        input_data = json.load(sys.stdin)
        tool_input = input_data.get('tool_input', {})

        content = tool_input.get('content', '') or tool_input.get('new_string', '')
        file_path = tool_input.get('file_path', '')

        if not content:
            sys.exit(0)  # No content to validate

        # Run all validations
        color_issues = validate_colors(content, file_path)
        pdf_issues = validate_pdf_accuracy(content, file_path)
        layout_issues = validate_layout_requirements(content, file_path)

        all_issues = color_issues + pdf_issues + layout_issues

        if all_issues:
            print("Bridge System Validation Failed:", file=sys.stderr)
            for issue in all_issues:
                print(f"  - {issue}", file=sys.stderr)
            print("Requirements: Exact PDF replication, no made-up content, correct colors", file=sys.stderr)
            sys.exit(2)  # Block the operation

        sys.exit(0)  # Allow the operation

    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
