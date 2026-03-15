#!/bin/bash

FILE="app/initiatives/page.tsx"

# Replace navigation and routing
sed -i "s|'\/projects'|'\/initiatives'|g" "$FILE"
sed -i 's/`\/projects\/\${/`\/initiatives\/${/g' "$FILE"

# Replace heading and UI text
sed -i 's/"Projects"/"Initiatives"/g' "$FILE"
sed -i 's/New Project/New Initiative/g' "$FILE"
sed -i 's/Total Projects/Total Initiatives/g' "$FILE"
sed -i "s/Search projects.../Search initiatives.../g" "$FILE"
sed -i "s/No projects found/No initiatives found/g" "$FILE"
sed -i "s/Archive Project/Archive Initiative/g" "$FILE"
sed -i "s/Edit project/Edit initiative/g" "$FILE"
sed -i "s/Archive project/Archive initiative/g" "$FILE"

echo "✓ Updated app/initiatives/page.tsx"
