const { pub } = require("./public.js");
const Sftp = require("./sftp.js");

// 同步数据
class SyncData {

    // 构造方法
    constructor(){
        this.syncTypeAllow = ["sftp","webdav"];
        this.syncConf = pub.C("sync");
        this.sftp = null;
        
    }

    // 同步到sftp
    to_sftp(){
        this.sftp = new Sftp();
        // this.sftp.connect()
        
    }


    // 同步到webdav
    to_webdav(){

    }

    // 开始同步
    start(){
        // 检查配置是否存在
        if (!this.syncConf) {
            return
        }

        // 检查同步类型是否符合预期
        if (!(this.syncConf.type in this.syncTypeAllow)){
            return
        }

        // 调用同步
        if (this.syncConf.type === "sftp"){
            return this.to_sftp()
        }else if(this.syncConf.type === "webdav"){
            return this.to_webdav()
        }

        return
    }


}