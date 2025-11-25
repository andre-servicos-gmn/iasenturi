import sys

# Read the file
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and modify line 18 (index 17)
if len(lines) > 17:
    lines[17] = "import PSQICard from './PSQICard'\nimport EPS10Card from './EPS10Card'\nimport { ExportButton } from './ExportButton'\n"

# Write back
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Import added successfully!")
