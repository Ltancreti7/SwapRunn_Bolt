import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PasswordUpdate from '../../pages/PasswordUpdate.tsx';

const meta: Meta<typeof PasswordUpdate> = {
  title: 'Pages/PasswordUpdate',
  component: PasswordUpdate,
};
export default meta;
type Story = StoryObj<typeof PasswordUpdate>;
export const Default: Story = {};