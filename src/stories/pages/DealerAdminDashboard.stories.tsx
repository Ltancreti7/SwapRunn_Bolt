import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DealerAdminDashboard from '../../pages/DealerAdminDashboard.tsx';

const meta: Meta<typeof DealerAdminDashboard> = {
  title: 'Pages/DealerAdminDashboard',
  component: DealerAdminDashboard,
};
export default meta;
type Story = StoryObj<typeof DealerAdminDashboard>;
export const Default: Story = {};