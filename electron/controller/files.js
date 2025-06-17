'use strict';
const { Controller } = require('ee-core');
const { pub } = require("../class/public.js");
const System = require('../class/system.js');

class FilesController extends Controller {

    constructor(ctx) {
        super(ctx);
    }


    /**
     * @name 连接
     * @param {object} args {
     *    channel: string - 通道
     *    data: object - 数据 {
     *      ssh_id: number - SSH ID
     *    }
     * }
     * @param {*} event 
     */
    async connect(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        if (global.SftpItems[ssh_id]) {
            return pub.send_success_msg(event, channel, pub.lang('SFTP已连接'));
        }
        let ssh_info = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
        if (!ssh_info) {
            return pub.send_error(event, channel, pub.lang('SSH信息不存在'));
        }

        global.SftpItems[ssh_id] = new System();
        global.SftpItems[ssh_id].connect(ssh_info, function (err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success_msg(event, channel, pub.lang('连接成功'));
        });
    }

    list_dir_src(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let path = args.data.path;
        global.SftpItems[ssh_id].sftp.list_dir(path, function(res,err){
            if(err){
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }


    /**
     * @name 获取文件列表
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          path: string - 路径
     *     }
     * }
     * @param {*} event 
     */
    async list_dir(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let self = this;
        if (!global.SftpItems[ssh_id] || !global.SftpItems[ssh_id].sftp || !global.SftpItems[ssh_id].sftp.conn) {
            let ssh_info = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
            if (!ssh_info) {
                return pub.send_error(event, channel, pub.lang('SSH信息不存在'));
            }

            global.SftpItems[ssh_id] = new System();
            global.SftpItems[ssh_id].connect(ssh_info, function (err) {
                if (err) {
                    return pub.send_error_msg(event, channel, err);
                }

                self.list_dir_src(args, event);
            });
        }else{
            self.list_dir_src(args, event);
        }

    }

    /**
     * @name 上传文件
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          localPath: string - 本地路径
     *          remotePath: string - 远程路径
     *      }
     * }
     * @param {*} event 
     */
    async upload(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let localPath = args.data.localPath;
        let remotePath = args.data.remotePath;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.upload(localPath, remotePath, function (res, err) {
            if (err) {
                return pub.send_error(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }


    /**
     * @name 下载文件
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          remotePath: string - 远程路径
     *          localPath: string - 本地路径
     *      }
     * }
     * @param {*} event 
     */
    async download(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let remotePath = args.data.remotePath;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.download(remotePath, function (res, err) {
            if (err) {
                return pub.send_error(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }

    /**
     * @name 断开连接
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *        ssh_id: number - SSH ID
     *      }
     * }
     * @param {*} event 
     */
    async disconnect(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        if (global.SftpItems[ssh_id]) {
            global.SftpItems[ssh_id].disconnect();
            delete global.SftpItems[ssh_id];
        }
        return pub.send_success_msg(event, channel, pub.lang('连接已断开'));
    }


    /**
     * @name 重命名文件或目录
     * @param {object} args {
     *     channel: string - 通道
     *     data: object - 数据 {
     *        ssh_id: number - SSH ID
     *        oldPath: string - 旧路径
     *        newPath: string - 新路径
     *    }
     * }
     * @param {*} event
     */
    async rename(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let oldPath = args.data.oldPath;
        let newPath = args.data.newPath;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.rename(oldPath, newPath, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success_msg(event, channel, res);
        });
    }


    /**
     * @name 删除文件
     * @param {object} args {
     *     channel: string - 通道
     *     data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *      }
     * }
     * @param {*} event
     */
    async remove(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let filename = args.data.filename;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.remove(filename, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success_msg(event, channel, res);
        });
    }

    /**
     * @name 创建文件
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *      }
     * }
     * @param {*} event
     */
    async touch(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let filename = args.data.filename;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.touch(filename, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success_msg(event, channel, res);
        });
    }

    /**
     * @name 删除目录
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          path: string - 路径
     *      }
     * } 
     * @param {*} event 
     * @returns 
     */
    async rmdir(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let path = args.data.path;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.rmdir(path, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success_msg(event, channel, res);
        });
    }

    /**
     * @name 创建目录
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          path: string - 路径
     *      }
     * }
     * @param {*} event 
     */
    async mkdir(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let path = args.data.path;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.mkdir(path, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success_msg(event, channel, res);
        });
    }

    /**
     * @name 获取文件信息
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *    }
     * }
     * @param {*} event 
     */
    async stat(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let filename = args.data.filename;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.stat(filename, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }

    /**
     * @name 获取文件内容
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *      }
     * }
     * @param {*} event 
     */
    async read_file(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let filename = args.data.filename;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.read_file(filename, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }

    /**
     * @name 写入文件
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *          data: string - 内容
     *      }
     * }
     * @param {*} event 
     */
    async write_file(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let filename = args.data.filename;
        let data = args.data.data;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.write_file(filename, data, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }

    /**
     * @name 获取用户和组列表
     * @param {object} args {
     *      channel: string - 通道
     *      data: object - 数据 {
     *         ssh_id: number - SSH ID
     *     }
     * }
     * @param {*} event 
     */
    async get_user_group(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.get_user_group(function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }

    /**
     * @name 修改文件权限
     * @param {object} args {
     *     channel: string - 通道
     *     data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *          mode: string - 权限
     *   }
     * }
     * @param {*} event 
     */
    async chmod(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        let filename = args.data.filename;
        let mode = args.data.mode;
        let gid = args.data.gid;
        let uid = args.data.uid;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.chmod(filename, mode, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }

            if (uid !== undefined && gid !== undefined) {
                global.SftpItems[ssh_id].sftp.chown(filename, uid, gid, function (res, err) {
                    if (err) {
                        return pub.send_error_msg(event, channel, err);
                    }
                    return pub.send_success(event, channel, res);
                });
            }
            return pub.send_success(event, channel, res);
        });
    }


    /**
     * @name 修改文件所有者
     * @param {object} args {
     *     channel: string - 通道
     *     data: object - 数据 {
     *          ssh_id: number - SSH ID
     *          filename: string - 路径
     *          uid: int - 用户ID
     *          gid: int - 组ID
     *   }
     * }
     * @param {*} event 
     */
    async chown(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id
        let filename = args.data.filename;
        let uid = args.data.uid;
        let gid = args.data.gid;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        global.SftpItems[ssh_id].sftp.chown(filename, uid, gid, function (res, err) {
            if (err) {
                return pub.send_error_msg(event, channel, err);
            }
            return pub.send_success(event, channel, res);
        });
    }


    /**
     * @name 获取下载队列
     * @param {object} args {
     *    channel: string - 通道
     *   data: object - 数据 {
     *     ssh_id: number - SSH ID
     *  }
     */
    async get_download_items(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        return pub.send_success(event, channel, global.SftpItems[ssh_id].sftp.get_download_items());
    }

    /**
     * @name 获取上传队列
     * @param {object} args {
     *    channel: string - 通道
     *    data: object - 数据 {
     *      ssh_id: number - SSH ID
     *    }
     */
    async get_upload_items(args, event) {
        let channel = args.channel;
        let ssh_id = args.data.ssh_id;
        if (!global.SftpItems[ssh_id]) {
            return pub.send_error(event, channel, pub.lang('SFTP未连接'));
        }
        return pub.send_success(event, channel, global.SftpItems[ssh_id].sftp.get_upload_items());
    }

    /**
     * @name 获取SFTP连接列表
     * @param {object} args {
     *   channel: string - 通道
     * }
     * @param {*} event
     */
    async get_sftp_items(args, event) {
        return pub.send_success(event, args.channel, Object.keys(global.SftpItems));
    }

    /**
     * @name 使用系统资源管理器打开本地目录
     * @param {object} args {
     *   channel: string - 通道
     *   data: object - 数据 {
     *      filename: string - 文件全路径
     *   }
     * }
     * @param {*} event
     * @returns {object} 返回结果
     */
    async os_open_folder(args, event) {
        let channel = args.channel;
        let filename = args.data.filename;
        require('electron').shell.showItemInFolder(filename);
        return pub.send_success_msg(event, channel, pub.lang('已打开'));
    }

    /**
     * @name 使用系统资源管理器打开本地文件
     * @param {object} args {
     *   channel: string - 通道
     *   data: object - 数据 {
     *      filename: string - 文件全路径
     *   }
     * }
     * @param {*} event
     * @returns {object} 返回结果
     */
    async os_open_file(args, event) {
        let channel = args.channel;
        let filename = args.data.filename;
        require('electron').shell.openPath(filename);
        return pub.send_success_msg(event, channel, pub.lang('已打开'));
		}
	
		/**
		 * @name 开启面板api接口
		 */
	async start_panel_api(args, event) { 
		let channel = args.channel;
		let ssh_id = args.data.ssh_id;
		let ssh_info = args.data.ssh_info;
		global.SftpItems[ssh_id] = new System();
		global.SftpItems[ssh_id].connect(ssh_info, function (err) {
			global.SftpItems[ssh_id].sftp.start_panel_api(function (res, err) {
				if (err) {
					return pub.send_error_msg(event, channel, err);
				}
				return pub.send_success(event, channel,res );
			})
		});
	}
}

FilesController.toString = () => '[class FilesController]';
module.exports = FilesController;  