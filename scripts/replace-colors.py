#!/usr/bin/env python3
"""Replace hardcoded hex colors with CSS variable references in TSX files."""

import os
import re
import glob

# Mapping of hex colors to CSS variables
# Order matters: more specific first
COLOR_MAP = [
    # Background colors
    ("'#EDF0F5'", "'var(--color-bg-page)'"),
    ('"#EDF0F5"', '"var(--color-bg-page)"'),
    ("'#FFFFFF'", "'var(--color-white)'"),
    ('"#FFFFFF"', '"var(--color-white)"'),
    ("'#F5F7FA'", "'var(--color-hover-bg)'"),
    ('"#F5F7FA"', '"var(--color-hover-bg)"'),
    ("'#E8EDFF'", "'var(--color-primary-light)'"),
    ('"#E8EDFF"', '"var(--color-primary-light)"'),
    
    # Border colors
    ("'#E2E6EE'", "'var(--color-border)'"),
    ('"#E2E6EE"', '"var(--color-border)"'),
    
    # Text colors
    ("'#1E2A3A'", "'var(--color-text-primary)'"),
    ('"#1E2A3A"', '"var(--color-text-primary)"'),
    ("'#5A6A7E'", "'var(--color-text-secondary)'"),
    ('"#5A6A7E"', '"var(--color-text-secondary)"'),
    ("'#8896A6'", "'var(--color-text-muted)'"),
    ('"#8896A6"', '"var(--color-text-muted)"'),
    ("'#4A5568'", "'var(--color-text-secondary)'"),
    ('"#4A5568"', '"var(--color-text-secondary)"'),
    
    # Icon/muted colors
    ("'#A0AAB8'", "'var(--color-icon-muted)'"),
    ('"#A0AAB8"', '"var(--color-icon-muted)"'),
    
    # Primary blue
    ("'#3B5BDB'", "'var(--color-primary)'"),
    ('"#3B5BDB"', '"var(--color-primary)"'),
    ("'#364FC7'", "'var(--color-primary-hover)'"),
    ('"#364FC7"', '"var(--color-primary-hover)"'),
    
    # Donut track / progress track
    ("'#E0E7FF'", "'var(--color-donut-track)'"),
    ('"#E0E7FF"', '"var(--color-donut-track)"'),
    
    # Overlay
    ("'rgba(30, 42, 58, 0.45)'", "'var(--color-overlay)'"),
    ('"rgba(30, 42, 58, 0.45)"', '"var(--color-overlay)"'),
]

# SVG attribute replacements (stroke=, fill=)
SVG_MAP = [
    ('stroke="#E2E6EE"', 'stroke="var(--color-border)"'),
    ('stroke="#3B5BDB"', 'stroke="var(--color-primary)"'),
    ('fill="#E2E6EE"', 'fill="var(--color-border)"'),
    ('fill="#EDF0F5"', 'fill="var(--color-bg-page)"'),
]

# Files to process
patterns = [
    '/home/ubuntu/projects/agency-pm-tool/app/**/*.tsx',
    '/home/ubuntu/projects/agency-pm-tool/components/**/*.tsx',
]

# Files to skip (have special color needs)
SKIP_PATTERNS = [
    'ExecutiveDashboard',  # Has dark: Tailwind variants already
    'DashboardToggle',     # Has dark: variants
]

def should_skip(filepath):
    for pattern in SKIP_PATTERNS:
        if pattern in filepath:
            return True
    return False

def process_file(filepath):
    if should_skip(filepath):
        print(f"  SKIP: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    for old, new in COLOR_MAP:
        content = content.replace(old, new)
    
    for old, new in SVG_MAP:
        content = content.replace(old, new)
    
    # Also handle backgroundColor: '#E2E6EE' patterns in style objects (without quotes around the key)
    # This covers cases like: backgroundColor: '#FFFFFF'
    # The string replacement above handles quoted values already
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  UPDATED: {filepath}")
        return True
    else:
        print(f"  NO CHANGE: {filepath}")
        return False

updated = 0
for pattern in patterns:
    for filepath in glob.glob(pattern, recursive=True):
        if process_file(filepath):
            updated += 1

print(f"\nTotal files updated: {updated}")
