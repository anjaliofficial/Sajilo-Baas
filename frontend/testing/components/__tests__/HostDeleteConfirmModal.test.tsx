import { render, screen, fireEvent, act } from '@testing-library/react';
import DeleteConfirmModal from '../../../app/(auth)/dashboard/host/messages/DeleteConfirmModal';

describe('Host DeleteConfirmModal', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('returns null when closed', () => {
        const { container } = render(
            <DeleteConfirmModal
                isOpen={false}
                onClose={jest.fn()}
                onDeleteForMe={jest.fn().mockResolvedValue(undefined)}
                onDeleteForEveryone={jest.fn().mockResolvedValue(undefined)}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    test('renders modal text and action buttons', () => {
        render(
            <DeleteConfirmModal
                isOpen={true}
                onClose={jest.fn()}
                onDeleteForMe={jest.fn().mockResolvedValue(undefined)}
                onDeleteForEveryone={jest.fn().mockResolvedValue(undefined)}
            />
        );

        expect(screen.getByText(/Delete message\?/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete for everyone/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete for me/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    test('calls onClose when Cancel clicked', () => {
        const onClose = jest.fn();
        render(
            <DeleteConfirmModal
                isOpen={true}
                onClose={onClose}
                onDeleteForMe={jest.fn().mockResolvedValue(undefined)}
                onDeleteForEveryone={jest.fn().mockResolvedValue(undefined)}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('handles delete for me flow and auto closes', async () => {
        const onClose = jest.fn();
        const onDeleteForMe = jest.fn().mockResolvedValue(undefined);

        render(
            <DeleteConfirmModal
                isOpen={true}
                onClose={onClose}
                onDeleteForMe={onDeleteForMe}
                onDeleteForEveryone={jest.fn().mockResolvedValue(undefined)}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Delete for me/i }));

        expect(onDeleteForMe).toHaveBeenCalledTimes(1);
        await act(async () => {
            await Promise.resolve();
        });
        await act(async () => {
            jest.advanceTimersByTime(600);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('handles delete for everyone flow and auto closes', async () => {
        const onClose = jest.fn();
        const onDeleteForEveryone = jest.fn().mockResolvedValue(undefined);

        render(
            <DeleteConfirmModal
                isOpen={true}
                onClose={onClose}
                onDeleteForMe={jest.fn().mockResolvedValue(undefined)}
                onDeleteForEveryone={onDeleteForEveryone}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Delete for everyone/i }));

        expect(onDeleteForEveryone).toHaveBeenCalledTimes(1);
        await act(async () => {
            await Promise.resolve();
        });
        await act(async () => {
            jest.advanceTimersByTime(600);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('shows loading indicator while deleting', async () => {
        const onDeleteForMe = jest.fn().mockImplementation(
            () => new Promise<void>(() => { })
        );

        render(
            <DeleteConfirmModal
                isOpen={true}
                onClose={jest.fn()}
                onDeleteForMe={onDeleteForMe}
                onDeleteForEveryone={jest.fn().mockResolvedValue(undefined)}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Delete for me/i }));
        expect(screen.getByText('⏳')).toBeInTheDocument();
    });
});
