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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders the login form with email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the "Welcome Back" heading', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderLogin();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('renders "Continue as Guest" link', () => {
    renderLogin();
    expect(screen.getByText(/continue as guest/i)).toBeInTheDocument();
  });

  it('updates email and password fields on input', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('Enter your email');
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
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

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
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'adminpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('navigates to /provider-setup for PROVIDER role', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '3', role: 'PROVIDER', fullName: 'Dr. Smith' },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'dr@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/provider-setup');
    });
  });

  it('shows error toast on login failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows fallback error message when no response message', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'x@x.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'x' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Please try again.');
    });
  });

  it('shows loading state while submitting', async () => {
    let resolve;
    axios.post.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    resolve({ data: { token: 't', userId: '1', role: 'PATIENT', fullName: 'A' } });
  });

  it('redirects to savedPath from sessionStorage after login', async () => {
    sessionStorage.setItem('guestRedirectPath', '/book/42');
    axios.post.mockResolvedValueOnce({
      data: { token: 'tok', userId: '1', role: 'PATIENT', fullName: 'Test' },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'p@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/book/42');
      expect(sessionStorage.getItem('guestRedirectPath')).toBeNull();
    });
  });
});