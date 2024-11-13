export const fontLoader = {
  preloadFonts: () => {
    const fonts = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-var-italic.woff2'
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });
  },

  loadFonts: async () => {
    if ('fonts' in document) {
      try {
        await Promise.all([
          (document as any).fonts.load('1em Inter'),
          (document as any).fonts.load('italic 1em Inter')
        ]);
      } catch (error) {
        console.error('Failed to load fonts:', error);
      }
    }
  }
}; 