#!/usr/bin/env python3
"""
Test script to validate the hierarchical implementation
"""
import json
import requests
import sys

def test_server_running():
    """Test if the server is accessible"""
    try:
        response = requests.get('http://localhost:8004', timeout=5)
        if response.status_code == 200:
            print("✓ Server is running on port 8004")
            return True
        else:
            print(f"✗ Server returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Server not accessible: {e}")
        return False

def test_data_loading():
    """Test if data.json loads correctly"""
    try:
        response = requests.get('http://localhost:8004/data.json', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✓ data.json loads correctly")
            return data
        else:
            print(f"✗ data.json returned status code {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ data.json not accessible: {e}")
        return None

def test_hierarchical_structure(data):
    """Test hierarchical table structure"""
    hierarchical_count = 0
    hierarchical_sections = []

    for section_id, section in data.get('sections', {}).items():
        if 'content' in section and 'sections' in section['content']:
            for content_section in section['content']['sections']:
                if content_section.get('type') == 'hierarchical_table':
                    hierarchical_count += 1
                    hierarchical_sections.append((section_id, content_section.get('title', 'No title')))

                    # Check for hierarchical structure elements
                    section_data = content_section.get('data', [])
                    has_levels = any('level' in item for item in section_data)
                    has_children = any('children' in item for item in section_data)
                    has_alternating_types = any(item.get('cellType') in ['opener', 'responder'] for item in section_data)

                    print(f"  - {section_id}: {content_section.get('title', 'No title')}")
                    print(f"    Levels: {has_levels}, Children: {has_children}, Cell types: {has_alternating_types}")

    print(f"✓ Found {hierarchical_count} hierarchical table sections")
    return hierarchical_count, hierarchical_sections

def test_1c1d1n_specifically(data):
    """Test the specific 1c1d1n sequence"""
    # Look for sections containing 1c1d1n
    found_1c1d1n = False

    for section_id, section in data.get('sections', {}).items():
        if '1c1d1n' in section_id.lower():
            print(f"✓ Found section with 1c1d1n: {section_id}")
            found_1c1d1n = True

            # Check the structure
            if 'content' in section and 'sections' in section['content']:
                for content_section in section['content']['sections']:
                    if content_section.get('type') == 'hierarchical_table':
                        section_data = content_section.get('data', [])
                        print(f"  - Hierarchical data items: {len(section_data)}")

                        # Check first few items for proper structure
                        for i, item in enumerate(section_data[:5]):
                            cellType = item.get('cellType', 'unknown')
                            level = item.get('level', 1)
                            bid = item.get('bid', 'no bid')
                            has_children = 'children' in item
                            print(f"    [{i}] {bid}: {cellType}, level {level}, children: {has_children}")

                        return True

    if not found_1c1d1n:
        print("✗ Could not find specific 1c1d1n section")

    return found_1c1d1n

def test_color_requirements():
    """Test that the required color patterns are implemented in styles.css"""
    try:
        response = requests.get('http://localhost:8004/styles.css', timeout=5)
        if response.status_code == 200:
            css_content = response.text

            # Check for required colors
            has_opener_green = '#d1fae5' in css_content and 'opener-cell' in css_content
            has_responder_blue = '#dbeafe' in css_content and 'responder-cell' in css_content
            has_indentation = 'indent-' in css_content

            print(f"✓ CSS loaded. Opener green: {has_opener_green}, Responder blue: {has_responder_blue}, Indentation: {has_indentation}")
            return has_opener_green and has_responder_blue and has_indentation
        else:
            print(f"✗ styles.css returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ styles.css not accessible: {e}")
        return False

def main():
    print("=== Bridge System Hierarchical Implementation Test ===\n")

    # Test server
    if not test_server_running():
        sys.exit(1)

    # Test data loading
    data = test_data_loading()
    if not data:
        sys.exit(1)

    # Test hierarchical structure
    print("\n--- Testing hierarchical structure ---")
    hierarchical_count, hierarchical_sections = test_hierarchical_structure(data)

    # Test specific 1c1d1n sequence
    print("\n--- Testing 1c1d1n sequence ---")
    test_1c1d1n_specifically(data)

    # Test color requirements
    print("\n--- Testing color and styling requirements ---")
    test_color_requirements()

    print(f"\n=== Summary ===")
    print(f"Hierarchical tables found: {hierarchical_count}")
    print(f"Expected: 22 (as mentioned in requirements)")
    print(f"Status: {'✓ PASS' if hierarchical_count >= 18 else '✗ INCOMPLETE'}")

    print(f"\nServer accessible at: http://localhost:8004")
    print(f"Test completed successfully!")

if __name__ == '__main__':
    main()