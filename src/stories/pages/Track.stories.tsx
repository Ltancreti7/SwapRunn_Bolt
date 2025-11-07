import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Track from '../../pages/Track.tsx';

const meta: Meta<typeof Track> = {
  title: 'Pages/Track',
  component: Track,
};
export default meta;
type Story = StoryObj<typeof Track>;
export const Default: Story = {};