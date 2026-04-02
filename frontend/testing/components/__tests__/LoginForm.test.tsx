import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../../app/(auth)/_components/LoginForm';
import { loginUser } from '@/lib/actions/auth-action';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/lib/actions/auth-action', () => ({
    loginUser: jest.fn(),
}));

jest.mock('@/lib/auth/storage', () => ({
    clearToken: jest.fn(),
    clearUserData: jest.fn(),
    setToken: jest.fn(),
    setUserData: jest.fn(),
}));

jest.mock('@react-oauth/google', () => ({
    GoogleLogin: () => <div>Google Login</div>,
}));

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (loginUser as jest.Mock).mockResolvedValue({ success: false, message: 'Invalid credentials' });
    });

    test('renders email input', () => {
        render(<LoginForm />);
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    });

    test('renders password input', () => {
        render(<LoginForm />);
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });

    test('renders login button', () => {
        render(<LoginForm />);
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('allows typing in email', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        const emailInput = screen.getByPlaceholderText(/you@example.com/i);
        await user.type(emailInput, 'sabina@gmail.com');
        expect(emailInput).toHaveValue('sabina@gmail.com');
    });

    test('shows error message when login fails', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'sabina@gmail.com');
        await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });
});
