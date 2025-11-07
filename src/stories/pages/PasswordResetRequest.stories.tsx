import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PasswordResetRequest from '../../pages/PasswordResetRequest.tsx';

const meta: Meta<typeof PasswordResetRequest> = {
  title: 'Pages/PasswordResetRequest',
  component: PasswordResetRequest,
};
export default meta;
type Story = StoryObj<typeof PasswordResetRequest>;
export const Default: Story = {};