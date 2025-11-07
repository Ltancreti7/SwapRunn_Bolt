import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Privacy from '../../pages/Privacy.tsx';

const meta: Meta<typeof Privacy> = {
  title: 'Pages/Privacy',
  component: Privacy,
};
export default meta;
type Story = StoryObj<typeof Privacy>;
export const Default: Story = {};