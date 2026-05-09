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
    await waitFor(() => {
      expect(screen.getByText('Appointment #101')).toBeInTheDocument();
      expect(screen.getByText('Appointment #102')).toBeInTheDocument();
      expect(screen.getByText('Appointment #103')).toBeInTheDocument();
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
      expect(screen.getByText(/All \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Scheduled \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancelled \(1\)/i)).toBeInTheDocument();
    });
  });

  it('filters to only SCHEDULED appointments when SCHEDULED tab is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Scheduled \(1\)/i));

    fireEvent.click(screen.getByText(/Scheduled \(1\)/i));

    expect(screen.getByText('Appointment #101')).toBeInTheDocument();
    expect(screen.queryByText('Appointment #102')).not.toBeInTheDocument();
    expect(screen.queryByText('Appointment #103')).not.toBeInTheDocument();
  });

  it('filters to only COMPLETED appointments when COMPLETED tab is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Completed \(1\)/i));

    fireEvent.click(screen.getByText(/Completed \(1\)/i));

    expect(screen.getByText('Appointment #102')).toBeInTheDocument();
    expect(screen.queryByText('Appointment #101')).not.toBeInTheDocument();
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
      expect(screen.getByText('Reschedule')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('shows Rate button for COMPLETED appointment', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('⭐ Rate')).toBeInTheDocument();
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

  it('opens reschedule modal when Reschedule is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Reschedule'));
    fireEvent.click(screen.getByText('Reschedule'));
    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();
  });

  it('closes reschedule modal when Cancel button inside modal is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Reschedule'));
    fireEvent.click(screen.getByText('Reschedule'));
    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();

    // Click the Cancel button inside the modal (not the appointment cancel)
    const cancelBtns = screen.getAllByText('Cancel');
    fireEvent.click(cancelBtns[cancelBtns.length - 1]); // last Cancel is the modal one
    expect(screen.queryByText('Reschedule Appointment')).not.toBeInTheDocument();
  });

  it('navigates to payment page when Pay Now is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('💳 Pay Now'));
    fireEvent.click(screen.getByText('💳 Pay Now'));
    expect(mockNavigate).toHaveBeenCalledWith('/payment/101');
  });

  it('navigates to review page when Rate is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('⭐ Rate'));
    fireEvent.click(screen.getByText('⭐ Rate'));
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