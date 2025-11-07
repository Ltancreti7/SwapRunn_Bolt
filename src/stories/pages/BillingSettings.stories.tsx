import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BillingSettings from '../../pages/BillingSettings.tsx';

const meta: Meta<typeof BillingSettings> = {
  title: 'Pages/BillingSettings',
  component: BillingSettings,
};
export default meta;
type Story = StoryObj<typeof BillingSettings>;
export const Default: Story = {};