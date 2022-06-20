'use strict';
const path = require('path');
const fs = require('fs');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = [
    Object.assign(
        {
            entry: {
                app_main: './src/app_main.js',                
            },
            output: {
                filename: '[name]_bundle.js',
                path: path.resolve(__dirname, 'client/js'),
                publicPath: '/js'
            },
            devServer: {
                contentBase: path.resolve(__dirname, 'client/'),
                inline: true,
                hot: true,
                //host: 'localhost',
                allowedHosts: ['localhost', 'home.localhost.com'],
                port: 3826,
                proxy: {
                    '/': {
                        target: 'http://localhost:3827',
                        bypass: function(req) {
                            if (req.path.indexOf('/lib/') > -1) {
                                return;
                            }

                            // 키움쪽 CSS Proxy설정
                            if (req.path.indexOf('.css') > -1 && req.path.indexOf('/kw/css/') > -1) {
                                return req.path.replace('/kw/css/', '/css/');
                            }

                            if (
                                req.path &&
                                ((req.path.indexOf('.js') > -1 && req.path.indexOf('commoninfo.js') === -1) ||
                                    req.path.indexOf('.html') > -1 ||
                                    req.path.indexOf('.css') > -1 ||
                                    req.path.indexOf('/img/') > -1)
                                // || req.path.indexOf('/lib/') > -1
                            ) {
                                return req.path;
                            }
                            // server proxy..
                            //console.log('req.headers.accept', req.path);
                        }
                    }
                }
            }
        },
        getDefaultSetting()
    ),
    Object.assign(
        {
            entry: {
                app_admin: './src/app_admin.js'
            },
            output: {
                //filename: '[chunkhash].[name]_bundle.js',
                filename: '[name]_bundle.js',
                path: path.resolve(__dirname, 'client/admin/core')
            }
        },
        getDefaultSetting()
    ),
    lessSettings()
];

function getDefaultSetting() {
    return {
        mode: 'development',
        bail: true,
        devtool: 'cheap-module-eval-source-map', //개발시 에러날때 소스 위치 표시
        performance: {
            maxEntrypointSize: 1024 * 1024 * 1024,
            maxAssetSize: 1024 * 1024 * 1024
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader'
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        modules: 'commonjs',
                                        targets: ['defaults', 'ie >= 8'],
                                        loose: true // IE8 Option
                                        //debug: true,
                                        //useBuiltIns: 'usage',
                                    }
                                ]
                            ]
                        }
                    }
                },
                {
                    test: /\.html$/,
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                attrs: [':data-src'],
                                minimize: true
                            }
                        }
                    ]
                }
            ]
        },
        optimization: {
            minimizer: [
                new UglifyJsPlugin({
                    sourceMap: true,
                    uglifyOptions: {
                        warnings: false,
                        parse: {},
                        compress: {},
                        mangle: false, // 변수명 변경.
                        output: null,
                        toplevel: false,
                        nameCache: null,
                        ie8: true,
                        keep_fnames: false
                    }
                })
            ]
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src/')
            }
        }
    };
}

function lessSettings() {
    const files = fs.readdirSync(path.join(__dirname, './src/less'));
    //console.log(files);

    const entry = files.reduce((master, file) => {
        if (file.indexOf('.less') === -1) {
            return master;
        }
        master[file.replace('.less', '')] = `./src/less/${file}`;
        return master;
    }, {});

    return {
        mode: 'development',
        bail: true,
        devtool: 'inline-source-map', //개발시 에러날때 소스 위치 표시

        entry: entry,
        output: {
            //filename: '[name]_bundle.js',
            path: path.resolve(__dirname, 'client/css'),
            publicPath: '/css'
        },
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                url: false,
                                sourceMap: false
                            }
                        },
                        {
                            loader: 'less-loader',
                            options: {
                                strictMath: true,
                                noIeCompat: true,
                                javascriptEnabled: true
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: './[name].css'
            }),
            new OptimizeCssAssetsPlugin({
                //assetNameRegExp: /\.optimize\.css$/g,
                cssProcessor: require('cssnano'),
                cssProcessorPluginOptions: {
                    preset: ['default', { discardComments: { removeAll: true } }]
                },
                canPrint: true
            })
        ]
    };
}
