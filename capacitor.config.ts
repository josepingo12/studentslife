import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.61925b169de3496bab3037d71c46caaf',
  appName: 'Students Life',
  webDir: 'dist',
  server: {
    url: 'https://studentslife.es?forceHideBadge=true',
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
