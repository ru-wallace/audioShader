import { defineConfig } from 'vite';
import { configDotenv } from 'dotenv';
configDotenv()

export default defineConfig({
    
    base: process.env.BASE_URL || '/audioshader/',
    root: process.env.BUILD_ROOT || './www',
    outDir: './dist',


        
    server: {
        port: parseInt(process.env.PORT) || 3000, // Set in .env file
        host: (process.env.HOST ==='true' || process.env.host ==='0.0.0.0') || 'localhost', // Set to 'true' in .env file to listen to all addresses
    }
});