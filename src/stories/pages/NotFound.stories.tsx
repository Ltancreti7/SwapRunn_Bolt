import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NotFound from '../../pages/NotFound.tsx';

const meta: Meta<typeof NotFound> = {
  title: 'Pages/NotFound',
  component: NotFound,
};
export default meta;
type Story = StoryObj<typeof NotFound>;
export const Default: Story = {};