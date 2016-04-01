/*

 @Name：jetpl v1.0 JS模板引擎
 @Author：陈国军
 @Date：2016-2-25
 @QQ群：516754269
 @官网：http://www.jayui.com/jetpl/  或　 https://github.com/singod/jetpl　
        
*/
(function (window, undefined) {
    var cache = {}, recompile = true, tpid = 1,
	// 默认模板标签配置
    config = {
		startTag: "<%", // 模板起始标签
		endTag: "%>" // 模板闭合标签
	},
    tool = {
        exp:function(str) {
            return new RegExp(str, "g");
        },
        error:function(e, tlog) {
            var error = "jetpl ";
            typeof console === "object" && console.error(error + e + "\n" + (tlog || ""));
            return error + e;
        }
    },
	exps = tool.exp, cores = function (tpl) {
        var that = this;
        that.tpl = tpl;
        that.compiler();
        cache[tpl] = that;
    },
    jextend = function(opt, source, override) {
		if (override === undefined) override = true;
		for (var p in source) {
			if (override || !(p in opt)) opt[p] = source[p];
		}
		return opt;
	};
    
    // js语句转换
    var syntax = cores.prototype.syntax = {
        "#": function (str) { // js 语句
            return "';" + str + ";outStr+='";
        },
        "@": function (str) { // 循环语法
            if ("" === str)  return "';}outStr+='";

            var sm = str.match(/\s*([\w."'\][]+)\s*(\w+)\s*(\w+)?/), sid = tpid++;
            if (sm) {
                var index = sm[3] || ("idx" + sid), // 索引
                    value = sm[2] || ("avl" + sid), // 值
                    lens = "len" + sid, arrs = "arr" + sid;

                str = "';var " + arrs + "=" + sm[1] + "," + index + "=-1," + lens + "=" + arrs + ".length-1," + value + 
                      ";while(" + index + "<" + lens + "){" + value + "=" + arrs + "[" + index + "+=1];outStr+='";
            }
            return str;
        }
    };

    // 生成模板引擎函数，并返回模板函数
    cores.prototype.compiler = function () {
        var that = this, tmpl = that.tpl,
		tagPlace = exps(config.startTag + "([#=@]|)([\\s\\S]*?|)" + config.endTag);
		// 通过替换解析成字符串
        var tplview = "var outStr='';outStr+=' " + (tmpl.replace(/[\r\n\t]/g, "").replace(/\\/g, '\\\\'))
            .replace(tagPlace, function (em, type, code) {
                code = code.replace(/^\s+|\s+$/g, "").replace(/\\('|\\)/g, "$1");
                // 不处理 
                if (type === "" && code === "") return em;
                // 语法解析
                if (syntax.hasOwnProperty(type)) { 
                    return syntax[type].call(that, code);
                }

                return "'+(" + code.replace(/\\/g, '') + ")+'";
            }) + "';return outStr;";

		var fnc = !/\W/.test(tmpl) ?  cache[tmpl] = cache[tmpl] || that.compiler() : 
			function(dt) {
				var i, variable = [], value = [];
				for (i in dt) {
					variable.push(i);
					value.push(dt[i]);
				}
				return new Function(variable, tplview).apply(dt, value);
			};
		var tplfn = that.render = function (data,fun) {
			try {
				var html = fnc(data);
				if (!fun) return html;
				fun(html);
			} catch (e) {
				fun("jetpl "+ e);
				return tool.error(e, tmpl);
			}
		};
		// 关闭重编译
		recompile = false; 
		return tplfn;
    };
	
    // 对外公开的jetpl方法
    var jetpl = function(tpl) {
        if (typeof tpl !== "string") return tool.error("Template not found");
        return recompile ? new cores(tpl) : cache[tpl] || new cores(tpl);
    };


    var filterModule ={
	    // 字符串转大写  @example ("ABC") => abc
		"uppercase": function(str) {
            return str.toUpperCase();
        },
	    // 字符串转小写 @example ("abc") => ABC
		"lowercase": function(str) {
            return str.toLowerCase();
        },
		//HTML实体转义 @example (" &lt;div&gt; ABC &lt;/div&gt") => ;<div> ABC </div>
		"decode" : function (str){
            return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
        },
		//HTML实体转义 @example ("<div> ABC </div>") => &lt;div&gt; ABC &lt;/div&gt;
		"escape" : function (str){
            return String(str||'').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        },

	    // 时间戳格式化，10位时间戳  fmt 格式化字符串 如 "yyyy-MM-dd hh:mm:ss.ms" 得到 2015-06-30 16:07:14.423 
	    // @example ( 1435650377 , "YYYY-MM-DD" ) => 2015-06-30
		"date": function(str,attr) {
			var fmt = attr || "YYYY-MM-DD", times = new Date(str * 1000);
			var o = {
				"M+": times.getMonth() + 1, // 月
				"D+": times.getDate(), // 日
				"h+": times.getHours(), // 时
				"m+": times.getMinutes(), // 分
				"s+": times.getSeconds(), // 秒
				"q+": Math.floor((times.getMonth() + 3) / 3), // 季度
				"ms": times.getMilliseconds() // 毫秒
			};
			if(/(Y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (times.getFullYear()+"").substr(4 - RegExp.$1.length));
			for(var k in o){
				if(new RegExp("("+ k +")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
			}
			return fmt; 
        }
	}
    jetpl.include = function (elem,data) {
        var dom = document.getElementById( elem.replace(/\#/g,"") ),
        string =  /input|textarea/i.test(dom.nodeName) ? dom.value : dom.innerHTML;
        return jetpl(string).render(data);
    };
	jetpl.version = "1.0";
    // 配置参数
    jetpl.config = function(opts){return jextend(config,opts)};
	jetpl.addConver = function(opts){return jextend(filterModule,opts)};
	// 对外开放转换接口
    jetpl.conver = function (field,type,attr) {
        var conver = attr == undefined ? filterModule[type](field) : filterModule[type](field,attr);
		return conver;  
	}
    // 多环境支持
	"function" === typeof define ? define(function () { 
	    return jetpl; 
	}) : ("object" === typeof module && "object" === typeof module.exports) ?  module.exports = jetpl : window.jetpl = jetpl;
})(window);
