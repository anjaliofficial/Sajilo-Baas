import { render, screen, act } from '@testing-library/react';
import Toast from '../../../app/(auth)/dashboard/host/messages/Toast';

describe('Host Toast', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('does not render when message is empty', () => {
        const { container } = render(<Toast message="" onClose={jest.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    test('renders message text', () => {
        render(<Toast message="Saved successfully" onClose={jest.fn()} />);
        expect(screen.getByText(/Saved successfully/i)).toBeInTheDocument();
    });

    test('applies success style', () => {
        render(<Toast message="ok" type="success" onClose={jest.fn()} />);
        expect(screen.getByText('ok').className).toContain('bg-green-500');
    });

    test('applies error style', () => {
        render(<Toast message="err" type="error" onClose={jest.fn()} />);
        expect(screen.getByText('err').className).toContain('bg-red-500');
    });

    test('calls onClose after duration', () => {
        const onClose = jest.fn();
        render(<Toast message="auto close" onClose={onClose} duration={1500} />);

        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('uses info style by default', () => {
        render(<Toast message="info" onClose={jest.fn()} />);
        expect(screen.getByText('info').className).toContain('bg-blue-500');
    });
});
