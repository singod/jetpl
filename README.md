jetpl.js
=======
# 快速上手

**编写模板**

使用一个``type="text/html"``的``script``标签存放模板：

    <script id="test" type="text/html">
    <% if (title){ %>
        <% for (var i=0;i<list.length;i++) { %>
            <div><%= i %>. <%= list[i].user %></div>
        <%}%>
        <%= name||"name is not found !" %>
    <% } %>
    </script>


**渲染模板**

      var data = {
          title: '标签',
          list: ['文艺', '博客', '摄影', '电影', '民谣', '旅行', '吉他']
      };
      var gethtml = document.getElementById('test').innerHTML
      
      jetpl(gethtml).render(data, function(html){
          document.getElementById('testid').innerHTML = html
      });
============
**查看演示**

* [查看模板演示](http://singod.github.io/jetpl/)   

**下载**

* [jetpl.js](https://github.com/singod/jetpl/blob/gh-pages/js/jetpl.js) *(原生语法, 2.7kb)*

============

## 语法

字段 | 类型 | 值| 说明
------------ | ------------- | ------------ | ------------
openTag | String | ``<%`` | 逻辑语法开始标签
closeTag | String | ``%>`` | 逻辑语法结束标签
valueTag | String | ``<%=`` | 输出变量开始标签
valueTag | String | ``%>`` | 输出变量结束标签

============
	
## 性能测试：


jetpl 的编译渲染速度是著名的 jQuery 作者 John Resig 开发的 tmpl 的 **43** 倍！与第二名 artTemplate 也有一倍的差距。 查看 [性能测试](http://singod.github.io/jetpl/test/test.html) ，单次结果不一定准确，请多测几次。

============
