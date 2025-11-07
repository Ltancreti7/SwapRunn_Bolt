import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Index from '../../pages/Index.tsx';

const meta: Meta<typeof Index> = {
  title: 'Pages/Index',
  component: Index,
};
export default meta;
type Story = StoryObj<typeof Index>;
export const Default: Story = {};