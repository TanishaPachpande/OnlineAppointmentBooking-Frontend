import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import authService from '../../services/authService';

vi.mock('../../services/authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Brand ──────────────────────────────────────────────────────────────────

  it('always renders the MediBook brand link', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderNavbar();
    expect(screen.getByText('MediBook')).toBeInTheDocument();
  });

  // ── Guest (not logged in) ──────────────────────────────────────────────────

  it('renders Sign In and Join links when no user is logged in', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderNavbar();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Join')).toBeInTheDocument();
  });

  it('renders Browse Doctors link for guest users', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderNavbar();
    expect(screen.getByText('🏥 Browse Doctors')).toBeInTheDocument();
  });

  it('does not render Sign Out button when no user is logged in', () => {
    authService.getCurrentUser.mockReturnValue(null);
    renderNavbar();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  // ── Patient ────────────────────────────────────────────────────────────────

  it('renders patient-specific navigation links when role is PATIENT', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'PATIENT', token: 'tok' });
    renderNavbar();
    expect(screen.getByText('Find Doctors')).toBeInTheDocument();
    expect(screen.getByText('My Appointments')).toBeInTheDocument();
    expect(screen.getByText('Medical Records')).toBeInTheDocument();
    expect(screen.getByText('🔔 Alerts')).toBeInTheDocument();
  });

  it('does not render guest links when a PATIENT is logged in', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'PATIENT', token: 'tok' });
    renderNavbar();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByText('Join')).not.toBeInTheDocument();
    expect(screen.queryByText('🏥 Browse Doctors')).not.toBeInTheDocument();
  });

  // ── Provider ───────────────────────────────────────────────────────────────

  it('renders provider-specific navigation links when role is PROVIDER', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'PROVIDER', token: 'tok' });
    renderNavbar();
    expect(screen.getByText('Manage Schedule')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Records')).toBeInTheDocument();
    expect(screen.getByText('🔔 Alerts')).toBeInTheDocument();
  });

  it('does not render patient links when role is PROVIDER', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'PROVIDER', token: 'tok' });
    renderNavbar();
    expect(screen.queryByText('Find Doctors')).not.toBeInTheDocument();
    expect(screen.queryByText('My Appointments')).not.toBeInTheDocument();
  });

  // ── Admin ──────────────────────────────────────────────────────────────────

  it('renders admin dashboard link when role is ADMIN', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'ADMIN', token: 'tok' });
    renderNavbar();
    expect(screen.getByText('📊 Dashboard')).toBeInTheDocument();
  });

  it('does not render patient or provider links when role is ADMIN', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'ADMIN', token: 'tok' });
    renderNavbar();
    expect(screen.queryByText('Find Doctors')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Schedule')).not.toBeInTheDocument();
  });

  // ── Logout ─────────────────────────────────────────────────────────────────

  it('renders Sign Out button when a user is logged in', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'PATIENT', token: 'tok' });
    renderNavbar();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls authService.logout and navigates to /browse on Sign Out click', () => {
    authService.getCurrentUser.mockReturnValue({ role: 'PATIENT', token: 'tok' });
    renderNavbar();
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/browse');
  });
});