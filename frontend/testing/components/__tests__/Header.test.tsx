import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Header from '../../../app/(auth)/dashboard/_components/Header';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('../../../app/_components/NotificationBell', () => {
    return function MockNotificationBell() {
        return <div>NotificationBell</div>;
    };
});

global.fetch = jest.fn();

describe('Header', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('renders header with user dropdown', () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'host',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<Header />);

        expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    test('handles logout functionality', () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'host',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));
        localStorage.setItem('token', 'test-token');

        render(<Header />);

        const userButton = screen.getByText('Test User');
        fireEvent.click(userButton);

        const logoutButton = screen.getByText(/logout/i);
        fireEvent.click(logoutButton);

        expect(localStorage.getItem('user_data')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    test('displays notification bell component', () => {
        render(<Header />);

        expect(screen.getByText('NotificationBell')).toBeInTheDocument();
    });

    test('toggles dropdown menu on click', () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'host',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<Header />);

        const userButton = screen.getByText('Test User');
        expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();

        fireEvent.click(userButton);
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
});
