// const Services = require('ee-core/services');
const Sftp = require("./sftp.js");
global.cpu_times = {}
global.network = {}
global.diskio = {}

class System {
    constructor() {
        this.sftp = new Sftp();
    }

    disconnect() {
        this.sftp.disconnect();
    }

    /**
     * @name 连接SFTP
     * @param {object} options {
     *      host:主机地址
     *      port:端口
     *      username:用户名
     *      password:密码
     *      privateKey:私钥
     *      passphrase:私钥密码
     * } 连接参数
     * @param {Function} callback(err)
     */
    connect(options,callback) {
        if(!options.privateKey && options.private_key){
            options.privateKey = options.private_key;
        }
        this.sftp.connect(options, function (res, err) {
            if(callback){
                if (err) {
                    return callback(err);
                }
                return callback(null);
            }

            console.log(err);
        });
    }



    /**
     * @name 获取系统负载
     * @return {object} (load_avg)=>{
     *      one:1分钟负载
     *      five:5分钟负载
     *      fifteen:15分钟负载
     *      process:{
     *          total:进程总数
     *          running:运行进程数
     *          last_pid:最后一个进程ID
     *      }
     * }
     */
    getLoadAvg() {
        let self = this;
        // let start_time = new Date().getTime();
        return new Promise((resolve, reject) => {
            self.sftp.read_file("/proc/loadavg", function (res, err) {
                let load_avg = {
                    one: 0,
                    five: 0,
                    fifteen: 0,
                    process: {
                        total: 0,
                        running: 0,
                        last_pid: 0
                    }
                }
                if (err) {
                    return resolve(load_avg);
                }
                let loadavg = res.split(' ')
                if (loadavg.length >= 4) {
                    load_avg.one = Number(loadavg[0]);
                    load_avg.five = Number(loadavg[1]);
                    load_avg.fifteen = Number(loadavg[2]);
                    let process = loadavg[3].split('/');
                    if (process.length >= 2) {
                        load_avg.process.total = Number(process[1]);
                        load_avg.process.running = Number(process[0]);
                        load_avg.process.last_pid = Number(loadavg[4]);
                    }
                }

                // let end_time = new Date().getTime();
                // console.log("getLoadAvg-0",end_time - start_time);
                return resolve(load_avg);

            });
        });
    }

    /**
     * @name 获取系统内存使用情况
     * @return {object} (meminfo)=>{
     *      total:总内存
     *      free:空闲内存
     *      used:已使用内存
     *      buffers:缓冲区
     *      cached:缓存
     *      slab:内核数据结构缓存
     *      shmem:共享内存
     *      sreclaimable:可收回内存
     *      swap:{
     *          swap_total:交换区总量
     *          swap_free:空闲交换区
     *          swap_used:已使用交换区
     *      },
     *      available: {
     *          used:真实内存使用大小
     *          free:真实内存空闲大小
     *          percent:真实内存使用百分比
     *      }
     * }
     */
    getMemInfo() {
        let self = this;
        // let start_time = new Date().getTime();
        return new Promise((resolve, reject) => {
            self.sftp.read_file("/proc/meminfo", function (res, err) {
                let meminfo = {
                    total: 0,
                    free: 0,
                    used: 0,
                    buffers: 0,
                    cached: 0,
                    slab: 0,
                    shmem: 0,
                    sreclaimable: 0,
                    swap: {
                        swap_total: 0,
                        swap_free: 0,
                        swap_used: 0
                    },
                    available: {
                        used: 0,
                        free: 0,
                        percent: 0
                    }
                }
                if (err) {
                    return resolve(meminfo);
                }
                let mem = res.split('\n');
                for (let i = 0; i < mem.length; i++) {
                    let item = mem[i].split(':');
                    if (item.length >= 2) {
                        let key = item[0].trim();
                        let value = item[1].trim().split(' ')[0];
                        if (key == 'MemTotal') {
                            meminfo.total = Number(value) * 1024;
                        } else if (key == 'MemFree') {
                            meminfo.free = Number(value) * 1024;
                        } else if (key == 'Buffers') {
                            meminfo.buffers = Number(value) * 1024;
                        } else if (key == 'Cached') {
                            meminfo.cached = Number(value) * 1024;
                        } else if (key == 'SwapTotal') {
                            meminfo.swap.swap_total = Number(value) * 1024;
                        } else if (key == 'SwapFree') {
                            meminfo.swap.swap_free = Number(value) * 1024;
                        } else if (key == 'Slab') {
                            meminfo.slab = Number(value) * 1024;
                        }else if (key == 'Shmem') {
                            meminfo.shmem = Number(value) * 1024;
                        }else if (key == 'SReclaimable') {
                            meminfo.sreclaimable = Number(value) * 1024;
                        }
                    }
                }
                meminfo.used = meminfo.total - meminfo.free;
                meminfo.swap.swap_used = meminfo.swap.swap_total - meminfo.swap.swap_free;
                meminfo.available = {}
                meminfo.available.used = meminfo.total - meminfo.free - meminfo.buffers - (meminfo.cached + meminfo.sreclaimable - meminfo.shmem);
                meminfo.available.free = meminfo.total - meminfo.available.used;
                meminfo.available.percent = (meminfo.available.used / meminfo.total * 100).toFixed(2);
                // let end_time = new Date().getTime();
                // console.log("getMemInfo-0",end_time - start_time);

                // console.log("meminfo",meminfo);
                return resolve(meminfo);
            });
        });
    }

