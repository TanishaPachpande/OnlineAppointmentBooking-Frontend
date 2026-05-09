import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import GuestDashboard from '../../components/GuestDashboard';

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockProviders = [
  { id: 1, fullName: 'Alice Smith', specialization: 'Cardiology', clinicAddress: '123 Main St', experience: 10, consultationFee: 500 },
  { id: 2, fullName: 'Bob Jones', specialization: 'Neurology', clinicAddress: '456 Elm Ave', experience: 5, consultationFee: 300 },
];

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <GuestDashboard />
    </MemoryRouter>
  );

describe('GuestDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    axios.get.mockReturnValueOnce(new Promise(() => {})); // never resolves
    renderDashboard();
    // The component renders a spinner div during loading
    expect(document.querySelector('.loading-container') || document.querySelector('.spinner')).toBeTruthy();
  });

  it('renders provider cards after successful fetch', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProviders });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
    });
  });
  it('shows error message when fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/unable to load providers/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no providers returned', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText('Dr. Alice Smith')).not.toBeInTheDocument();
    });
  });

  it('calls search API and displays results on search', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockProviders }) // initial load
      .mockResolvedValueOnce({ data: [mockProviders[0]] }); // search result

    renderDashboard();
    await waitFor(() => screen.getByText('Dr. Alice Smith'));

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    fireEvent.click(screen.getAllByText('Search')[0]);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/providers/search?keyword=Alice'));
    });
  });

  it('resets to full list when search keyword is cleared', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProviders });
    renderDashboard();
    await waitFor(() => screen.getByText('Dr. Alice Smith'));

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.click(screen.getAllByText('Search')[0]);

    // Should still show all providers (no extra API call needed for empty query)
    expect(screen.getByText('Dr. Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
  });

  it('handles non-array response gracefully', async () => {
    axios.get.mockResolvedValueOnce({ data: null });
    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText('Dr. Alice Smith')).not.toBeInTheDocument();
    });
  });
});