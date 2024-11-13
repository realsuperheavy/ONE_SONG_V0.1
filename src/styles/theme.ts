export const theme = {
  colors: {
    primary: '#F49620',
    primaryHover: '#FF7200',
    inactive: '#3E2E1B',
    background: {
      start: '#1E1E1E',
      end: '#2E2F2E'
    },
    success: '#4CAF50',
    error: '#FF4D4D',
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)'
    }
  },
  spacing: {
    header: '60px',
    sidebar: '280px',
    gutter: '24px',
    padding: {
      card: '16px',
      container: '24px'
    }
  },
  typography: {
    heading: {
      h1: '48px',
      h2: '32px',
      h3: '24px',
      h4: '20px',
      lineHeight: 1.2
    },
    body: {
      base: '16px',
      small: '14px',
      lineHeight: 1.5
    }
  },
  animation: {
    duration: {
      fast: '200ms',
      base: '300ms',
      slow: '500ms'
    },
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px'
  },
  shadows: {
    card: '0 4px 6px rgba(0, 0, 0, 0.1)',
    modal: '0 10px 25px rgba(0, 0, 0, 0.2)'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px'
  }
}; 