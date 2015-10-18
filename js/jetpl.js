/**
 * jetpl.js 极致性能的 JS 模板引擎
 * Github：https://github.com/singod/jetpl/
 * 作者：陈国军  
 * 邮箱：arts1986@126.com
 *jetpl(tpl).render(data,fun)
 * @param tpl {String}    模板字符串
 * @param data {Object}   模板数据
 * @param fun {Function}  返回渲染结果
 *
 */
!function(win) {
    "use strict";
    var config = {
        openTag:"<%",
        closeTag:"%>"
    };
    var tool = {
        exp:function(str) {
            return new RegExp(str, "g");
        },
        error:function(e, tlog) {
            var error = "jetpl Error: ";
            typeof console === "object" && console.error(error + e + "\n" + (tlog || ""));
            return error + e;
        }
    };
    var exps = tool.exp, tpm = function(tpl) {
        this.tpl = tpl;
    };
    //核心引擎
    var tmpl = function(tpl) {
        var tagvar = exps(config.openTag + "=(.*?)" + config.closeTag), taglog = exps(config.openTag + "(.*?)" + config.closeTag);
        var tmps = "var tp=[];" + 'with("k"||{}){tp.push(\'' + tpl.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
        .replace(tagvar, function(match, code) {
            return "'," + code.replace(/\\'/, "'") + ",'";
        }).replace(taglog, function(match, code) {
            return "');" + code.replace(/\\'/, "'").replace(/[\r\n\t]/g, " ") + "tp.push('";
        }).replace(/[\r\t\n]/g, " ") + '\');}return tp.join("");';
        return tmps;
    };
    tpm.prototype.temp = function(tpl, data) {
        var fn = function(d) {
            var i, k = [], v = [];
            for (i in d) {
                k.push(i);
                v.push(d[i]);
            }
            return new Function(k, tmpl(tpl)).apply(d, v);
        };
        try {
            return fn(data);
        } catch (e) {
            return tool.error(e, tpl);
        }
    };
    tpm.prototype.compile = function() {
        var that = this;
        var run = function(d, f) {
            run.tps = run.tps || new Function(tmpl(that.tpl));
            return run.tps.apply(d);
        };
        return run;
    };
    tpm.prototype.render = function(data, fun) {
        var that = this, html;
        if (!data) return tool.error("no data");
        html = that.temp(that.tpl, data);
        if (!fun) return html;
        fun(html);
    };
    var jetpl = function(tpl) {
        if (typeof tpl !== "string") return tool.error("Template not found");
        return new tpm(tpl);
    };
    jetpl.config = function(opts) {
        opts = opts || {};
        for (var i in opts) {
            config[i] = opts[i];
        }
    };
    "function" == typeof define ? define(function() {
        return jetpl;
    }) :"undefined" != typeof exports ? module.exports = jetpl :window.jetpl = jetpl;
}();
