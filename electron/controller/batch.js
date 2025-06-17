'use strict';
const { Controller } = require('ee-core');
const Services = require('ee-core/services');
const { pub } = require("../class/public.js");
const fs = require('fs');

class BatchController extends Controller {
    
    constructor(ctx) {
        super(ctx);
    }

    // "/batch/": {
	// 	"get_script_list":       GetScriptList,
	// 	"get_script_info":       GetScriptInfo,
	// 	"create_script":         CreateScript,
	// 	"modify_script":         ModifyScript,
	// 	"remove_script":         RemoveScript,
	// 	"execute_script":        ExecuteScript,
	// 	"get_script_record":     GetScriptRecord,
	// 	"get_script_type_list":  GetScriptTypeList,
	// 	"create_script_type":    CreateScriptType,
	// 	"modify_script_type":    ModifyScriptType,
	// 	"remove_script_type":    RemoveScriptType,
	// 	"get_script_exec_queue": GetScriptExecQueue,
	// 	"get_server_list":       GetServerList,
	// 	"get_crontab_list":      GetCrontabList,
	// 	"get_crontab_info":      GetCrontabInfo,
	// 	"create_crontab":        CreateCrontab,
	// 	"modify_crontab":        ModifyCrontab,
	// 	"remove_crontab":        RemoveCrontab,
	// 	"get_crontab_record":    GetCrontabRecord,
	// 	"execute_crontab":       ExecuteCrontab,
	// },
	// "/config/": {
	// 	"set_user_env": SetUserEnv,
	// },

    // 发送请求到golang服务
    send_to_golang(path,args,callback){
        let port = pub.get_golang_service_port();
        let url = "http://127.0.0.1:" + port +  path;
        pub.HttpPost(url,args,function(data){
            let jsonBody = JSON.parse(data.body);
            callback(jsonBody);
        });
    }


    // 获取脚本列表
    async get_script_list(args, event) {
        this.send_to_golang("/batch/get_script_list",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取脚本信息
    async get_script_info(args, event) {
        this.send_to_golang("/batch/get_script_info",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 创建脚本
    async create_script(args, event) {
        this.send_to_golang("/batch/create_script",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 修改脚本
    async modify_script(args, event) {
        this.send_to_golang("/batch/modify_script",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 删除脚本
    async remove_script(args, event) {
        this.send_to_golang("/batch/remove_script",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 执行脚本
    async execute_script(args, event) {
        this.send_to_golang("/batch/execute_script",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取脚本记录
    async get_script_record(args, event) {
        this.send_to_golang("/batch/get_script_record",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取脚本分类列表
    async get_script_type_list(args, event) {
        this.send_to_golang("/batch/get_script_type_list",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 创建脚本分类
    async create_script_type(args, event) {
        this.send_to_golang("/batch/create_script_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 修改脚本分类
    async modify_script_type(args, event) {
        this.send_to_golang("/batch/modify_script_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 删除脚本分类
    async remove_script_type(args, event) {
        this.send_to_golang("/batch/remove_script_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取脚本执行队列
    async get_script_exec_queue(args, event) {
        this.send_to_golang("/batch/get_script_exec_queue",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取服务器列表
    async get_server_list(args, event) {
        this.send_to_golang("/batch/get_server_list",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取定时任务列表
    async get_crontab_list(args, event) {
        this.send_to_golang("/batch/get_crontab_list",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取定时任务信息
    async get_crontab_info(args, event) {
        this.send_to_golang("/batch/get_crontab_info",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 创建定时任务
    async create_crontab(args, event) {
        this.send_to_golang("/batch/create_crontab",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 修改定时任务
    async modify_crontab(args, event) {
        this.send_to_golang("/batch/modify_crontab",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 删除定时任务
    async remove_crontab(args, event) {
        this.send_to_golang("/batch/remove_crontab",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取定时任务记录
    async get_crontab_record(args, event) {
        this.send_to_golang("/batch/get_crontab_record",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 执行定时任务
    async execute_crontab(args, event) {
        this.send_to_golang("/batch/execute_crontab",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取软件分类
    async get_soft_type(args, event) {
        this.send_to_golang("/batch/get_soft_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 创建软件分类
    async create_soft_type(args, event) {
        this.send_to_golang("/batch/create_soft_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 修改软件分类
    async modify_soft_type(args, event) {
        this.send_to_golang("/batch/modify_soft_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 删除软件分类
    async remove_soft_type(args, event) {
        this.send_to_golang("/batch/remove_soft_type",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取软件列表
    async get_soft_list(args, event) {
        this.send_to_golang("/batch/get_soft_list",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 创建软件
    async create_soft(args, event) {
        this.send_to_golang("/batch/create_soft",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 修改软件
    async modify_soft(args, event) {
        this.send_to_golang("/batch/modify_soft",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 删除软件
    async remove_soft(args, event) {
        this.send_to_golang("/batch/remove_soft",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取软件安装记录
    async get_soft_install_record(args, event) {
        this.send_to_golang("/batch/get_soft_install_record",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 执行软件安装
    async execute_soft_install(args, event) {
        this.send_to_golang("/batch/execute_soft_install",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 获取软件安装队列
    async get_soft_install_queue(args, event) {
        this.send_to_golang("/batch/get_soft_install_queue",args.data,function(data){
            return pub.send(event,args.channel,data);
        });
    }

    // 通用文件选择器
    async file_selector(args, event) {
        dialog.showOpenDialog(Electron.mainWindow, {
            title: pub.lang('请选择文件'),
        }).then(result => {
            if (!result.canceled) {
                let path = result.filePaths[0];
                return pub.send(event,args.channel,pub.returnData(true,'文件选择成功',path));
            }
            return pub.send(event,args.channel,pub.returnData(false,'用户取消选择文件'));
          }
        );
    }
}


BatchController.toString = () => '[class BatchController]';
module.exports = BatchController;
