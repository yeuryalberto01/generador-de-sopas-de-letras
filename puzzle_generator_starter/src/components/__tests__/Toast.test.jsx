import { fireEvent, render, screen } from '@testing-library/react'
import Toast from '../Toast'

describe('Toast', () => {
  test('renders with success type by default', () => {
    render(<Toast message="Test message" />)
    
    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  test('renders with error type', () => {
    render(<Toast message="Error message" type="error" />)
    
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn()

    render(<Toast message="Test message" onClose={mockOnClose} />)

    fireEvent.click(screen.getByLabelText('Cerrar notificación'))

    // Wait for the animation timeout
    await new Promise(resolve => setTimeout(resolve, 350))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when toast is clicked', async () => {
    const mockOnClose = jest.fn()

    render(<Toast message="Test message" onClose={mockOnClose} />)

    fireEvent.click(screen.getByRole('alert'))

    // Wait for the animation timeout
    await new Promise(resolve => setTimeout(resolve, 350))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})