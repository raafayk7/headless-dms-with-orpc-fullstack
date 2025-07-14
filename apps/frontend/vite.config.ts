import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react-oxc"
import { defineConfig } from "vite"
import Inspect from "vite-plugin-inspect"
import tsConfigPaths from "vite-tsconfig-paths"

const cssTransformer = "lightningcss" as const

export default defineConfig(() => {
  return {
    // Native plugins mess with css for now
    // experimental: { enableNativePlugin: true },

    css: { transformer: cssTransformer }, // might cause issues for postcss specific stuff
    build: { cssMinify: cssTransformer },
    dev: {},
    // oxc: {},
    plugins: [
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      viteReact({}),
      tanstackStart({
        tsr: { target: "react" },
        react: { disableOxcRecommendation: false },
        sitemap: { enabled: false },
        customViteReactPlugin: true,

        // target: "bun", // doesn't play well with mantine yet
      }),
      Inspect({
        dev: false,
        build: true,
        embedded: false,
        exclude: [/node_modules/],
      }),
    ],
  }
})
