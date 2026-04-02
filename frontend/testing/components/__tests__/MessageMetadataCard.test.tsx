import { render, screen, fireEvent } from '@testing-library/react';
import MessageMetadataCard from '../../../app/admin/_components/MessageMetadataCard';

const baseMessage = {
    messageId: 'm1',
    sender: 'alice@example.com',
    receiver: 'bob@example.com',
    type: 'text' as const,
    timestamp: '2026-03-01T10:00:00.000Z',
    deliveryStatus: 'sent' as const,
};

describe('MessageMetadataCard', () => {
    test('renders sender and receiver metadata', () => {
        render(<MessageMetadataCard message={baseMessage} />);

        expect(screen.getByText(/From:/i)).toBeInTheDocument();
        expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/To:/i)).toBeInTheDocument();
        expect(screen.getByText(/bob@example.com/i)).toBeInTheDocument();
    });

    test('renders type label for text message', () => {
        render(<MessageMetadataCard message={baseMessage} />);
        expect(screen.getByText(/Text Message/i)).toBeInTheDocument();
    });

    test('renders type label for image message', () => {
        render(
            <MessageMetadataCard
                message={{ ...baseMessage, type: 'image' }}
            />
        );
        expect(screen.getByText(/Image Message/i)).toBeInTheDocument();
    });

    test('shows media count singular', () => {
        render(
            <MessageMetadataCard
                message={{ ...baseMessage, type: 'file', mediaCount: 1 }}
            />
        );
        expect(screen.getByText(/1 file/i)).toBeInTheDocument();
    });

    test('shows media count plural', () => {
        render(
            <MessageMetadataCard
                message={{ ...baseMessage, type: 'file', mediaCount: 3 }}
            />
        );
        expect(screen.getByText(/3 files/i)).toBeInTheDocument();
    });

    test('renders delivery status badge', () => {
        render(
            <MessageMetadataCard
                message={{ ...baseMessage, deliveryStatus: 'read' }}
            />
        );
        expect(screen.getByText(/^read$/i)).toBeInTheDocument();
    });

    test('calls onViewReport when button clicked', () => {
        const onViewReport = jest.fn();
        render(
            <MessageMetadataCard
                message={baseMessage}
                onViewReport={onViewReport}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /View Reports/i }));
        expect(onViewReport).toHaveBeenCalledWith('m1');
    });

    test('hides action button when onViewReport not provided', () => {
        render(<MessageMetadataCard message={baseMessage} />);
        expect(screen.queryByRole('button', { name: /View Reports/i })).not.toBeInTheDocument();
    });

    test('shows privacy notice text', () => {
        render(<MessageMetadataCard message={baseMessage} />);
        expect(screen.getByText(/Message content is protected and hidden/i)).toBeInTheDocument();
    });
});
