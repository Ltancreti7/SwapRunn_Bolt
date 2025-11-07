import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DriverAuth from '../../pages/DriverAuth.tsx';

const meta: Meta<typeof DriverAuth> = {
  title: 'Pages/DriverAuth',
  component: DriverAuth,
};
export default meta;
type Story = StoryObj<typeof DriverAuth>;
export const Default: Story = {};