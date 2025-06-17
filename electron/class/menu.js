
const { Menu,clipboard,BrowserWindow,BrowserView,dialog } = require('electron');
const Electron = require('ee-core/electron');
const { pub } = require('./public.js');
const Services = require('ee-core/services');
// const isMac = process.platform === 'darwin';
// 右键菜单配置
class ContextMenu {

    constructor(event,params){
        this.event = event;
        this.params = params;
        this.is_fanyi = false;
        this.proxy_id = 0;
    }

    /**
     * @name 打开链接
     * @param {string} url
     * @returns {void}
     */
    open_url(url){
        const mywin = new BrowserWindow({ width: 900, height: 600 });
        mywin.loadURL(url);
    }


    /**
     * @name 用新窗口打开链接
     * @param {string} url
     * @returns {void}
     */
    open_link(url,proxy_id){
        let main = Electron.mainWindow
        let bounds = main.getBounds();
        let width = bounds.width;
        let height = bounds.height;
        let new_win = new BrowserWindow({width:width,height:height});
        
        let window = Services.get('window')
        window.setEvent(new_win,proxy_id);
        window.errorHandle(new_win);
        new_win.loadURL(url);
    }


    /**
     * @name 检查翻译结果是否加载完成
     * @param {BrowserView} mywin 窗口对象
     * @param {Array} words 原文
     * @param {number} num 重试次数
     * @returns {void}
     */
    check_translate(mywin,words,num){
        let that = this;
        num++;
        if(num > 10){
            // 通过对话框弹出翻译结果
            dialog.showErrorBox(Electron.mainWindow, {
                title: pub.lang("翻译结果"),
                content: pub.lang("翻译失败，请重试"),
            });
            return;
        }
        setTimeout(() => {

            mywin.webContents.executeJavaScript('window.document.getElementById("trans-selection").textContent',true).then((res)=>{
                that.is_fanyi = true;
                pub.log("翻译结果: "+res);
                // 销毁窗口
                Electron.mainWindow.removeBrowserView(mywin);
                mywin.webContents.destroy();
                let result = res.split("|||");
                for(var i=0;i<result.length;i++){
                    console.log(words[i] + " => " + result[i]);
                }

                let message = pub.lang("原文")+": \r\n" + words.join("\r\n") + "\r\n\r\n";
                message += pub.lang("译文")+": \r\n" + result.join("\r\n");


                // 通过对话框弹出翻译结果
                dialog.showMessageBox(Electron.mainWindow, {
                    type: 'none',
                    title: pub.lang("翻译结果"),
                    message: message,
                    buttons: [pub.lang("确定")],
                });
            })

            if(!that.is_fanyi){
                that.check_translate(mywin,words,num);
            }
        },1000);
    }



    /**
     * @name 将英文翻译为中文
     * @param {string} word
     * @returns {void}
     */
    translate_to_chinese(word){
        let that = this;
        let words = word.split("\n");
        let contents = words.join("|||");
        let url = "https://fanyi.baidu.com/#en/zh/" + contents;
        let mywin = new BrowserView();
        // 记录置顶的窗口
        let top_win =  Electron.mainWindow.getBrowserView()

        Electron.mainWindow.setBrowserView(mywin);
        
        mywin.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        // 设置为透明窗口
        mywin.setBackgroundColor('#00000000');
        // mywin.hide();

        mywin.webContents.on("did-finish-load", () => {
            that.check_translate(mywin,words,0);
        });
        mywin.webContents.loadURL(url);

        // 将窗口置顶
        if(top_win) Electron.mainWindow.setBrowserView(top_win);
    }


