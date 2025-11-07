import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Terms from '../../pages/Terms.tsx';

const meta: Meta<typeof Terms> = {
  title: 'Pages/Terms',
  component: Terms,
};
export default meta;
type Story = StoryObj<typeof Terms>;
export const Default: Story = {};