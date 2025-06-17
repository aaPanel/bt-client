module.exports = {
    type: 'strict', // 加密类型：bytecode | confusion | strict
    // 需要加密的目录，将废弃，用files替代
    directory: [
        'electron'
    ],
    // 替代 directory属性，更强大的文件匹配
    files: [
        'electron/**/*.(js|json)',
        '!electron/config/encrypt.js',
        '!electron/config/nodemon.json',
        '!electron/config/builder.json',
    ],
    fileExt: ['.js'],
    confusionOptions: {
        compact: true, // 将代码压缩为1行        
        stringArray: true, // 删除字符串文本并将其放置在特殊数组中
        stringArrayEncoding: ['rc4'], // 对stringArray编码 'none', 'base64', 'rc4'，增加安全性
        deadCodeInjection: true, // 是否注入死代码，代码体积变大。
    }
};