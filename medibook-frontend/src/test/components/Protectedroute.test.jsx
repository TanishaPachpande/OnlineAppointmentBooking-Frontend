import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import authService from '../../services/authService';

vi.mock('../../services/authService');

const renderRoute = (user, allowedRoles, initialPath = '/protected') => {
  authService.getCurrentUser.mockReturnValue(user);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders children when user is logged in with an allowed role', () => {
    renderRoute({ token: 't', role: 'PATIENT', userId: '1' }, ['PATIENT']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when user is not logged in', () => {
    renderRoute(null, ['PATIENT']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('saves the intended path to sessionStorage when redirecting to login', () => {
    renderRoute(null, ['PATIENT'], '/protected');
    expect(sessionStorage.getItem('guestRedirectPath')).toBe('/protected');
  });

  it('redirects to /unauthorized when user has wrong role', () => {
    renderRoute({ token: 't', role: 'PROVIDER', userId: '2' }, ['PATIENT']);
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('renders children when no allowedRoles restriction and user is logged in', () => {
    renderRoute({ token: 't', role: 'ADMIN', userId: '3' }, undefined);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows ADMIN access when ADMIN is in allowedRoles', () => {
    renderRoute({ token: 't', role: 'ADMIN', userId: '3' }, ['ADMIN']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows access when user role matches one of multiple allowed roles', () => {
    renderRoute({ token: 't', role: 'PROVIDER', userId: '4' }, ['PATIENT', 'PROVIDER']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});