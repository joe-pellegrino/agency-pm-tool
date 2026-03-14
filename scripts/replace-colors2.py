#!/usr/bin/env python3
"""Second pass - replace colors in border strings and other patterns."""

import glob

REPLACEMENTS = [
    # Border strings containing hex
    ("'1px solid #E2E6EE'", "'1px solid var(--color-border)'"),
    ('"1px solid #E2E6EE"', '"1px solid var(--color-border)"'),
    ("'1px solid #3B5BDB'", "'1px solid var(--color-primary)'"),
    ('"1px solid #3B5BDB"', '"1px solid var(--color-primary)"'),
    # Kanban column bg
    ("'#F8F9FC'", "'var(--color-bg-page)'"),
    ('"#F8F9FC"', '"var(--color-bg-page)"'),
    # Any remaining border colors
    ("#E2E6EE", "var(--color-border)"),  # in bare JSX string attributes
]

patterns = [
    '/home/ubuntu/projects/agency-pm-tool/app/**/*.tsx',
    '/home/ubuntu/projects/agency-pm-tool/components/**/*.tsx',
]

SKIP = ['ExecutiveDashboard', 'DashboardToggle']

updated = 0
for pattern in patterns:
    for filepath in glob.glob(pattern, recursive=True):
        if any(s in filepath for s in SKIP):
            continue
        with open(filepath) as f:
            content = f.read()
        original = content
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"  UPDATED: {filepath}")
            updated += 1

print(f"\nTotal files updated: {updated}")
