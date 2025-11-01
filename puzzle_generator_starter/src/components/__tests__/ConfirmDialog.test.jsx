import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  test('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Message')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Test Title"
        message="Test Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  test('calls onConfirm when confirm button is clicked', () => {
    const mockOnConfirm = jest.fn()
    
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={mockOnConfirm}
        onCancel={() => {}}
      />
    )
    
    fireEvent.click(screen.getByText('Confirmar'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  test('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn()
    
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test Message"
        onConfirm={() => {}}
        onCancel={mockOnCancel}
      />
    )
    
    fireEvent.click(screen.getByText('Cancelar'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})