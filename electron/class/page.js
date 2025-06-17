// 分页类

class Page {
    constructor() {
        this.__PREV = '上一页';
        this.__NEXT = '下一页';
        this.__START = '首页';
        this.__END = '尾页';
        this.__COUNT_START = '共';
        this.__COUNT_END = '条';
        this.__FO = '从';
        this.__LINE = '条';
        this.__LIST_NUM = 4;
        this.SHIFT = null;
        this.ROW = null;
        this.__C_PAGE = null;
        this.__COUNT_PAGE = null;
        this.__COUNT_ROW = null;
        this.__URI = null;
        this.__RTURN_JS = false;
        this.__START_NUM = null;
        this.__END_NUM = null;
    }

    /**
     * @name 取分页信息
     * @param {object} pageInfo 传入分页参数字典
     * @param {string} limit 返回系列
     * @returns {string}
     */
    GetPage(pageInfo, limit) {
        if(!limit){
            limit = '1,2,3,4,5,6,7,8';
        }
        this.__RTURN_JS = pageInfo['return_js'];
        this.__COUNT_ROW = pageInfo['count'];
        this.ROW = pageInfo['row'];
        this.__C_PAGE = this.__GetCpage(pageInfo['p']);
        this.__START_NUM = this.__StartRow();
        this.__END_NUM = this.__EndRow();
        this.__COUNT_PAGE = this.__GetCountPage();
        this.__URI = this.__SetUri(pageInfo['uri']);
        this.SHIFT = this.__START_NUM - 1;
        let keys = limit.split(',');
        let pages = {};
        pages['1'] = this.__GetStart();
        pages['2'] = this.__GetPrev();
        pages['3'] = this.__GetPages();
        pages['4'] = this.__GetNext();
        pages['5'] = this.__GetEnd();
        pages['6'] = "<span class='Pnumber'>" + this.__C_PAGE + "/" + this.__COUNT_PAGE + "</span>";
        pages['7'] = "<span class='Pline'>" + this.__FO + this.__START_NUM + "-" + this.__END_NUM + this.__LINE + "</span>";
        pages['8'] = "<span class='Pcount'>" + this.__COUNT_START + this.__COUNT_ROW + this.__COUNT_END + "</span>";
        let retuls = '<div>';
        for (let value of keys) {
            retuls += pages[value];
        }
        retuls += '</div>';
        return retuls;
    }

    /**
     * @name 取分页信息
     * @param {number} count 总行数
     * @param {number} row 每页显示行数
     * @param {number} p 当前页
     * @return {object}
     */
    page(count, row, p,callback) {
        if(!callback){
            callback = '';
        }
        if(!p){
            p = 1;
        }
        if(!row){
            row = 10;
        }

        let page_str = this.GetPage({
            count: count,
            row: row,
            p: p,
            uri: '',
            return_js: callback
        });

        let result = {
            page: page_str,
            shift: this.SHIFT,
            row: this.ROW,
            count: count
        };
        return result;
        
    }

    /**
     * @name 构造尾页
     * @returns {string}
     */
    __GetEnd() {
        let endStr = "";
        if (this.__C_PAGE >= this.__COUNT_PAGE) {
            endStr = '';
        } else {
            if (this.__RTURN_JS == "") {
                endStr = "<a class='Pend' href='" + this.__URI + "p=" + this.__COUNT_PAGE + "'>" + this.__END + "</a>";
            } else {
                endStr = "<a class='Pend' onclick='" + this.__RTURN_JS + "(" + this.__COUNT_PAGE + ")'>" + this.__END + "</a>";
            }
        }
        return endStr;
    }

    /**
     * @name 构造下一页
     * @returns {string}
     */
    __GetNext() {
        let nextStr = "";
        if (this.__C_PAGE >= this.__COUNT_PAGE) {
            nextStr = '';
        } else {
            if (this.__RTURN_JS == "") {
                nextStr = "<a class='Pnext' href='" + this.__URI + "p=" + (this.__C_PAGE + 1) + "'>" + this.__NEXT + "</a>";
            } else {
                nextStr = "<a class='Pnext' onclick='" + this.__RTURN_JS + "(" + (this.__C_PAGE + 1) + ")'>" + this.__NEXT + "</a>";
            }
        }
        return nextStr;
    }

