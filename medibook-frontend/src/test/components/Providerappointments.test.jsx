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

// Must have verificationStatus: 'APPROVED' so component shows main appointments view
const mockProviderData = {
  providerId: 10,
  fullName: 'Alice Smith',
  specialization: 'Cardiology',
  verificationStatus: 'APPROVED',
};

// Use far-future dates so the default hidePast=true toggle doesn't hide them
const mockAppointments = [
  {
    appointmentId: 201,
    patientId: 'p1',
    providerId: 10,
    status: 'SCHEDULED',
    appointmentDate: '2099-06-01',
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
    appointmentDate: '2099-05-01',
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
    // FIX: Must use an error WITH a response object that is NOT 404
    // The catch block: if (err?.response?.status === 404 || !err?.response) → sets providerData null
    // Only shows error toast when err.response exists and status !== 404
    appointmentService.getByProvider.mockRejectedValue({
      response: { status: 500, data: { message: 'Internal server error' } },
    });
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

  it('shows pending approval state when provider status is PENDING', async () => {
    providerService.getProviderByUserId = vi.fn().mockResolvedValue({
      providerId: 10,
      verificationStatus: 'PENDING',
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Account Pending Approval')).toBeInTheDocument();
    });
  });

  it('shows rejected state when provider status is REJECTED', async () => {
    providerService.getProviderByUserId = vi.fn().mockResolvedValue({
      providerId: 10,
      verificationStatus: 'REJECTED',
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Account Not Approved')).toBeInTheDocument();
    });
  });

  it('shows complete profile prompt when providerData is null (404)', async () => {
    providerService.getProviderByUserId = vi.fn().mockRejectedValue({ response: { status: 404 } });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Complete Your Profile First')).toBeInTheDocument();
    });
  });

  it('redirects PATIENT role to /login', () => {
    authService.getCurrentUser.mockReturnValue({ token: 'tok', role: 'PATIENT', userId: '1' });
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
