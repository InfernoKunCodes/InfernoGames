import { ApiResponse, Type } from './api-response.model';

describe('ApiResponse', () => {
  it('applies defaults for an empty payload', () => {
    const res = new ApiResponse();
    expect(res.code).toBe(0);
    expect(res.message).toBe('');
    expect(res.data).toBeUndefined();
    expect(res.type).toBe(Type.NONE);
    expect(res.timeMs).toBe(0);
  });

  it('copies provided fields', () => {
    const res = new ApiResponse<string>({
      code: 200,
      message: 'ok',
      data: 'payload',
      type: Type.SUCCESS,
      timeMs: 42,
    });
    expect(res.code).toBe(200);
    expect(res.message).toBe('ok');
    expect(res.data).toBe('payload');
    expect(res.type).toBe(Type.SUCCESS);
    expect(res.timeMs).toBe(42);
  });

  it('supports typed generic data', () => {
    const res = new ApiResponse<number[]>({ data: [1, 2, 3] });
    expect(res.data).toEqual([1, 2, 3]);
  });
});
