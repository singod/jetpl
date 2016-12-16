/*

 @Name：jetpl v1.4 JS模板引擎
 @Author：陈国军
 @Date：2016-12-16
 @QQ群：516754269
 @官网：http://www.jayui.com/jetpl/  或　 https://github.com/singod/jetpl　
        
*/
;(function(root, factory) {
	var jetpl = factory(root);
	if (typeof define === 'function' && define.amd) {
		// AMD
		define('jetpl', function() { return jetpl;});
	} else if (typeof exports === 'object') {
		// Node.js
		module.exports = jetpl;
	} else {
		// Browser globals
		var _jetpl = root.jetpl;
		jetpl.noConflict = function() {
			if (root.jetpl === jetpl) root.jetpl = _jetpl;
			return jetpl;
		};
		root.jetpl = jetpl;
	}
}(this, function(root) {
    var cache = {},
    tool = {
        error : function(e, tlog) {
            var error = "jetpl ";
            typeof console === "object" && console.error(error + e + "\n" + (tlog || ""));
            return error + e;
        },
		keys : function (obj){
			var arr = [];
			for(arr[arr.length] in obj);
			return arr ;
		}
    },
    cores = function (tpl) {
        var that = this;
		tpl = tpl || '';
        if (/^\#/.test(tpl)) tpl = document.getElementById(tpl.substring(1)).innerHTML;
        that.tpl = tpl;
        that.tplinit();
        cache[tpl] = that;
    };
	// 生成模板引擎函数
    cores.prototype.tplCompiler = function (tpl) {
        var tpid = 0; // each 嵌套 for 下标须不同

        var code = tpl.replace(/\s+/g, ' ').replace(/<!--[\w\W]*?-->/g, '')
            // html
            .replace(/(^|%}|}})([\s\S]*?)({{|{%|$)/g, function(tp, tp1, tp2, tp3) {
                // html => js string 转义 ' \ \n
                return tp1 + 'outStr+= "' + tp2.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n') + '";\n' + tp3
            })
            // {%= %}
            .replace(/({%=)([\s\S]*?)(%})/g, 'outStr+= ($2);\n') // <%= %>  [\s\S]允许换行
            // {% %}
            .replace(/({%)(?!=)([\s\S]*?)(%})/g, '\n$2\n') // <% js code %>  (?!=)不要匹配到<%= %>
            // each
            .replace(/{{each\s*([\w."'\][]+)\s*(\w+)\s*(\w+)?}}/g, function(tp, tp1, tp2, tp3) {
                var tpi = 'tps' + (tpid++);  
                var each = 'for(var $p=0; $p<$1.length; $p++){';
                each += tp2 ? '\nvar $2 = $1[$p];\n' : '\nvar $item = $1[$p];\n';
                each += tp3 ? '\nvar $3 = $p;\n' : '';
                return each.replace(/\$1/g, tp1).replace(/\$2/g, tp2).replace(/\$3/g, tp3).replace(/\$p/g, tpi)
            })
            .replace(/{{\/each}}/g, '};\n')
            // if
            .replace(/{{if\s+(.*?)}}/g, 'if($1){')
            .replace(/{{else ?if (.*?)}}/g, '}else if($1){')
            .replace(/{{else}}/g, '}else{')
            .replace(/{{\/if}}/g, '}')
            // 表达式
            .replace(/{{=?([\s\S]*?)}}/g, 'outStr+=$1;\n');

        code = 'var outStr="";\n' + code + 'return outStr;';
        return code;
    }

	// 把传来的data转成内部变量
    cores.prototype.dataToVars = function (data) {
        var varArr = tool.keys(data || {}).sort();
        var vars = ''; // 把传来的data转成内部变量，不用with，提高性能
        while (varArr.length) {
            var vs = varArr.shift();
            vars += 'var ' + vs + '= jedata["' + vs + '"];';
        }
        return vars;
    }
	cores.prototype.tplinit = function () {
		var that = this, tmpl = that.tpl;
		var getRender = function (tmpl, data) {
			cache[tmpl] = cache[tmpl] || {};
			var vars = that.dataToVars(data);
	
			if (cache[tmpl].vars == vars) {
				return cache[tmpl].refuns
			}
			var code = cache[tmpl].code || that.tplCompiler(tmpl);
			var refuns = new Function('jedata', vars + code);
			cache[tmpl].vars = vars;
			cache[tmpl].code = code;
			cache[tmpl].refuns = refuns;
			return refuns;
		}, tplView = function (tpl, data) {
			var tplrender = getRender(tpl, data);
			return arguments.length > 1 ? tplrender(data) : function(data) {
				var tplrender = getRender(tpl, data);
				return tplrender(data);
			};
		};
		var tplfn = that.render = function (data,callback) {
			if(!data) return tool.error('no data');	
			try {
				var html = tplView(tmpl, data);
				if(!callback){
					var tplrender = tplView(tmpl);
			        return tplrender(data);
				}
				callback(html);
			} catch (e) {
				callback("jetpl "+ e);
				return tool.error(e, tmpl);
			}
		};
		return tplfn;
	}
    // 对外公开的jetpl方法
    var jetpl = function(tpl) {
        if (typeof tpl !== "string") return tool.error("Template not found");
        return new cores(tpl);
    };
	//HTML实体转义 @example (" &lt;div&gt; ABC &lt;/div&gt") => ;<div> ABC </div>
	jetpl.decode = function (str){
		return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
	};
	//HTML实体转义 @example ("<div> ABC </div>") => &lt;div&gt; ABC &lt;/div&gt;
	jetpl.escape = function (str){
		return String(str||'').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
	};
	jetpl.toNumber = function (str){return str.toString();};   // 字符串转数字  @example ("56.36.56") => 56.36.56
	// 时间戳格式化，10位时间戳  fmt 格式化字符串 如 "yyyy-MM-dd hh:mm:ss.ms" 得到 2015-06-30 16:07:14.423 
	// @example ( 1435650377 , "YYYY-MM-DD" ) => 2015-06-30
	jetpl.date = function(str,attr) {
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
	};
	
    jetpl.include = function (elem,data) {
        var dom = document.getElementById( elem.replace(/\#/g,"") ),
        string =  /input|textarea/i.test(dom.nodeName) ? dom.value : dom.innerHTML;
        return jetpl(string).render(data);
    };
	jetpl.version = "1.4";

    return jetpl;
}));
