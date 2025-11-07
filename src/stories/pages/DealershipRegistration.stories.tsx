import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DealershipRegistration from '../../pages/DealershipRegistration.tsx';

const meta: Meta<typeof DealershipRegistration> = {
  title: 'Pages/DealershipRegistration',
  component: DealershipRegistration,
};
export default meta;
type Story = StoryObj<typeof DealershipRegistration>;
export const Default: Story = {};