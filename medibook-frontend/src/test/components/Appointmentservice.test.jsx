import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import appointmentService from '../../services/appointmentService';

vi.mock('axios');

describe('appointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test_token');
  });

  it('bookAppointment posts to /appointments with data', async () => {
    const payload = { patientId: '1', providerId: '10', slotId: '5' };
    axios.post.mockResolvedValueOnce({ data: { appointmentId: 99 } });

    const result = await appointmentService.bookAppointment(payload);

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/appointments',
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
    expect(result.appointmentId).toBe(99);
  });

  it('getById fetches appointment by ID', async () => {
    axios.get.mockResolvedValueOnce({ data: { appointmentId: 101 } });

    const result = await appointmentService.getById(101);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/101',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
    expect(result.appointmentId).toBe(101);
  });

  it('getByPatient fetches appointments for a patient', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ appointmentId: 1 }, { appointmentId: 2 }] });

    const result = await appointmentService.getByPatient('42');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/patient/42',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
    expect(result).toHaveLength(2);
  });

  it('getUpcomingByPatient fetches upcoming appointments', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ appointmentId: 5 }] });

    const result = await appointmentService.getUpcomingByPatient('42');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/patient/42/upcoming',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
    expect(result).toHaveLength(1);
  });

  it('getByProvider fetches appointments for a provider', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ appointmentId: 7 }] });

    const result = await appointmentService.getByProvider('10');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/provider/10',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
    expect(result).toHaveLength(1);
  });

  it('cancelAppointment sends PUT to /appointments/:id/cancel', async () => {
    axios.put.mockResolvedValueOnce({ data: { status: 'CANCELLED' } });

    const result = await appointmentService.cancelAppointment(101);

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/101/cancel',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
    expect(result.status).toBe('CANCELLED');
  });

  it('rescheduleAppointment sends PUT with newSlotId', async () => {
    axios.put.mockResolvedValueOnce({ data: { appointmentId: 101 } });

    await appointmentService.rescheduleAppointment(101, 55);

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/101/reschedule',
      { newSlotId: 55 },
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
  });

  it('completeAppointment sends PUT to /appointments/:id/complete', async () => {
    axios.put.mockResolvedValueOnce({ data: { status: 'COMPLETED' } });

    await appointmentService.completeAppointment(101);

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/101/complete',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
  });

  it('updateStatus sends PUT with correct status query param', async () => {
    axios.put.mockResolvedValueOnce({ data: {} });

    await appointmentService.updateStatus(101, 'NO_SHOW');

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8080/appointments/101/status?status=NO_SHOW',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json',
        })
      })
    );
  });

  it('sends no Authorization header when token is missing', async () => {
    localStorage.removeItem('token');
    axios.get.mockResolvedValueOnce({ data: [] });

    await appointmentService.getByPatient('1');

    const callArgs = axios.get.mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });
});