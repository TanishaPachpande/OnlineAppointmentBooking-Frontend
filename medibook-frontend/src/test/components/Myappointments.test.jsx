import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyAppointments from '../../components/MyAppointments';
import authService from '../../services/authService';
import appointmentService from '../../services/appointmentService';
import providerService from '../../services/api';
import paymentService from '../../services/paymentService';

vi.mock('../../services/authService');
vi.mock('../../services/appointmentService');
vi.mock('../../services/api');
vi.mock('../../services/paymentService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUser = { token: 'tok', role: 'PATIENT', userId: '1', fullName: 'John' };

const mockProviders = [
  { providerId: 10, fullName: 'Alice Smith' },
];

const mockAppointments = [
  {
    appointmentId: 101,
    providerId: 10,
    status: 'SCHEDULED',
    appointmentDate: '2026-06-01',
    startTime: '10:00:00',
    endTime: '10:30:00',
    serviceType: 'Consultation',
    modeOfConsultation: 'IN_PERSON',
    notes: '',
  },
  {
    appointmentId: 102,
    providerId: 10,
    status: 'COMPLETED',
    appointmentDate: '2026-05-01',
    startTime: '11:00:00',
    endTime: '11:30:00',
    serviceType: 'Follow-up',
    modeOfConsultation: 'ONLINE',
    notes: '',
  },
  {
    appointmentId: 103,
    providerId: 10,
    status: 'CANCELLED',
    appointmentDate: '2026-04-01',
    startTime: '09:00:00',
    endTime: '09:30:00',
    serviceType: 'Check-up',
    modeOfConsultation: 'IN_PERSON',
    notes: '',
  },
];

const renderComponent = () =>
  render(
    <MemoryRouter>
      <MyAppointments />
    </MemoryRouter>
  );

describe('MyAppointments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockUser);
    appointmentService.getByPatient.mockResolvedValue(mockAppointments);
    providerService.getAllProviders.mockResolvedValue(mockProviders);
    paymentService.getPaymentByAppointmentId.mockRejectedValue(new Error('Not found'));
  });

  it('redirects to /login if user is not a PATIENT', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderComponent();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders the My Appointments heading after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('My Appointments')).toBeInTheDocument();
    });
  });

  it('renders appointment cards for all appointments', async () => {
    renderComponent();
    // Cards use "#101" format (not "Appointment #101")
    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
      expect(screen.getByText('#102')).toBeInTheDocument();
      expect(screen.getByText('#103')).toBeInTheDocument();
    });
  });

  it('displays provider name correctly on appointment cards', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText('Dr. Alice Smith').length).toBeGreaterThan(0);
    });
  });

  it('shows filter tabs: ALL, SCHEDULED, COMPLETED, CANCELLED', async () => {
    renderComponent();
    await waitFor(() => {
      // Filter buttons use "All (3)", "Scheduled (1)" etc.
      expect(screen.getByText(/All \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Scheduled \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancelled \(1\)/i)).toBeInTheDocument();
    });
  });

  it('filters to only SCHEDULED appointments when Scheduled tab is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Scheduled \(1\)/i));

    fireEvent.click(screen.getByText(/Scheduled \(1\)/i));

    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.queryByText('#102')).not.toBeInTheDocument();
    expect(screen.queryByText('#103')).not.toBeInTheDocument();
  });

  it('filters to only COMPLETED appointments when Completed tab is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Completed \(1\)/i));

    fireEvent.click(screen.getByText(/Completed \(1\)/i));

    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.queryByText('#101')).not.toBeInTheDocument();
  });

  it('shows Pay Now button for unpaid SCHEDULED appointment', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('💳 Pay Now')).toBeInTheDocument();
    });
  });

  it('shows Reschedule and Cancel buttons for SCHEDULED appointment', async () => {
    renderComponent();
    await waitFor(() => {
      // Component renders "🔄 Reschedule" and "✕ Cancel"
      expect(screen.getByText('🔄 Reschedule')).toBeInTheDocument();
      expect(screen.getByText('✕ Cancel')).toBeInTheDocument();
    });
  });

  it('shows Rate & Review button for COMPLETED appointment', async () => {
    renderComponent();
    await waitFor(() => {
      // Component renders "⭐ Rate & Review"
      expect(screen.getByText('⭐ Rate & Review')).toBeInTheDocument();
    });
  });

  it('shows Book Again button for CANCELLED appointment', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('🔄 Book Again')).toBeInTheDocument();
    });
  });

  it('shows empty state when no appointments exist', async () => {
    appointmentService.getByPatient.mockResolvedValue([]);
    providerService.getAllProviders.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/No.*appointments/i)).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    appointmentService.getByPatient.mockRejectedValue(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Failed to load appointments.')).toBeInTheDocument();
    });
  });

  it('opens reschedule modal when Reschedule button is clicked', async () => {
    renderComponent();
    // Wait for component to load, then click the 🔄 Reschedule button
    await waitFor(() => screen.getByText('🔄 Reschedule'));
    fireEvent.click(screen.getByText('🔄 Reschedule'));
    // Modal title includes "🔄 Reschedule Appointment"
    await waitFor(() => {
      expect(screen.getByText('🔄 Reschedule Appointment')).toBeInTheDocument();
    });
  });

  it('closes reschedule modal when Cancel button inside modal is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('🔄 Reschedule'));
    fireEvent.click(screen.getByText('🔄 Reschedule'));
    await waitFor(() => screen.getByText('🔄 Reschedule Appointment'));

    // The modal Cancel button is the last "Cancel" on screen
    const cancelBtns = screen.getAllByText('Cancel');
    fireEvent.click(cancelBtns[cancelBtns.length - 1]);
    expect(screen.queryByText('🔄 Reschedule Appointment')).not.toBeInTheDocument();
  });

  it('navigates to payment page when Pay Now is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('💳 Pay Now'));
    fireEvent.click(screen.getByText('💳 Pay Now'));
    expect(mockNavigate).toHaveBeenCalledWith('/payment/101');
  });

  it('navigates to review page when Rate & Review is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('⭐ Rate & Review'));
    fireEvent.click(screen.getByText('⭐ Rate & Review'));
    expect(mockNavigate).toHaveBeenCalledWith('/review/102/10');
  });

  it('shows Paid badge when appointment is already paid', async () => {
    paymentService.getPaymentByAppointmentId.mockResolvedValue({ paymentId: 1, status: 'SUCCESS' });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('✓ Paid')).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard when Book New Appointment is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('+ Book New Appointment'));
    fireEvent.click(screen.getByText('+ Book New Appointment'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
