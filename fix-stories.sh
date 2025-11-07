#!/bin/bash

# Fix all broken story files
cd /workspaces/SwapRunn_Bolt/SwapRunn_Bolt/src/stories/pages

for file in *.stories.tsx; do
  # Extract component name from filename
  component=$(echo "$file" | sed 's/.stories.tsx//')
  
  # Skip if already fixed (has proper import)
  if grep -q "import $component from" "$file" 2>/dev/null; then
    echo "✓ $file already fixed"
    continue
  fi
  
  # Create proper story file content
  cat > "$file" << EOF
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import $component from '../../pages/$component';

const meta: Meta<typeof $component> = {
  title: 'Pages/$component',
  component: $component,
};
export default meta;

type Story = StoryObj<typeof $component>;
export const Default: Story = {};
EOF
  
  echo "✓ Fixed $file"
done

echo "Done fixing story files!"