    /**
     * @name 获取运行时长
     * @return {number} 运行时长(天)
     * @example getBootTime((boot_time)=>{console.log(boot_time)})
     */
    getBootTime(){
        let self = this;
        // let start_time = new Date().getTime();
        
        return new Promise((resolve, reject) => {
            if(self.day !== undefined){
                return resolve(self.day);
            }
            self.sftp.read_file("/proc/uptime", function (res, err) {
                let boot_time = 0;
                if (err) {
                    return resolve(boot_time);
                }
                let uptime = res.split(' ')[0];
                boot_time = Number(uptime);

                // 转换为多少天
                let day = Math.floor(boot_time / 86400);
                // let end_time = new Date().getTime();
                // console.log("getBootTime-0",end_time - start_time);
                self.day = day;
                return resolve(day);
            });
        });
    }


    _getCpuInfo(callback){
        let self = this;
        if(self.cpuinfo){
            return callback(self.cpuinfo);
        }
        self.sftp.read_file("/proc/cpuinfo", function (res, err) {
            let cpuinfo = {
                model: '',
                cores: 0,
                percent: 0.00
            }
            if (err) {
                return callback(cpuinfo);
            }
            let cpu = res.split('\n');
            for (let i = 0; i < cpu.length; i++) {
                let item = cpu[i].split(':');
                if (item.length >= 2) {
                    let key = item[0].trim();
                    let value = item[1].trim();
                    if (key == 'model name') {
                        cpuinfo.model = value;
                    } else if (key == 'processor') {
                        cpuinfo.cores += 1;
                    }
                }
            }

            self.cpuinfo = cpuinfo;
            return callback(cpuinfo);
        });

    }

