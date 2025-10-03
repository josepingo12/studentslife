import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.61925b169de3496bab3037d71c46caaf',
  appName: 'Students Life',
  webDir: 'dist',
  server: {
    url: 'https://61925b16-9de3-496b-ab30-37d71c46caaf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      ios: {
        photoLibraryUsageDescription: 'Students Life needs access to your photo library to upload images.',
        cameraUsageDescription: 'Students Life needs camera access to take photos.',
        saveToGallery: true
      },
      android: {
        permissions: {
          camera: true,
          photos: true
        }
      }
    }
  }
};

export default config;
