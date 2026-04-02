import { render, screen, fireEvent } from '@testing-library/react';
import ContextMenu from '../../../app/(auth)/dashboard/host/messages/ContextMenu';

const defaultProps = {
    isOpen: true,
    x: 100,
    y: 100,
    isOwnMessage: true,
    onClose: jest.fn(),
    onCopy: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
};

describe('Host ContextMenu', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns null when closed', () => {
        const { container } = render(
            <ContextMenu {...defaultProps} isOpen={false} />
        );
        expect(container.firstChild).toBeNull();
    });

    test('renders own-message actions', () => {
        render(<ContextMenu {...defaultProps} isOwnMessage={true} />);
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    test('renders non-owner actions without Edit', () => {
        render(<ContextMenu {...defaultProps} isOwnMessage={false} />);
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    test('calls copy and close when Copy clicked', () => {
        render(<ContextMenu {...defaultProps} />);
        fireEvent.click(screen.getByText('Copy'));
        expect(defaultProps.onCopy).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('closes on Escape key', () => {
        render(<ContextMenu {...defaultProps} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('closes on backdrop click', () => {
        const { container } = render(<ContextMenu {...defaultProps} />);
        const backdrop = container.querySelector('.fixed.inset-0.z-40');
        expect(backdrop).toBeInTheDocument();
        fireEvent.click(backdrop as HTMLElement);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
});
