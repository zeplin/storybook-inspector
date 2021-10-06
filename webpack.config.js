/* eslint-disable */
const path = require("path");

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
                use: {
                    loader:'babel-loader',
                    options: {
                        "presets": [
                            [ "@babel/preset-env", { "targets": { "node": "current" } } ],
                            "@babel/preset-typescript"
                        ]
                    }
                },
                test: /\.ts$/,
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts'],
    },
    optimization:{
        minimize: false
    },
    devtool: false
};
