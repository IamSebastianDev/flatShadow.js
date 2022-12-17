/** @format */

import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import cleanup from 'rollup-plugin-cleanup';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import pkg from '../package.json' assert { type: 'json' };

/**
 * Temporary workaround for a bug currently present in @rollup/plugin-terser
 * See the associated issue here: https://github.com/rollup/plugins/issues/1366
 */

import { fileURLToPath } from 'url';
Object.defineProperty(global, '__filename', {
    get() {
        return fileURLToPath(import.meta.url);
    },
});

const bundle = (config) => ({
    input: './src/index.ts',
    external: (id) => !/^[./]/.test(id),
    ...config,
});

export default [
    bundle({
        plugins: [commonjs(), resolve(), esbuild(), cleanup({ extensions: ['ts'] })],
        output: [
            {
                file: pkg.main,
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: pkg.module,
                format: 'es',
                sourcemap: true,
            },
            // minified browser package for distribution via CDN
            {
                file: pkg.unpkg,
                format: 'iife',
                sourcemap: true,
                name: 'FlatShadow',
                plugins: [terser()],
            },
        ],
    }),
    bundle({
        output: {
            file: pkg.types,
            format: 'es',
        },
        plugins: [resolve(), commonjs(), cleanup({ extensions: ['.ts'] }), dts()],
    }),
];