    // user, nice, system, idle, iowait, irq, softirq, steal, guest, guest_nice
    /**
     * @name 获取CPU信息
     * @return {object} (cpuinfo)=>{
     *      model:CPU型号
     *      cores:CPU核心数
     *      cpu_times:{
     *          user:用户态
     *          nice:低优先级用户态
     *          system:系统态
     *          idle:空闲态
     *          iowait:IO等待
     *          irq:硬中断
     *          softirq:软中断
     *          steal:虚拟化
     *          guest:guest
     *          guest_nice:guest_nice
     *      }
     *      percent:CPU使用率
     * }
     * @example getCpuInfo((cpuinfo)=>{console.log(cpuinfo)})
     */
    getCpuInfo(){
        let self = this;
        // let start_time = new Date().getTime();
        return new Promise((resolve, reject) => {
            self._getCpuInfo(function (res) {
                let cpuinfo = res;
                const CLOCK_TICKS = 100;
                let  cpu_times = {
                    user: 0,
                    nice: 0,
                    system: 0,
                    idle: 0,
                    iowait: 0,
                    irq: 0,
                    softirq: 0,
                    steal: 0,
                    guest: 0,
                    guest_nice: 0,
                    last_time: 0
                }

                // let end_time_1 = new Date().getTime();
                // console.log("getCpuInfo-1",end_time_1 - start_time);
                // 获取CPU使用率(所有核心)
                self.sftp.read_file("/proc/stat", function (res, err) {
                    // let end_time_2 = new Date().getTime();
                    // console.log("getCpuInfo-2",end_time_2 - start_time);
                    if (err) {
                        return resolve(cpuinfo);
                    }
                    let cpustat = res.split('\n');

                    for (let i = 0; i < cpustat.length; i++) {
                        let item = cpustat[i].split(" ");
                        if (item[0] == 'cpu') {
                            cpu_times['user'] += Number(item[2]) / CLOCK_TICKS;
                            cpu_times['nice'] += Number(item[3]) / CLOCK_TICKS;
                            cpu_times['system'] += Number(item[4]) / CLOCK_TICKS;
                            cpu_times['idle'] += Number(item[5]) / CLOCK_TICKS;
                            cpu_times['iowait'] += Number(item[6]) / CLOCK_TICKS;
                            cpu_times['irq'] += Number(item[7]) / CLOCK_TICKS;
                            cpu_times['softirq'] += Number(item[8]) / CLOCK_TICKS;
                            cpu_times['steal'] += Number(item[9]) / CLOCK_TICKS;
                            cpu_times['guest'] += Number(item[10]) / CLOCK_TICKS;
                            cpu_times['guest_nice'] += Number(item[11]) / CLOCK_TICKS;
                        }
                    }

                    cpu_times.last_time = new Date().getTime() / 1000;
                    cpuinfo.cpu_times = cpu_times;

                    

                    if(global.cpu_times){
                        let cpu_used_time = cpu_times.user + cpu_times.nice + cpu_times.system  + cpu_times.iowait + cpu_times.irq + cpu_times.softirq + cpu_times.steal + cpu_times.guest + cpu_times.guest_nice;
                        let old_cpu_used_time = global.cpu_times.user + global.cpu_times.nice + global.cpu_times.system  + global.cpu_times.iowait + global.cpu_times.irq + global.cpu_times.softirq + global.cpu_times.steal + global.cpu_times.guest + global.cpu_times.guest_nice;
                        let jg_time = cpu_times.last_time - global.cpu_times.last_time;

                        let percent = Number(((cpu_used_time - old_cpu_used_time) / jg_time / cpuinfo.cores * 100.00).toFixed(2));
                        if(isNaN(percent) || percent < 0){
                            percent = 0.00;
                        }
                        if (percent > 100) {
                            percent = 100.00;
                        }
                        global.cpu_times = cpu_times;
                        cpuinfo.percent = percent;
                    }
                    // let end_time = new Date().getTime();
                    // console.log("getCpuInfo-0",end_time - start_time);
                    return resolve(cpuinfo);
                });
                
            });
        });
    }

    /**
     * @name 获取网络信息
     * @return {object} (netinfo)=>{
     *     send_bytes:发送字节数
     *     recv_bytes:接收字节数
     *     send_packets:发送包数
     *     recv_packets:接收包数
     *     sec_send_bytes:每秒发送字节数
     *     sec_recv_bytes:每秒接收字节数
     * }
     */
    getNetWork(){
        let self = this;
        // let start_time = new Date().getTime();
        return new Promise((resolve, reject) => {
            let netinfo = {
                send_bytes: 0,
                recv_bytes: 0,
                send_packets: 0,
                recv_packets: 0,
                sec_send_bytes: 0,
                sec_recv_bytes: 0,
                last_time: parseInt(new Date().getTime() / 1000)
            }

            // 读取网络信息
            self.sftp.read_file("/proc/net/dev", function (res, err) {
                if (err) {
                    return resolve(netinfo);
                }
                let net = res.split('\n');
                for (let i = 2; i < net.length; i++) {
                    let item = net[i].split(':');
                    if (item.length >= 2) {
                        let key = item[0].trim();
                        if(key in ['lo']) continue;  // 排除回环设备
                        let line = item[1].trim()
                        line = line.replace(/\s+/g, " ");
                        let value = line.split(' ');

                        netinfo.send_bytes += Number(value[0]);
                        netinfo.send_packets += Number(value[1]);
                        netinfo.recv_bytes += Number(value[8]);
                        netinfo.recv_packets += Number(value[9]);
                    }
                }
                
                // 计算每秒发送和接收字节数
                if(global.network.last_time && global.network.send_bytes){
                    let jg_time = netinfo.last_time - global.network.last_time;
                    netinfo.sec_send_bytes = parseInt((netinfo.send_bytes - global.network.send_bytes) / jg_time);
                    if(netinfo.sec_send_bytes < 0 || isNaN(netinfo.sec_send_bytes)) netinfo.sec_send_bytes = 0;
                    netinfo.sec_recv_bytes = parseInt((netinfo.recv_bytes - global.network.recv_bytes) / jg_time);
                    if(netinfo.sec_recv_bytes < 0 || isNaN(netinfo.sec_recv_bytes)) netinfo.sec_recv_bytes = 0;
                }

                // 更新全局变量
                global.network = netinfo;
                // let end_time = new Date().getTime();
                // console.log("getNetWork-0",end_time - start_time);
                return resolve(netinfo);
            });
        });

    }



