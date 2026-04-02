import { render, screen } from '@testing-library/react';
import HostFooter from '../../../app/(auth)/dashboard/_components/HostFooter';

describe('HostFooter', () => {
    test('renders subscribe heading', () => {
        render(<HostFooter />);
        expect(screen.getByText(/Subscribe to hosting tips/i)).toBeInTheDocument();
    });

    test('renders email input and subscribe button', () => {
        render(<HostFooter />);
        expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Subscribe/i })).toBeInTheDocument();
    });

    test('renders brand name', () => {
        render(<HostFooter />);
        expect(screen.getAllByText(/Sajilo Baas/i).length).toBeGreaterThan(0);
    });

    test('renders host support links section', () => {
        render(<HostFooter />);
        expect(screen.getAllByText(/Host Support/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Help Center/i)).toBeInTheDocument();
    });

    test('renders contact information', () => {
        render(<HostFooter />);
        expect(screen.getByText(/host@sajilobaas.com/i)).toBeInTheDocument();
        expect(screen.getByText(/\+977-1-5000000/i)).toBeInTheDocument();
    });

    test('renders language selector options', () => {
        render(<HostFooter />);
        expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Nepali' })).toBeInTheDocument();
    });
});
