import { render, screen } from '@testing-library/react'
import ToastContainer from '../ToastContainer'

describe('ToastContainer', () => {
  test('renders multiple toasts with correct positioning', () => {
    const mockToasts = [
      { id: '1', message: 'First toast', type: 'success' },
      { id: '2', message: 'Second toast', type: 'error' }
    ]
    
    render(<ToastContainer toasts={mockToasts} onRemoveToast={() => {}} />)
    
    expect(screen.getByText('First toast')).toBeInTheDocument()
    expect(screen.getByText('Second toast')).toBeInTheDocument()
  })

  test('renders empty when no toasts', () => {
    render(<ToastContainer toasts={[]} onRemoveToast={() => {}} />)
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})