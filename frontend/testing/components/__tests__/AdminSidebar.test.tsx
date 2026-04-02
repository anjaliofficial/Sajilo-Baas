import { render, screen } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '../../../app/admin/_components/AdminSidebar';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn(),
}));

describe('AdminSidebar', () => {
    beforeEach(() => {
        (usePathname as jest.Mock).mockReturnValue('/admin');
        (useRouter as jest.Mock).mockReturnValue({
            push: jest.fn(),
        });
        localStorage.clear();
    });

    test('renders admin navigation items', () => {
        render(<AdminSidebar />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Listings')).toBeInTheDocument();
    });

    test('displays user information from localStorage', () => {
        const mockUser = {
            id: '1',
            email: 'admin@test.com',
            fullName: 'Admin User',
            role: 'admin',
        };
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        render(<AdminSidebar />);

        expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    test('highlights active navigation item', () => {
        (usePathname as jest.Mock).mockReturnValue('/admin/users');
        render(<AdminSidebar />);

        const usersLink = screen.getByText('Users').closest('a');
        expect(usersLink?.className).toContain('bg-gradient-to-r');
        expect(usersLink?.className).toContain('from-blue-500');
    });

    test('renders sidebar container', () => {
        const { container } = render(<AdminSidebar />);
        const sidebar = container.querySelector('aside');
        expect(sidebar).toBeInTheDocument();
    });
});
