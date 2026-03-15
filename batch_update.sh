#!/bin/bash

# Update ProjectModal.tsx
sed -i "s/'New Project'/'New Initiative'/g" components/projects/ProjectModal.tsx
sed -i "s/'Edit Project'/'Edit Initiative'/g" components/projects/ProjectModal.tsx
sed -i "s/'Create Project'/'Create Initiative'/g" components/projects/ProjectModal.tsx
sed -i "s/project ? 'Edit Project' : 'New Project'/project ? 'Edit Initiative' : 'New Initiative'/g" components/projects/ProjectModal.tsx

# Update ProjectDetailClient.tsx text labels
sed -i "s/\"Project Details\"/\"Initiative Details\"/g" components/projects/ProjectDetailClient.tsx
sed -i "s/\"Project Leads\"/\"Initiative Leads\"/g" components/projects/ProjectDetailClient.tsx
sed -i "s/\"Project Files\"/\"Initiative Files\"/g" components/projects/ProjectDetailClient.tsx
sed -i "s/\"Project Settings\"/\"Initiative Settings\"/g" components/projects/ProjectDetailClient.tsx
sed -i "s/'Project Name'/'Initiative Name'/g" components/projects/ProjectDetailClient.tsx
sed -i "s/'Edit Project'/'Edit Initiative'/g" components/projects/ProjectDetailClient.tsx

# Update TaskModal.tsx
sed -i "s/Project (optional)/Initiative (optional)/g" components/tasks/TaskModal.tsx
sed -i "s/No project/No initiative/g" components/tasks/TaskModal.tsx
sed -i "s/All Projects/All Initiatives/g" components/tasks/TaskModal.tsx

# Update KanbanBoard.tsx
sed -i "s/'Project'/'Initiative'/g" components/kanban/KanbanBoard.tsx
sed -i "s/'All Projects'/'All Initiatives'/g" components/kanban/KanbanBoard.tsx

# Update app pages
sed -i "s/\"Projects\"/\"Initiatives\"/g" app/clients/\[clientId\]/page.tsx
sed -i "s/'Projects'/'Initiatives'/g" app/clients/\[clientId\]/page.tsx
sed -i "s/\"Active Projects\"/\"Active Initiatives\"/g" app/clients/\[clientId\]/page.tsx
sed -i "s/'Active Projects'/'Active Initiatives'/g" app/clients/\[clientId\]/page.tsx

sed -i "s/{ label: 'Projects'/{ label: 'Initiatives'/g" app/clients/page.tsx

sed -i "s/\"Projects\"/\"Initiatives\"/g" app/strategy/page.tsx
sed -i "s/'Projects'/'Initiatives'/g" app/strategy/page.tsx
sed -i "s/\"Linked Projects\"/\"Initiatives\"/g" app/strategy/page.tsx

# Update StrategyDiagram.tsx
sed -i "s/\"Project\"/\"Initiative\"/g" components/strategy/StrategyDiagram.tsx

echo "✓ Batch text updates completed"