    get_context_menu_panel(proxy_id){
        let that = this;
        let template = [];
        let is_link = false;
        if(proxy_id !== undefined) that.proxy_id = proxy_id;

        if(that.params.selectionText){
            // 是否有选中内容
            if(that.params.selectionText){
                template.push({
                    id:1,
                    label:pub.lang("复制"),
                    role:"copy",
                });


                template.push({
                    id:2,
                    label:pub.lang("剪切"),
                    role:"cut",
                });
            }
        }

        is_link = that.params.linkURL.match(/(http|https):\/\/([\w.]+\/?)\S*/);
        if(is_link){

            // 用新窗口打开链接
            template.push({
                id:4,
                label:pub.lang("用新窗口打开"),
                accelerator: "",
                click: function () {
                    that.open_link(that.params.linkURL,proxy_id);
                }
            });

            // 复制链接
            template.push({
                id:5,
                label:pub.lang("复制链接"),
                accelerator: "",
                click: function () {
                    clipboard.writeText(that.params.linkURL);
                }
            });

        }else{
            let clipboard_text = clipboard.readText();
            if(clipboard_text){
                template.push({
                    id:3,
                    label:pub.lang("粘贴"),
                    role:"paste",
                });
            }

            template.push({
                id:4,
                label:pub.lang("全选"),
                role:"selectAll",
            });
        }

        if(that.params.selectionText){
            // 粘贴选中的内容
            template.push({
                id:5,
                label:pub.lang("粘贴选中内容"),
                accelerator: "",
                click: function () {
                    // 粘贴选中的内容
                    that.event.sender.copy();
                    that.event.sender.paste();
                }
            });

            // 选中内容是否为链接
            is_link = that.params.selectionText.match(/(http|https):\/\/([\w.]+\/?)\S*/);
            if(is_link){
                template.push({
                    id:6,
                    label:pub.lang("打开链接"),
                    accelerator: "",
                    click: function () {
                        // that.open_url(that.params.selectionText);
                        require('electron').shell.openExternal(that.params.selectionText);
                    }
                });
            }

            // 选中内容是否为英文单词
            let is_english = that.params.selectionText.match(/\w+/);
            if(is_english && pub.get_language() == 'zh'){
                template.push({
                    id:7,
                    label:pub.lang("翻译为中文"),
                    accelerator: "",
                    click: function () {
                        // 使用浏览器打开百度翻译
                        that.translate_to_chinese(that.params.selectionText);
                    }
                });
            }

        }else{
            // 刷新
            template.push({
                id:8,
                label:pub.lang("刷新"),
                accelerator: "",
                click: function () {
                    that.event.sender.reload();
                }
            });


            // 刷新缓存
            template.push({
                id:8,
                label:pub.lang("刷新缓存"),
                accelerator: "",
                click: function () {
                    that.event.sender.reloadIgnoringCache();
                }
            });

            // 开发者工具
            template.push({
                id:9,
                label:pub.lang("开发者工具"),
                accelerator: "",
                click: function () {
                    that.event.sender.openDevTools();
                }
            });

            // 检查
            template.push({
                id:10,
                label:pub.lang("检查"),
                accelerator: "",
                click: function () {
                    that.event.sender.inspectElement(that.params.x,that.params.y);
                }
            });
        }

        return Menu.buildFromTemplate(template);
    }

    /**
     * @name 创建右键菜单
     */
    get_context_menu(proxy_id){
        let that = this;
        let template = [];
				if(proxy_id !== undefined) that.proxy_id = proxy_id;

        if(that.params.selectionText){
            // 是否有选中内容
            if(that.params.selectionText){
                template.push({
                    id:1,
                    label:pub.lang("复制"),
                    role:"copy",
                });


                template.push({
                    id:2,
                    label:pub.lang("剪切"),
                    role:"cut",
                });
            }
        }

        let is_link = false;
        

        
        let clipboard_text = clipboard.readText();
        if(clipboard_text){
            template.push({
                id:3,
                label:pub.lang("粘贴"),
                role:"paste",
            });
        }

        template.push({
            id:4,
            label:pub.lang("全选"),
            role:"selectAll",
        });


        if(that.params.selectionText){
            // 粘贴选中的内容
            template.push({
                id:5,
                label:pub.lang("粘贴选中内容"),
                accelerator: "",
                click: function () {
                    // 粘贴选中的内容
                    that.event.sender.copy();
                    that.event.sender.paste();
                }
            });

            // 选中内容是否为链接
            is_link = that.params.selectionText.match(/(http|https):\/\/([\w.]+\/?)\S*/);
            if(is_link){
                template.push({
                    id:6,
                    label:pub.lang("打开链接"),
                    accelerator: "",
                    click: function () {
                        // that.open_url(that.params.selectionText);
                        require('electron').shell.openExternal(that.params.selectionText);
                    }
                });
            }

            // 选中内容是否为英文单词
            let is_english = that.params.selectionText.match(/\w+/);
            // console.log(pub.get_language())
            if(is_english && pub.get_language() == 'zh'){
                template.push({
                    id:7,
                    label:pub.lang("翻译为中文"),
                    accelerator: "",
                    click: function () {
                        // 使用浏览器打开百度翻译
                        that.translate_to_chinese(that.params.selectionText);
                    }
                });
            }
			}
			// 标签右键菜单
			if (global.tab_params) {
				if (global.tab_params.type === 'rightClick') {
					template = []
					const tabKey = global.tab_params.key;
					template.push({
						id: 8,
						label: pub.lang("重新加载"),
						accelerator: "",
						click: function () {
							global.PanelViews[tabKey].webContents.reload();
						}
					});
					template.push({
						id: 9,
						label: pub.lang("复制"),
						accelerator: "",
						click: function () {
							Electron.mainWindow.webContents.send('duplicate-panel', tabKey);
						}
					});
					// 分割线
					template.push({type:'separator'})
					template.push({
						id: 10,
						label: pub.lang("关闭"),
						accelerator: "",
						click: function () {
							Electron.mainWindow.webContents.send('close-panel', tabKey);
						}
					});
				}
			}
			
        return Menu.buildFromTemplate(template);
    }

}

module.exports = { ContextMenu };