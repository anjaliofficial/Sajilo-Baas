import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../../app/(auth)/dashboard/_components/Sidebar';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

describe('Sidebar', () => {
    beforeEach(() => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard/customer');
        localStorage.clear();
    });

    test('renders customer navigation items', () => {
        const mockUser = {
            id: '1',
            email: 'customer@test.com',
            fullName: 'Customer User',
            role: 'customer',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<Sidebar />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Browse Listings')).toBeInTheDocument();
        expect(screen.getByText('My Bookings')).toBeInTheDocument();
    });

    test('renders host navigation items for host role', () => {
        const mockUser = {
            id: '1',
            email: 'host@test.com',
            fullName: 'Host User',
            role: 'host',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<Sidebar />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Bookings')).toBeInTheDocument();
        expect(screen.getByText('Reviews')).toBeInTheDocument();
    });

    test('highlights active menu item based on pathname', () => {
        (usePathname as jest.Mock).mockReturnValue('/dashboard/customer/bookings');
        const mockUser = {
            id: '1',
            email: 'customer@test.com',
            fullName: 'Customer User',
            role: 'customer',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<Sidebar />);

        const bookingsLink = screen.getByText('My Bookings').closest('a');
        expect(bookingsLink?.className).toContain('bg-gradient-to-r');
        expect(bookingsLink?.className).toContain('from-blue-500');
    });

    test('displays user profile information', () => {
        const mockUser = {
            id: '1',
            email: 'test@test.com',
            fullName: 'Test User',
            role: 'customer',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<Sidebar />);

        expect(screen.getByText('Test User')).toBeInTheDocument();
    });
});