    /**
     * @name 获取磁盘IO信息
     * @return {object} diskio {
     *      read_bytes:读取字节数
     *      read_successfully: 读取成功次数
     *      read_merged:读取合并次数
     *      sec_read_merged:每秒读取合并次数
     *      read_sectors:读取扇区数
     *      read_time:读操作花费的毫秒数
     *      write_bytes:写入字节数
     *      write_successfully:写入成功次数
     *      write_merged:写入合并次数
     *      write_sectors:写入扇区数
     *      write_time:写入操作花费的毫秒数
     *      io_currently:当前进行的IO操作数
     *      time_spent_doing_io:花费在IO操作上的时间
     *      weighted_time_spent_doing_io:加权花费在IO操作上的时间
     *      io_latency:IO延迟
     *      sec_read_bytes:每秒读取字节数
     *      sec_write_bytes:每秒写入字节数
     *      iops:每秒IO操作数
     * }
     */
    getDiskIo(){
        let self = this;
        // // let start_time = new Date().getTime();
        return new Promise((resolve, reject) => {
            // 通过读取/proc/diskstats获取磁盘IO信息
            let diskio = {
                read_bytes:0,
                read_successfully:0,
                read_merged:0,
                read_sectors:0,
                read_time:0,
                write_bytes:0,
                write_successfully:0,
                write_merged:0,
                write_sectors:0,
                write_time:0,
                io_currently:0,
                time_spent_doing_io:0,
                weighted_time_spent_doing_io:0,
                sec_read_bytes:0,
                sec_write_bytes:0,
                sec_read_merged:0,
                io_latency:0,
                iops:0,
                last_time: parseInt(new Date().getTime() / 1000)
            }

            // 读取磁盘IO信息
            self.sftp.read_file("/proc/diskstats", function (res, err) {
                if (err) {
                    return resolve(diskio);
                }
                let disk = res.split('\n');
                for (let i = 0; i < disk.length; i++) {
                    let line = disk[i].trim().replace(/\s+/g, " ");
                    let item = line.split(' ');
                    if (item.length >= 14) {
                        diskio.read_successfully += Number(item[3]);
                        diskio.read_merged += Number(item[4]);
                        diskio.read_sectors += Number(item[5]);
                        diskio.read_time += Number(item[6]);
                        diskio.write_successfully += Number(item[7]);
                        diskio.write_merged += Number(item[8]);
                        diskio.write_sectors += Number(item[9]);
                        diskio.write_time += Number(item[10]);
                        diskio.io_currently += Number(item[11]);
                        diskio.time_spent_doing_io += Number(item[12]);
                        diskio.weighted_time_spent_doing_io += Number(item[13]);
                    }
                }

                // 计算读取和写入字节数
                diskio.read_bytes = diskio.read_sectors * 512;
                diskio.write_bytes = diskio.write_sectors * 512;
                

                // 计算每秒读取和写入字节数
                if(global.diskio.last_time && global.diskio.read_successfully){
                    let jg_time = diskio.last_time - global.diskio.last_time;
                    diskio.sec_read_bytes = parseInt((diskio.read_bytes - global.diskio.read_bytes) / jg_time);
                    if(diskio.sec_read_bytes < 0 || isNaN(disk.sec_read_bytes)) diskio.sec_read_bytes = 0;
                    diskio.sec_write_bytes = parseInt((diskio.write_bytes - global.diskio.write_bytes) / jg_time);
                    if(diskio.sec_write_bytes < 0 || isNaN(diskio.sec_write_bytes)) diskio.sec_write_bytes = 0;
                    diskio.iops = parseInt(((diskio.read_successfully + diskio.write_successfully) - (global.diskio.read_successfully + global.diskio.write_successfully)) / jg_time);
                    if(diskio.iops < 0 || isNaN(diskio.iops) || diskio.iops > 5000) diskio.iops = 0;
                    diskio.sec_read_merged = parseInt((diskio.read_merged - global.diskio.read_merged) / jg_time);
                    if(diskio.sec_read_merged < 0) diskio.sec_read_merged = 0;
                    diskio.io_latency = parseInt((diskio.time_spent_doing_io - global.diskio.time_spent_doing_io) / jg_time);
                    if(diskio.io_latency < 0 || isNaN(diskio.io_latency)) diskio.io_latency = 0;
                }

                // 更新全局变量
                global.diskio = diskio;
                // // let end_time = new Date().getTime();
                // // console.log("getDiskIo-0",end_time - start_time);
                return resolve(diskio);

            });
        });
    }


