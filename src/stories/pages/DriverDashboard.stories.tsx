import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DriverDashboard from '../../pages/DriverDashboard.tsx';

const meta: Meta<typeof DriverDashboard> = {
  title: 'Pages/DriverDashboard',
  component: DriverDashboard,
};
export default meta;
type Story = StoryObj<typeof DriverDashboard>;
export const Default: Story = {};