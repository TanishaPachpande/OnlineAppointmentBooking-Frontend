import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import notificationService from '../../services/notificationService';

vi.mock('axios');

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    localStorage.setItem('token', 'test_token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const authHeaders = {
    headers: expect.objectContaining({
      Authorization: 'Bearer test_token',
      'Content-Type': 'application/json',
    }),
  };

  it('getNotificationsByUser fetches notifications for userId', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ notificationId: 1 }, { notificationId: 2 }] });

    const result = await notificationService.getNotificationsByUser(99);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/notifications/user/99',
      authHeaders
    );
    expect(result).toHaveLength(2);
  });

  it('getNotificationsByUser throws when userId is missing', async () => {
    await expect(notificationService.getNotificationsByUser(null))
      .rejects.toThrow('userId is required');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('getNotificationsByUser throws when userId is undefined', async () => {
    await expect(notificationService.getNotificationsByUser(undefined))
      .rejects.toThrow('userId is required');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('getNotificationsByUser throws when userId is 0 (falsy)', async () => {
    await expect(notificationService.getNotificationsByUser(0))
      .rejects.toThrow('userId is required');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('markAsRead sends PUT to /notifications/:id/read', async () => {
    axios.put.mockResolvedValueOnce({ data: { notificationId: 1, status: 'READ' } });

    const result = await notificationService.markAsRead(1);

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8080/notifications/1/read',
      {},
      authHeaders
    );
    expect(result.status).toBe('READ');
  });

  it('deleteNotification sends DELETE request', async () => {
    axios.delete.mockResolvedValueOnce({ data: 'Deleted' });

    await notificationService.deleteNotification(5);

    expect(axios.delete).toHaveBeenCalledWith(
      'http://localhost:8080/notifications/5',
      authHeaders
    );
  });

  it('sends no Authorization header when token is missing', async () => {
    localStorage.removeItem('token');
    axios.get.mockResolvedValueOnce({ data: [] });

    await notificationService.getNotificationsByUser(1);

    const callArgs = axios.get.mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });

  it('includes Content-Type even when no token', async () => {
    localStorage.removeItem('token');
    axios.get.mockResolvedValueOnce({ data: [] });

    await notificationService.getNotificationsByUser(1);

    const callArgs = axios.get.mock.calls[0];
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });

  it('getNotificationsByUser propagates axios errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(notificationService.getNotificationsByUser(1))
      .rejects.toThrow('Network Error');
  });

  it('markAsRead propagates axios errors', async () => {
    axios.put.mockRejectedValueOnce(new Error('Server Error'));

    await expect(notificationService.markAsRead(1))
      .rejects.toThrow('Server Error');
  });

  it('deleteNotification propagates axios errors', async () => {
    axios.delete.mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(notificationService.deleteNotification(1))
      .rejects.toThrow('Unauthorized');
  });
});
