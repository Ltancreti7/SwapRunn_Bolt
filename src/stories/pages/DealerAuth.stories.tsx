import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DealerAuth from '../../pages/DealerAuth.tsx';

const meta: Meta<typeof DealerAuth> = {
  title: 'Pages/DealerAuth',
  component: DealerAuth,
};
export default meta;
type Story = StoryObj<typeof DealerAuth>;
export const Default: Story = {};