import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
appId: 'es.studentslife.app', // <--- IMPORTANTE: Deve essere così
appName: 'Students Life',
webDir: 'dist',
// server: { // <--- IMPORTANTE: Questa sezione deve essere commentata o rimossa
//   url: 'https://61925b16-9de3-496b-ab30-37d71c46caaf.lovableproject.com?forceHideBadge=true',
//   cleartext: true
// },
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
