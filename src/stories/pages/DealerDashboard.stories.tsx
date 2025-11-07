import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DealerDashboard from '../../pages/DealerDashboard.tsx';

const meta: Meta<typeof DealerDashboard> = {
  title: 'Pages/DealerDashboard',
  component: DealerDashboard,
};
export default meta;
type Story = StoryObj<typeof DealerDashboard>;
export const Default: Story = {};