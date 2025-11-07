import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CreateJob from '../../pages/CreateJob.tsx';

const meta: Meta<typeof CreateJob> = {
  title: 'Pages/CreateJob',
  component: CreateJob,
};
export default meta;
type Story = StoryObj<typeof CreateJob>;
export const Default: Story = {};