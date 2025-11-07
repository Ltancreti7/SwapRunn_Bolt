import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import HowItWorks from '../../pages/HowItWorks.tsx';

const meta: Meta<typeof HowItWorks> = {
  title: 'Pages/HowItWorks',
  component: HowItWorks,
};
export default meta;
type Story = StoryObj<typeof HowItWorks>;
export const Default: Story = {};