import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientDashboard from '../../components/PatientDashboard';
import authService from '../../services/authService';
import providerService from '../../services/api';
import appointmentService from '../../services/appointmentService';

vi.mock('../../services/authService');
vi.mock('../../services/api');
vi.mock('../../services/appointmentService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUser = { token: 'tok', role: 'PATIENT', userId: '1', fullName: 'John' };

const mockProviders = [
  { providerId: 10, fullName: 'Alice Smith', specialization: 'Cardiology', clinicAddress: '123 Main St', experience: 10, consultationFee: 500 },
  { providerId: 11, fullName: 'Bob Jones', specialization: 'Neurology', clinicAddress: '456 Elm St', experience: 5, consultationFee: 300 },
];

const mockUpcoming = [
  { appointmentId: 201, providerId: 10, appointmentDate: '2026-06-01', startTime: '10:00:00', status: 'SCHEDULED', serviceType: 'Consultation' },
];

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <PatientDashboard />
    </MemoryRouter>
  );

describe('PatientDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
    providerService.getAllProviders.mockResolvedValue(mockProviders);
    appointmentService.getUpcomingByPatient.mockResolvedValue(mockUpcoming);
  });

  it('redirects to /login if user is not logged in', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderDashboard();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login if user role is not PATIENT', () => {
    authService.getCurrentUser.mockReturnValue({ ...mockUser, role: 'PROVIDER' });
    renderDashboard();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders provider cards after loading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('Dr. Alice Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Dr. Bob Jones').length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('renders upcoming appointment section', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('📅 Upcoming Appointments')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls search API when Search is triggered with keyword', async () => {
    providerService.searchProviders = vi.fn().mockResolvedValue([mockProviders[0]]);
    renderDashboard();
    await waitFor(() => screen.getAllByText('Dr. Alice Smith'), { timeout: 3000 });

    const input = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getAllByText('Search')[0]);

    await waitFor(() => {
      expect(providerService.searchProviders).toHaveBeenCalledWith('Alice');
    });
  });

  it('resets providers list when search keyword is empty', async () => {
    renderDashboard();
    await waitFor(() => screen.getAllByText('Dr. Alice Smith'), { timeout: 3000 });

    const input = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getAllByText('Search')[0]);

    expect(screen.getAllByText('Dr. Alice Smith').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dr. Bob Jones').length).toBeGreaterThan(0);
  });

  it('navigates to booking page when Book Appointment is clicked', async () => {
    mockProviders[0].isAvailable = true;
    providerService.getAllProviders.mockResolvedValue(mockProviders);
    renderDashboard();
    await waitFor(() => screen.getAllByText('Book Appointment'), { timeout: 3000 });

    fireEvent.click(screen.getAllByText('Book Appointment')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/book/10');
  });

  it('renders empty state when no providers available', async () => {
    providerService.getAllProviders.mockResolvedValue([]);
    appointmentService.getUpcomingByPatient.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.queryByText('Dr. Alice Smith')).not.toBeInTheDocument();
    });
  });

  it('shows loading spinner initially', () => {
    providerService.getAllProviders.mockReturnValue(new Promise(() => {}));
    appointmentService.getUpcomingByPatient.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(document.querySelector('.spinner') || document.querySelector('.loading-container')).toBeTruthy();
  });
});