/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<
  import('../worker-configuration.d.ts').Env
>

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      email: string;
      name?: string;
    };
  }
}
