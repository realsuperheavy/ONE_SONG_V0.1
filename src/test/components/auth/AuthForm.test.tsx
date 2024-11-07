import { render, fireEvent, waitFor } from '@/test/utils/test-utils';
import { AuthForm } from '@/components/auth/AuthForm';
import { authService } from '@/lib/firebase/services/auth';

vi.mock('@/lib/firebase/services/auth');

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles login submission', async () => {
    const onSuccess = vi.fn();
    const { getByLabelText, getByRole } = render(
      <AuthForm mode="login" onSuccess={onSuccess} />
    );

    fireEvent.change(getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  // Add more test cases...
}); 