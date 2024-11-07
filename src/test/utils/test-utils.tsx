import { render } from '@testing-library/react';
import { FirebaseProvider } from '@/lib/firebase/FirebaseContext';
import { SpotifyProvider } from '@/lib/spotify/SpotifyContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <FirebaseProvider>
      <SpotifyProvider>
        {children}
      </SpotifyProvider>
    </FirebaseProvider>
  );
};

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render }; 