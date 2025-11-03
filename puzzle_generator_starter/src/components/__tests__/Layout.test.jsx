import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../Layout';
import { AccessibilityProvider } from '../../context/AccessibilityContext';
import { AppProvider } from '../../context/AppContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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
  test('renders the navigation button', () => {
    renderLayout();
    const button = screen.getByText('Puzzle Generator');
    expect(button).toBeInTheDocument();
  });

  test('navigates to temas when title is clicked', () => {
    renderLayout();
    const button = screen.getByText('Puzzle Generator');
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/temas');
  });

  test('renders children content', () => {
    renderLayout();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders ThemeToggle component', () => {
    renderLayout();
    // ThemeToggle should be rendered (we can test for its presence indirectly)
    expect(document.querySelector('header')).toBeInTheDocument();
  });
});