import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        sourcemap: true,
        rollupOptions: {
            onwarn: function (warning, warn) {
                if (warning.code === 'THIS_IS_UNDEFINED')
                    return;
                warn(warning);
            }
        }
    }
});
