import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import StaffSignup from '../../pages/StaffSignup.tsx';

const meta: Meta<typeof StaffSignup> = {
  title: 'Pages/StaffSignup',
  component: StaffSignup,
};
export default meta;
type Story = StoryObj<typeof StaffSignup>;
export const Default: Story = {};