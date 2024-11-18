import React from 'react';
import { render, screen } from '@testing-library/react';
import EventList from '../EventList';

test('renders event list', async () => {
  render(<EventList />);
  expect(await screen.findByText(/Event Name/i)).toBeInTheDocument();
}); 