import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import authService from '../../services/authService';

vi.mock('axios');

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('posts to /auth/register and stores user in localStorage', async () => {
      axios.post.mockResolvedValueOnce({
        data: { token: 'reg_tok', userId: '10', role: 'PATIENT' },
      });

      const result = await authService.register({
        fullName: 'Alice',
        email: 'alice@example.com',
        password: 'pass',
        phone: '1234567890',
        role: 'PATIENT',
      });

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/auth/register',
        expect.objectContaining({ email: 'alice@example.com' })
      );
      expect(result.token).toBe('reg_tok');
      expect(JSON.parse(localStorage.getItem('user')).token).toBe('reg_tok');
    });

    it('does not store user in localStorage when no token returned', async () => {
      axios.post.mockResolvedValueOnce({ data: {} });
      await authService.register({ fullName: 'B', email: 'b@b.com', password: 'p', phone: '0', role: 'PATIENT' });
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('login', () => {
    it('posts to /auth/login and stores user in localStorage', async () => {
      axios.post.mockResolvedValueOnce({
        data: { token: 'login_tok', userId: '20', role: 'PATIENT' },
      });

      const result = await authService.login({ email: 'user@example.com', password: 'pass' });

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/auth/login',
        { email: 'user@example.com', password: 'pass' }
      );
      expect(result.token).toBe('login_tok');
      expect(JSON.parse(localStorage.getItem('user')).token).toBe('login_tok');
    });
  });

  describe('logout', () => {
    it('removes token, role, userId and fullName from localStorage', () => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('role', 'PATIENT');
      localStorage.setItem('userId', '1');
      localStorage.setItem('fullName', 'Test');

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
      expect(localStorage.getItem('fullName')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns user object when token and role are set', () => {
      localStorage.setItem('token', 'my_tok');
      localStorage.setItem('role', 'ADMIN');
      localStorage.setItem('userId', '99');
      localStorage.setItem('fullName', 'Admin User');

      const user = authService.getCurrentUser();
      expect(user).toEqual({
        token: 'my_tok',
        role: 'ADMIN',
        userId: '99',
        fullName: 'Admin User',
      });
    });

    it('returns null when token is missing', () => {
      localStorage.setItem('role', 'PATIENT');
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('returns null when role is missing', () => {
      localStorage.setItem('token', 'tok');
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('returns null when localStorage is empty', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });
  });
});