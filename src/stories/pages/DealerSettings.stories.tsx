import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DealerSettings from '../../pages/DealerSettings.tsx';

const meta: Meta<typeof DealerSettings> = {
  title: 'Pages/DealerSettings',
  component: DealerSettings,
};
export default meta;
type Story = StoryObj<typeof DealerSettings>;
export const Default: Story = {};