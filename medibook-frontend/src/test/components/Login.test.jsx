import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Login from '../../components/Login';

vi.mock('axios');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

// Helper: fill and submit the login form using real placeholder text
const fillAndSubmit = (emailVal, passwordVal) => {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { name: 'email', value: emailVal },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { name: 'password', value: passwordVal },
  });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the login form with email and password fields', () => {
    renderLogin();
    // FIX: email placeholder is "you@example.com", not "Enter your email"
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the "Sign In" heading', () => {
    renderLogin();
    // FIX: heading is "Sign In" (left panel says "Welcome to MediBook", not "Welcome Back")
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderLogin();
    // FIX: link text is "Create one free", not "sign up"
    expect(screen.getByText(/create one free/i)).toBeInTheDocument();
  });

  it('renders "Continue as Guest" link', () => {
    renderLogin();
    expect(screen.getByText(/continue as guest/i)).toBeInTheDocument();
  });

  it('updates email and password fields on input', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('stores token and navigates to /dashboard for PATIENT role on successful login', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'abc123', userId: '1', role: 'PATIENT', fullName: 'John Doe' },
    });

    renderLogin();
    fillAndSubmit('john@example.com', 'secret');

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('abc123');
      expect(localStorage.getItem('role')).toBe('PATIENT');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });
  });

  it('navigates to /admin for ADMIN role', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '2', role: 'ADMIN', fullName: 'Admin' },
    });

    renderLogin();
    fillAndSubmit('admin@example.com', 'adminpass');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('navigates PROVIDER to /provider-setup when no provider profile exists yet', async () => {
    // FIX: PROVIDER login makes a 2nd GET call to check provider status.
    // When that throws (no profile), component navigates to /provider-setup.
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '3', role: 'PROVIDER', fullName: 'Dr. Smith' },
    });
    axios.get.mockRejectedValueOnce(new Error('Not Found'));

    renderLogin();
    fillAndSubmit('dr@example.com', 'pass');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/provider-setup');
    });
  });

  it('navigates PROVIDER to /manage-slots when provider is APPROVED', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '3', role: 'PROVIDER', fullName: 'Dr. Smith' },
    });
    // 2nd call: GET /providers/user/:id returns APPROVED
    axios.get.mockResolvedValueOnce({ data: { verificationStatus: 'APPROVED' } });

    renderLogin();
    fillAndSubmit('dr@example.com', 'pass');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/manage-slots');
    });
  });

  it('navigates PROVIDER to /provider-setup when provider status is PENDING', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '3', role: 'PROVIDER', fullName: 'Dr. Smith' },
    });
    axios.get.mockResolvedValueOnce({ data: { verificationStatus: 'PENDING' } });

    renderLogin();
    fillAndSubmit('dr@example.com', 'pass');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/provider-setup');
    });
  });

  it('shows error toast on login failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLogin();
    fillAndSubmit('bad@example.com', 'wrong');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows fallback error message when no response message', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    renderLogin();
    fillAndSubmit('x@x.com', 'x');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Please try again.');
    });
  });

  it('shows loading state while submitting', async () => {
    let resolve;
    axios.post.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    renderLogin();
    fillAndSubmit('test@example.com', 'pass');

    // FIX: loading text is "Signing in…" (with Unicode ellipsis), use regex
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    resolve({ data: { token: 't', userId: '1', role: 'PATIENT', fullName: 'A' } });
  });

  it('redirects to savedPath from sessionStorage after login', async () => {
    sessionStorage.setItem('guestRedirectPath', '/book/42');
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '1', role: 'PATIENT', fullName: 'Test' },
    });

    renderLogin();
    fillAndSubmit('p@example.com', 'pass');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/book/42');
      expect(sessionStorage.getItem('guestRedirectPath')).toBeNull();
    });
  });

  it('renders the Google login button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });
});
