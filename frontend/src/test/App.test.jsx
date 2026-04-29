import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    loading: false
  })
}));

// Mock the ProtectedRoute
vi.mock('../components/Auth/ProtectedRoute', () => ({
  default: ({ children }) => children
}));

// Mock the Layout component
vi.mock('../components/Layout/Layout', () => ({
  default: () => <div data-testid="layout">Layout</div>
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
  });

  it('redirects to login for unknown routes', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Should navigate to login page for unknown routes
    expect(window.location.pathname).toBe('/login');
  });
});
