import { encrypt, decrypt } from '@/lib/crypto';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'spotify_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'spotify_refresh_token';
  private static readonly EXPIRY_KEY = 'spotify_token_expiry';
  
  static storeTokens(tokens: StoredTokens): void {
    try {
      const encryptedAccess = encrypt(tokens.accessToken);
      const encryptedRefresh = encrypt(tokens.refreshToken);
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccess);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefresh);
      localStorage.setItem(this.EXPIRY_KEY, tokens.expiresAt.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Token storage failed');
    }
  }

  static getTokens(): StoredTokens | null {
    try {
      const encryptedAccess = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const encryptedRefresh = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const expiryStr = localStorage.getItem(this.EXPIRY_KEY);

      if (!encryptedAccess || !encryptedRefresh || !expiryStr) {
        return null;
      }

      return {
        accessToken: decrypt(encryptedAccess),
        refreshToken: decrypt(encryptedRefresh),
        expiresAt: parseInt(expiryStr, 10)
      };
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
  }

  static isTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    return Date.now() < tokens.expiresAt;
  }
} 