    /**
     * @name 构造分页
     * @returns {string}
     */
    __GetPages() {
        let pages = '';
        let num = 0;
        if ((this.__COUNT_PAGE - this.__C_PAGE) < this.__LIST_NUM) {
            num = this.__LIST_NUM + (this.__LIST_NUM - (this.__COUNT_PAGE - this.__C_PAGE));
        } else {
            num = this.__LIST_NUM;
        }
        let n = 0;
        for (let i = 0; i < num; i++) {
            n = num - i;
            let page = this.__C_PAGE - n;
            if (page > 0) {
                if (this.__RTURN_JS == "") {
                    pages += "<a class='Pnum' href='" + this.__URI + "p=" + page + "'>" + page + "</a>";
                } else {
                    pages += "<a class='Pnum' onclick='" + this.__RTURN_JS + "(" + page + ")'>" + page + "</a>";
                }
            }
        }
        if (this.__C_PAGE > 0) {
            pages += "<span class='Pcurrent'>" + this.__C_PAGE + "</span>";
        }
        if (this.__C_PAGE <= this.__LIST_NUM) {
            num = this.__LIST_NUM + (this.__LIST_NUM - this.__C_PAGE) + 1;
        } else {
            num = this.__LIST_NUM;
        }
        for (let i = 0; i < num; i++) {
            if (i == 0) {
                continue;
            }
            let page = this.__C_PAGE + i;
            if (page > this.__COUNT_PAGE) {
                break;
            }
            if (this.__RTURN_JS == "") {
                pages += "<a class='Pnum' href='" + this.__URI + "p=" + page + "'>" + page + "</a>";
            } else {
                pages += "<a class='Pnum' onclick='" + this.__RTURN_JS + "(" + page + ")'>" + page + "</a>";
            }
        }
        return pages;
    }

    /**
     * @name 构造上一页
     * @returns {string}
     */
    __GetPrev() {
        let startStr = '';
        if (this.__C_PAGE == 1) {
            startStr = '';
        } else {
            if (this.__RTURN_JS == "") {
                startStr = "<a class='Ppren' href='" + this.__URI + "p=" + (this.__C_PAGE - 1) + "'>" + this.__PREV + "</a>";
            } else {
                startStr = "<a class='Ppren' onclick='" + this.__RTURN_JS + "(" + (this.__C_PAGE - 1) + ")'>" + this.__PREV + "</a>";
            }
        }
        return startStr;
    }

    /**
     * @name 构造起始分页
     * @returns {string}
     */
    __GetStart() {
        let startStr = '';
        if (this.__C_PAGE == 1) {
            startStr = '';
        } else {
            if (this.__RTURN_JS == "") {
                startStr = "<a class='Pstart' href='" + this.__URI + "p=1'>" + this.__START + "</a>";
            } else {
                startStr = "<a class='Pstart' onclick='" + this.__RTURN_JS + "(1)'>" + this.__START + "</a>";
            }
        }
        return startStr;
    }

    /**
     * @name 取当前页
     * @param {number} p
     * @returns {number}
     */
    __GetCpage(p) {
        if (p) {
            return p;
        }
        return 1;
    }

    /**
     * @name 从多少行开始
     * @returns {number}
     */
    __StartRow() {
        return (this.__C_PAGE - 1) * this.ROW + 1;
    }

    /**
     * @name 从多少行结束
     * @returns {number}
     */
    __EndRow() {
        if (this.ROW > this.__COUNT_ROW) {
            return this.__COUNT_ROW;
        }
        return this.__C_PAGE * this.ROW;
    }

    /**
     * @name 取总页数
     * @returns {number}
     */
    __GetCountPage() {
        return Math.ceil(this.__COUNT_ROW / this.ROW);
    }

    /**
     * @name 构造URI
     * @param {string} request_uri
     * @returns {string}
     */
    __SetUri(request_uri) {
        try {
            request_uri = request_uri.replace(/&p=\d+/, '&');
            request_uri = request_uri.replace(/\?p=\d+/, '?');
            if (request_uri.indexOf('&') == -1) {
                if (request_uri[request_uri.length - 1] != '?') request_uri += '?';
            } else {
                if (request_uri[request_uri.length - 1] != '&') request_uri += '&';
            }
            return request_uri;
        } catch {
            return '';
        }
    }
}


// 声明模块
module.exports = { Page };