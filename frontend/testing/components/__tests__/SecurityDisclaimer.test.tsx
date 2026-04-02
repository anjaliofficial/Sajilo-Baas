import { render, screen } from '@testing-library/react';
import SecurityDisclaimer from '../../../app/admin/_components/SecurityDisclaimer';

describe('SecurityDisclaimer', () => {
    test('renders privacy message', () => {
        render(<SecurityDisclaimer />);

        expect(screen.getByText(/Privacy First/i)).toBeInTheDocument();
        expect(screen.getByText(/Message Privacy Protected/i)).toBeInTheDocument();
    });

    test('displays security warning icon', () => {
        const { container } = render(<SecurityDisclaimer />);

        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
    });

    test('shows admin access limitation message', () => {
        render(<SecurityDisclaimer />);

        expect(screen.getByText(/Content is accessible ONLY when users report messages/i)).toBeInTheDocument();
    });
});
