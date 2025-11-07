import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AcceptInvitation from '../../pages/AcceptInvitation.tsx';

const meta: Meta<typeof AcceptInvitation> = {
  title: 'Pages/AcceptInvitation',
  component: AcceptInvitation,
};
export default meta;
type Story = StoryObj<typeof AcceptInvitation>;
export const Default: Story = {};