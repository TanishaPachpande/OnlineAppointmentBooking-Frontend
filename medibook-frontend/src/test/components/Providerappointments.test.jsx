import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProviderAppointments from '../../components/ProviderAppointments';
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

const mockUser = { token: 'tok', role: 'PROVIDER', userId: '2', fullName: 'Dr. Alice' };

const mockProviderData = { providerId: 10, fullName: 'Alice Smith', specialization: 'Cardiology' };

const mockAppointments = [
  {
    appointmentId: 201,
    patientId: 'p1',
    providerId: 10,
    status: 'SCHEDULED',
    appointmentDate: '2026-06-01',
    startTime: '10:00:00',
    endTime: '10:30:00',
    serviceType: 'Consultation',
    modeOfConsultation: 'IN_PERSON',
  },
  {
    appointmentId: 202,
    patientId: 'p2',
    providerId: 10,
    status: 'COMPLETED',
    appointmentDate: '2026-05-01',
    startTime: '11:00:00',
    endTime: '11:30:00',
    serviceType: 'Follow-up',
    modeOfConsultation: 'ONLINE',
  },
];

const renderComponent = () =>
  render(
    <MemoryRouter>
      <ProviderAppointments />
    </MemoryRouter>
  );

describe('ProviderAppointments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
    providerService.getProviderByUserId = vi.fn().mockResolvedValue(mockProviderData);
    appointmentService.getByProvider.mockResolvedValue(mockAppointments);
  });

  it('redirects to /login if user is not a PROVIDER', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders Patient Appointments heading after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Patient Appointments')).toBeInTheDocument();
    });
  });

  it('displays correct stat counts for appointments', async () => {
    renderComponent();
    await waitFor(() => {
      // Total = 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('renders all appointment cards', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Appointment #201')).toBeInTheDocument();
      expect(screen.getByText('Appointment #202')).toBeInTheDocument();
    });
  });

  it('shows filter tabs for ALL, SCHEDULED, COMPLETED, CANCELLED', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/All \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/SCHEDULED \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/COMPLETED \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/CANCELLED \(0\)/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('filters appointments when a filter tab is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/SCHEDULED \(1\)/), { timeout: 3000 });
    fireEvent.click(screen.getByText(/SCHEDULED \(1\)/));

    await waitFor(() => {
      expect(screen.getByText('Appointment #201')).toBeInTheDocument();
      expect(screen.queryByText('Appointment #202')).not.toBeInTheDocument();
    });
  });

  it('shows Mark Complete button for SCHEDULED appointments', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('✓ Mark Complete')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows empty state when no appointments', async () => {
    appointmentService.getByProvider.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Appointment #201')).not.toBeInTheDocument();
    });
  });

  it('shows error message when appointments fetch fails', async () => {
    appointmentService.getByProvider.mockRejectedValue(new Error('Server error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it('navigates to /manage-slots when back button is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Patient Appointments'), { timeout: 3000 });
    fireEvent.click(screen.getByText('← Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/manage-slots');
  });
});