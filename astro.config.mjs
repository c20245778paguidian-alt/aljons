// @ts-check
import { defineConfig, envField } from 'astro/config';

import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  env: {
        schema: {
            RESEND_API_KEY: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
            CONTACT_TO_EMAIL: envField.string({
                context: "server",
                access: "secret",
                optional: true,
            }),
        },
    },
});