import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../Layout';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { AppProvider } from '../../context/AppContext';

// Mock del Sidebar para evitar problemas en las pruebas
jest.mock('../../../Sidebar', () => ({
  Sidebar: ({ open, _onToggle }) => (
    <div data-testid="sidebar" data-open={open}>
      Sidebar Mock - Open: {open ? 'true' : 'false'}
    </div>
  ),
}));

const renderLayout = () =>
  render(
    <BrowserRouter>
      <AppProvider>
        <AccessibilityProvider>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </AccessibilityProvider>
      </AppProvider>
    </BrowserRouter>
  );

describe('Layout Component', () => {
  test('renders the menu button', () => {
    renderLayout();
    const button = screen.getByLabelText('Abrir menú');
    expect(button).toBeInTheDocument();
  });

  test('toggles sidebar open state when menu button is clicked', () => {
    renderLayout();
    const button = screen.getByLabelText('Abrir menú');
    const sidebar = screen.getByTestId('sidebar');

    // Initially closed
    expect(sidebar).toHaveAttribute('data-open', 'false');

    // Click to open
    fireEvent.click(button);
    expect(sidebar).toHaveAttribute('data-open', 'true');

    // Click to close
    fireEvent.click(button);
    expect(sidebar).toHaveAttribute('data-open', 'false');
  });

  test('renders children content', () => {
    renderLayout();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});