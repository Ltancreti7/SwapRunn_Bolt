import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Contact from '../../pages/Contact.tsx';

const meta: Meta<typeof Contact> = {
  title: 'Pages/Contact',
  component: Contact,
};
export default meta;
type Story = StoryObj<typeof Contact>;
export const Default: Story = {};