import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DriverRequests from '../../pages/DriverRequests.tsx';

const meta: Meta<typeof DriverRequests> = {
  title: 'Pages/DriverRequests',
  component: DriverRequests,
};
export default meta;
type Story = StoryObj<typeof DriverRequests>;
export const Default: Story = {};