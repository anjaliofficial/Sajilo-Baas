import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '../../../app/(auth)/_components/RegisterForm';

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/lib/actions/auth-action', () => ({
    registerUser: jest.fn(),
}));

jest.mock('@/lib/auth/storage', () => ({
    clearToken: jest.fn(),
    clearUserData: jest.fn(),
    setToken: jest.fn(),
    setUserData: jest.fn(),
}));

jest.mock('@react-oauth/google', () => ({
    GoogleLogin: () => <div>Google Signup</div>,
}));

describe('RegisterForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders all input fields', () => {
        render(<RegisterForm />);
        expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/9800000000/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/kathmandu, nepal/i)).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText(/••••••••/i)).toHaveLength(2);
    });

    test('password field is type password', () => {
        render(<RegisterForm />);
        expect(screen.getAllByPlaceholderText(/••••••••/i)[0]).toHaveAttribute('type', 'password');
    });

    test('submit button exists', () => {
        render(<RegisterForm />);
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    test('allows typing in name field', async () => {
        const user = userEvent.setup();
        render(<RegisterForm />);
        const nameInput = screen.getByPlaceholderText(/john doe/i);
        await user.type(nameInput, 'Sabina Karki');
        expect(nameInput).toHaveValue('Sabina Karki');
    });

    test('shows validation error', async () => {
        const user = userEvent.setup();
        render(<RegisterForm />);

        await user.type(screen.getByPlaceholderText(/john doe/i), 'Sabina');
        await user.type(screen.getByPlaceholderText(/you@example.com/i), 'sabina@gmail.com');
        await user.type(screen.getByPlaceholderText(/9800000000/i), '9800000000');
        await user.type(screen.getByPlaceholderText(/kathmandu, nepal/i), 'Kathmandu');
        const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
        await user.type(passwordInputs[0], '12345678');
        await user.type(passwordInputs[1], '87654321');

        await user.click(screen.getByRole('button', { name: /create account/i }));

        expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    });
});
