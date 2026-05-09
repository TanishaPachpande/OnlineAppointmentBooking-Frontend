import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Register from '../../components/Register';

vi.mock('axios');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the Create Account heading', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('10-digit mobile number')).toBeInTheDocument();
  });

  it('renders Send OTP button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  it('shows an error toast if Send OTP is clicked with invalid email', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please enter a valid email before requesting an OTP.'
      );
    });
  });

  it('sends OTP and shows OTP input field after success', async () => {
    axios.post.mockResolvedValueOnce({ data: {} });

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('OTP sent')
      );
      expect(screen.getByPlaceholderText('6-digit OTP')).toBeInTheDocument();
    });
  });

  it('shows error toast when Send OTP API fails', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Email already registered' } },
    });

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'fail@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already registered');
    });
  });

  it('shows error if Verify OTP is clicked with short OTP', async () => {
    axios.post.mockResolvedValueOnce({ data: {} }); // send-otp

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));

    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter the 6-digit OTP.');
    });
  });

  it('marks OTP as verified on successful verify', async () => {
    axios.post
      .mockResolvedValueOnce({ data: {} })  // send-otp
      .mockResolvedValueOnce({ data: {} }); // verify-otp

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));

    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('OTP verified')
      );
    });
    // OTP input should be hidden after verification
    expect(screen.queryByPlaceholderText('6-digit OTP')).not.toBeInTheDocument();
  });

  it('prevents form submission if OTP is not sent', async () => {
    renderRegister();
    // The submit button is disabled until OTP is sent.
    // Submit the form element directly to bypass the disabled check.
    const form = document.querySelector('form.auth-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please verify your email with an OTP first.'
      );
    });
  });

  it('registers successfully and navigates PATIENT to /dashboard', async () => {
    axios.post
      .mockResolvedValueOnce({ data: {} })   // send-otp
      .mockResolvedValueOnce({ data: {} })   // verify-otp
      .mockResolvedValueOnce({               // register
        data: { token: 'tok123', userId: '5', role: 'PATIENT', fullName: 'Jane' },
      });

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { name: 'fullName', value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'jane@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));

    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), {
      target: { value: '654321' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('OTP verified')));

    fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
      target: { name: 'password', value: 'pass123' },
    });
    fireEvent.change(screen.getByPlaceholderText('10-digit mobile number'), {
      target: { name: 'phone', value: '9876543210' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('tok123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(toast.success).toHaveBeenCalledWith('Account created successfully!');
    });
  });

  it('navigates PROVIDER to /provider-setup after registration', async () => {
    axios.post
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({
        data: { token: 'tok', userId: '6', role: 'PROVIDER', fullName: 'Dr. X' },
      });

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { name: 'fullName', value: 'Dr X' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'drx@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));
    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), { target: { value: '111111' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('OTP verified')));

    // select PROVIDER role
    fireEvent.change(screen.getByRole('combobox'), {
      target: { name: 'role', value: 'PROVIDER' },
    });
    fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
      target: { name: 'password', value: 'pass' },
    });
    fireEvent.change(screen.getByPlaceholderText('10-digit mobile number'), {
      target: { name: 'phone', value: '1234567890' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/provider-setup');
    });
  });

  it('shows error toast when registration API call fails', async () => {
    axios.post
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce({
        response: { data: { message: 'Email already in use' } },
      });

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { name: 'fullName', value: 'Dup User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { name: 'email', value: 'dup@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => screen.getByPlaceholderText('6-digit OTP'));
    fireEvent.change(screen.getByPlaceholderText('6-digit OTP'), { target: { value: '222222' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
      target: { name: 'password', value: 'p' },
    });
    fireEvent.change(screen.getByPlaceholderText('10-digit mobile number'), {
      target: { name: 'phone', value: '0000000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already in use');
    });
  });
});