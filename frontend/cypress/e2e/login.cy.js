describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('h1').should('contain', 'Login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('input[type="email"]').should('have.class', 'border-red-500');
  });

  it('should show validation error for invalid email', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.get('[data-testid="error-message"]').should('contain', 'Valid email');
  });

  it('should toggle password visibility', () => {
    cy.get('input[type="password"]').type('password123');
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('input[type="text"]').should('have.value', 'password123');
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('input[type="password"]').should('have.value', 'password123');
  });

  it('should handle login API error', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Invalid credentials' }
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });
});
