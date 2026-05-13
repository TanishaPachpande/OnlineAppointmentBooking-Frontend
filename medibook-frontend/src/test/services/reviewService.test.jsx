import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import reviewService from '../../services/reviewService';

vi.mock('axios');

describe('reviewService', () => {
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

  it('addReview posts review data', async () => {
    const payload = { appointmentId: 10, providerId: 20, patientId: 30, starRating: 4, comment: 'Good' };
    axios.post.mockResolvedValueOnce({ data: { reviewId: 1, ...payload } });

    const result = await reviewService.addReview(payload);

    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/reviews', payload, authHeaders);
    expect(result.reviewId).toBe(1);
  });

  it('getReviewByAppointmentId fetches by appointmentId', async () => {
    axios.get.mockResolvedValueOnce({ data: { reviewId: 5 } });

    const result = await reviewService.getReviewByAppointmentId(10);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/reviews/appointment/10',
      authHeaders
    );
    expect(result.reviewId).toBe(5);
  });

  it('getReviewsByPatient fetches reviews for patient', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ reviewId: 1 }, { reviewId: 2 }] });

    const result = await reviewService.getReviewsByPatient(30);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/reviews/patient/30',
      authHeaders
    );
    expect(result).toHaveLength(2);
  });

  it('getReviewsByProvider fetches reviews for provider', async () => {
    axios.get.mockResolvedValueOnce({ data: [{ reviewId: 3 }] });

    const result = await reviewService.getReviewsByProvider(20);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/reviews/provider/20',
      authHeaders
    );
    expect(result).toHaveLength(1);
  });

  it('getProviderRatingSummary fetches rating summary', async () => {
    axios.get.mockResolvedValueOnce({ data: { averageRating: 4.2, totalReviews: 5 } });

    const result = await reviewService.getProviderRatingSummary(20);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8080/reviews/provider/20/summary',
      authHeaders
    );
    expect(result.averageRating).toBe(4.2);
  });

  it('deleteReview sends DELETE request', async () => {
    axios.delete.mockResolvedValueOnce({ data: 'Review deleted successfully' });

    const result = await reviewService.deleteReview(1);

    expect(axios.delete).toHaveBeenCalledWith(
      'http://localhost:8080/reviews/1',
      authHeaders
    );
    expect(result).toContain('deleted');
  });

  it('sends no Authorization header when token is missing', async () => {
    localStorage.removeItem('token');
    axios.get.mockResolvedValueOnce({ data: [] });

    await reviewService.getReviewsByPatient(1);

    const callArgs = axios.get.mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });

  it('includes Content-Type even when no token', async () => {
    localStorage.removeItem('token');
    axios.post.mockResolvedValueOnce({ data: {} });

    await reviewService.addReview({ appointmentId: 1 });

    const callArgs = axios.post.mock.calls[0];
    expect(callArgs[2].headers['Content-Type']).toBe('application/json');
  });

  it('addReview propagates axios errors', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));
    await expect(reviewService.addReview({})).rejects.toThrow('Network Error');
  });

  it('getReviewByAppointmentId propagates axios errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('Not Found'));
    await expect(reviewService.getReviewByAppointmentId(99)).rejects.toThrow('Not Found');
  });

  it('getReviewsByPatient propagates axios errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(reviewService.getReviewsByPatient(1)).rejects.toThrow('Unauthorized');
  });

  it('getReviewsByProvider propagates axios errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('Server Error'));
    await expect(reviewService.getReviewsByProvider(1)).rejects.toThrow('Server Error');
  });

  it('deleteReview propagates axios errors', async () => {
    axios.delete.mockRejectedValueOnce(new Error('Forbidden'));
    await expect(reviewService.deleteReview(1)).rejects.toThrow('Forbidden');
  });
});
