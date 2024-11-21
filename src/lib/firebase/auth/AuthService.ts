export class AuthService {
  constructor(
    private readonly auth = getAuth(),
    private readonly db = getFirestore(),
    private readonly analyticsService: AnalyticsService
  ) {}

  async setupAuth(): Promise<void> {
    // Configure auth providers
    const providers = {
      email: new EmailAuthProvider(),
      google: new GoogleAuthProvider(),
      spotify: new OAuthProvider('spotify.com')
    };

    // Configure persistence
    await this.auth.setPersistence(browserLocalPersistence);

    // Set up auth state observer
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.handleSignIn(user);
      } else {
        this.handleSignOut();
      }
    });
  }

  async signInWithProvider(
    providerName: 'email' | 'google' | 'spotify',
    credentials?: { email: string; password: string }
  ): Promise<UserCredential> {
    try {
      let result: UserCredential;

      if (providerName === 'email' && credentials) {
        result = await signInWithEmailAndPassword(
          this.auth,
          credentials.email,
          credentials.password
        );
      } else {
        const provider = this.getProvider(providerName);
        result = await signInWithPopup(this.auth, provider);
      }

      await this.setupUserProfile(result.user);
      
      this.analyticsService.trackEvent('user_signed_in', {
        provider: providerName,
        userId: result.user.uid
      });

      return result;
    } catch (error) {
      this.analyticsService.trackError('sign_in_failed', error);
      throw error;
    }
  }

  private async setupUserProfile(user: User): Promise<void> {
    const userRef = doc(this.db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        role: 'attendee' // Default role
      });
    }
  }

  async setUserRole(userId: string, role: 'dj' | 'attendee'): Promise<void> {
    const userRef = doc(this.db, 'users', userId);
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });

    // Update custom claims
    await this.setCustomClaims(userId, { role });
  }

  private async handleTokenRefresh(user: User): Promise<void> {
    try {
      const currentToken = await user.getIdToken();
      const decodedToken = await user.getIdTokenResult();
      
      // Check if token needs refresh (5 minutes before expiry)
      if (Date.now() > (decodedToken.expirationTime as any) - 300000) {
        await user.getIdToken(true); // Force refresh
      }
    } catch (error) {
      // Handle token refresh failure
      await this.handleAuthError(error);
    }
  }
} 