    /**
     * @name 获取操作系统信息
     * @param osinfo=>{
     *     release:操作系统版本
     *     arch:操作系统架构
     *}
     */
    getOsInfo(){
        let self = this;
        // let start_time = new Date().getTime();
        return new Promise((resolve, reject) => {
            if(self.osinfo){
                return resolve(self.osinfo);
            }
            let osinfo = {
                release:'Linux',
                arch:'x86_64',
            }
            self.sftp.stat("/etc/os-release", function (res, err) {
                if (err) {
                    self.sftp.read_file("/etc/issue",function(res,err){
                        if(err){
                            return resolve(osinfo);
                        }
                        osinfo.release = res.split('\n')[0];
                        osinfo.arch = 'x86_64';
                        self.osinfo = osinfo;
                        return resolve(osinfo);
                    });
                }else{
                    self.sftp.read_file("/etc/os-release", function (res, err) {
                        if (err) {
                            return resolve(osinfo);
                        }
                        let os = res.split('\n');
                        for (let i = 0; i < os.length; i++) {
                            let item = os[i].split('=');
                            if (item.length >= 2) {
                                let key = item[0].trim();
                                let value = item[1].trim().replace(/"/g, '');
                                if (key == 'PRETTY_NAME') {
                                    osinfo.release = value;
                                }
                            }
                        }

                        // 获取操作系统架构
                        self.sftp.read_file("/proc/sys/kernel/osrelease",function(res,err){
                            if(err){
                                osinfo.arch = 'x86_64';
                            }else{
                                if(res.indexOf('x86_64') > -1){
                                    osinfo.arch = 'x86_64';
                                }else if(res.indexOf('i686') > -1){
                                    osinfo.arch = 'x86';
                                }else if(res.indexOf('arm') > -1){
                                    osinfo.arch = 'arm';
                                }else if(res.indexOf('aarch64') > -1){
                                    osinfo.arch = 'aarch64';
                                }else if(res.indexOf('amd64') > -1){
                                    osinfo.arch = 'x86_64';
                                }else if(res.indexOf('aarch') > -1){
                                    osinfo.arch = 'aarch';
                                }else if(res.indexOf('loongarch64') > -1){
                                    osinfo.arch = 'loongarch64';
                                }else if(res.indexOf('mips64') > -1){
                                    osinfo.arch = 'mips64';
                                }else if(res.indexOf('ppc64') > -1){
                                    osinfo.arch = 'ppc64';
                                }else if(res.indexOf('riscv64') > -1){
                                    osinfo.arch = 'riscv64';
                                }else if(res.indexOf('s390x') > -1){
                                    osinfo.arch = 's390x';
                                }else if(res.indexOf('sparc64') > -1){
                                    osinfo.arch = 'sparc64';
                                }else if(res.indexOf('x86') > -1){
                                    osinfo.arch = 'x86';
                                }else if(res.indexOf('mips') > -1){
                                    osinfo.arch = 'mips';
                                }else{
                                    osinfo.arch = 'x86_64';
                                }
                            }
                            self.osinfo = osinfo;
                            return resolve(osinfo);
                        });
                    });
                }
            });
        });
    }

    /**
     * @name 获取系统所有信息 -- 自动连接
     * @param {Function} callback(sysinfo)
     */
    getAll(options,callback){
        let self = this;
        self.connect(options,(err)=>{
            if(err){
                return;
            }
            self.getAllNoConnect((sysinfo)=>{
                self.disconnect();
                return callback(sysinfo);
            });
        });
    }

    /**
     * @name 获取系统所有信息 -- 需提前连接
     * @param {Function} callback(sysinfo)
     */
    getAllNoConnect(callback){
        let self = this;
        // let start_time = new Date().getTime();
        Promise.all([self.getLoadAvg(),self.getBootTime(),self.getCpuInfo(),self.getDiskIo(),self.getMemInfo(),self.getNetWork(),self.getOsInfo()])
        .then((load_avg)=>{
            let result = {
                load_avg:load_avg[0],
                boot_time:load_avg[1],
                cpu_ionfo:load_avg[2],
                diskio:load_avg[3],
                meminfo:load_avg[4],
                network:load_avg[5],
                os_info:load_avg[6]
            }
            // let end_time = new Date().getTime();
            // console.log("getAllNoConnect-0",end_time - start_time);
            return callback(result);
        })
    }

    /**
     * @name 获取系统所有信息 -- 自动推送给前端
     * @param event 事件名称
     * @param channel 通道名称
     */
    getAllPush(event,channel,sid){
        let self = this;
        self.getAllNoConnect((sysinfo)=>{
            sysinfo.sid = sid;
            event.sender.send(channel,sysinfo);
        });
    }

}

    
module.exports = System;