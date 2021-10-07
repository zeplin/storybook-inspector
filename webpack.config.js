/* eslint-disable */
const path = require("path");
const nodeExternals = require('webpack-node-externals');

const externals = (
  process.env.INCLUDE_NODE_MODULES?.toLowerCase() === "true"
    ? undefined
    : [nodeExternals()]
);

module.exports = {
    mode: "production",
    entry: {
        index: "./src/index.ts"
    },
    output: {
        globalObject: "this",
        path: path.join(__dirname, "dist"),
        filename: "index.js",
        library: {
            type: 'umd'
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    externals,
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    devtool: false
};
