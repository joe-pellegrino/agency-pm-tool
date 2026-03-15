#!/bin/bash

FILE="app/initiatives/[id]/page.tsx"

# Replace navigation and routing
sed -i "s|'\/projects'|'\/initiatives'|g" "$FILE"
sed -i 's/`\/projects\/\${/`\/initiatives\/${/g' "$FILE"

# Replace heading and UI text
sed -i 's/"Projects"/"Initiatives"/g' "$FILE"
sed -i 's/New Project/New Initiative/g' "$FILE"
sed -i 's/Edit Project/Edit Initiative/g' "$FILE"
sed -i "s/Back to Projects/Back to Initiatives/g" "$FILE"

echo "✓ Updated app/initiatives/[id]/page.tsx"
