import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import autoprefixer from 'autoprefixer'
import { consola } from 'consola'
import { readFileSync } from 'node:fs'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'path'
import postcssPresetMantine from 'postcss-preset-mantine'
import { build } from 'vite'
import { shadowStyle } from 'vite-plugin-shadow-style'
import { amIExecuted } from './_utils'

export async function buildReact(_isDev = false) {
  const root = resolve('app/react')
  const outDir = resolve('react')
  consola.start(`Bundling React components...`)
  consola.info(`root: ${root}`)
  consola.info(`outDir: ${outDir}`)

  const outputFilename = 'index.mjs'

  const tsconfig = resolve('app/react/tsconfig.dts-bundle.json')

  // Static website
  await build({
    root,
    configFile: false,
    resolve: {
      alias: {
        '@likec4/core': resolve('../core/src'),
        '@likec4/diagram': resolve('../diagram/src'),
        'react-dom/server': resolve('app/react/react-dom-server-mock.ts')
      }
    },
    clearScreen: false,
    mode: 'production',
    define: {
      __USE_STYLE_BUNDLE__: 'true',
      __USE_HASH_HISTORY__: 'false',
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      jsxDev: false,
      legalComments: 'none',
      minifyIdentifiers: false,
      minifyWhitespace: true,
      minifySyntax: true,
      tsconfigRaw: readFileSync(tsconfig, { encoding: 'utf-8' })
    },
    build: {
      outDir,
      emptyOutDir: false,
      cssCodeSplit: false,
      cssMinify: true,
      minify: true,
      sourcemap: false,
      copyPublicDir: false,
      chunkSizeWarningLimit: 2000,
      lib: {
        entry: 'components/index.ts',
        name: 'index',
        fileName(_format, _entryName) {
          return outputFilename
        },
        formats: ['es']
      },
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        requireReturnsDefault: 'auto',
        extensions: ['.js', '.mjs'],
        transformMixedEsModules: true,
        ignoreTryCatch: 'remove'
      },
      rollupOptions: {
        treeshake: {
          preset: 'safest'
        },
        output: {
          compact: true,
          esModule: true,
          exports: 'named'
        },
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom/client',
          'likec4/react',
          '@emotion/is-prop-valid' // dev-only import from framer-motion
        ],
        plugins: [
          shadowStyle()
        ]
      }
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          postcssPresetMantine()
        ]
      }
    },
    plugins: [
      react(),
      vanillaExtractPlugin({
        identifiers: 'short'
      })
    ]
  })
  const outputFilepath = resolve(outDir, outputFilename)

  let bundledJs = await readFile(outputFilepath, 'utf-8')
  if (bundledJs.includes('@emotion/is-prop-valid')) {
    throw new Error(
      `${outputFilepath} should not import "@emotion/is-prop-valid"`
    )
  }

  const likec4outDir = resolve('dist/__app__/react')
  await mkdir(likec4outDir, { recursive: true })
  await copyFile('app/react/likec4.tsx', resolve(likec4outDir, 'likec4.tsx'))
}

if (amIExecuted(import.meta.filename)) {
  consola.info('Running as script')
  await buildReact()
}
