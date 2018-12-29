# Chrome 插件编写

## 写在前面

参考：

[Chrome插件开发全攻略](https://github.com/sxei/chrome-plugin-demo)

[非官方中文文档](https://crxdoc-zh.appspot.com/extensions)

[官方英文文档](https://developer.chrome.com/extensions)

由于公司在做的一个项目中需要用到浏览器插件，所以临时开始学习了一些开发技术。在了解了插件可以做的事之后，我个人还是比较感兴趣的，目前只实现了一个简单的 demo，后面会陆续补充。

**demo 目录：**

- demo1: 通过 `popup` 改变网页背景颜色
- demo2: 通过 `右键菜单` 改变网页背景颜色

## 核心内容

- **manifest.json**
- **background** / event-pages
- **content_scripts**
- **injected-script**
- popup

### manifest.json

这是 Chrome 插件必须的文件，用于所有和插件相关的配置。

[完整配置](https://developer.chrome.com/extensions/manifest)

**manifest.json**
```
{
    "name": "contextMenu",
    "manifest_version": 2,
    "version": "0.0.1"
}
```
以上三个字段为必填字段，且 manifest_version 需为 2。

### background

`background` 是一个常驻页面，它的生命周期是插件中所有类型页面中最长的，随着浏览器的打开一直到浏览器关闭。所以需要启动即运行、一直运行、全局的代码可以放在这里。

`background` 权限很高，几乎可以调用 Chrome 所有扩展 API。并且可以无限制跨域。

**manifest.json**
```
{
    // ...
    "background": {
        "page": "background.html"
        // "scripts": ["background.js"]
    }
    // ...
}
```
`manifest.json` 中 `background` 的值可选 `page` 和 `scripts` （只能二选一）。

可以通过 `page` 指定一个 html 文件，也可以通过 `scripts` 指定一个 JS 文件，使用 `sccripts` 时，Chrome 会 默认为这个 JS 生成一个默认的网页。

### event-pages

由于 `background` 生命周期太长，长时间挂载可能会影响性能，所以 Google 又增加一个 `event-pages`，其与 `background` 的区别就是多了一个 `persistent` 参数。（也就是说，设置了 `persistent` 参数以后就当成 evet-pages）

**manifest.json**
```
{
    // ...
	"background": {
		"scripts": ["event-page.js"],
		"persistent": false
	}
	// ...
}
```
它的生命周期是：在被需要时加载，在空闲时被关闭。

### content_scripts

[content_scripts](https://developer.chrome.com/extensions/content_scripts) 是向页面注入脚本的一种形式，通过配置 `content_scripts` 可以向指定页面注入 JS 和 CSS，最常见的包括：广告屏蔽、CSS 定制等。

**manifest.json**
```
{
    // ...
    "content_scripts": [{
        // "matches": ["http://*/*", "https://*/*"]
        // <all_urls> 表示匹配所有地址
        "matches": ["<all_urls>"],
        // 多个 js 按顺序注入
        "js": ["js/0.1js", "js/02.js"],
        // 注意 CSS 注入，可能会影响全局样式
        "css": ["css/custom.css"],
        // 代码注入时间，可选"document_start", "document_end", or "document_idle"，最后一个表示页面空闲时，默认document_idle
        "run_at": "document_start"
    }]
    // ...
}
```

特别注意，如果没有主动指定 `run_at` 为 `document_start`（默认为 `document_idle`），下面这种代码是不会生效的：

**content-script.js**
```
document.addEventListener('DOMContentLoaded', function()
{
	console.log('我被执行了！');
});
```

`content_scripts` 和原始页面（也就是你使用插件的页面）共享 DOM，但是不共享 JS。如果需要访问原始页面 JS（例如某个 JS 变量），只能通过 `injected js` 来实现。

`content_scripts` 不能访问绝大部分 `chrome.xxx.api`，除了下面这4种：

```
chrome.extension(getURL, inIncognitoContext, lastError, onRequest, sendRequest)
chrome.i18n
chrome.runtime(connect, getManifest, getURL, id, onConnect, onMessage, sendMessage)
chrome.storage
```

### injected-script
这里的 `injected-script` 指的是向页面注入的一种 JS。为什么要有 `injected-script` 呢？

因为 `content_script` 有一个缺陷：无法访问页面的 JS。虽然它可以操作 DOM，但是 DOM 却不能调用它，比如在 DOM 上绑定点击事件调用 content_script 中代码（通过 `onclick` 和 `addEventListener` 两种都不可以）。

但是，"在页面中添加一个按钮，并调用插件的 API 扩展"是很常见的需求，该怎么办呢？来看下面这个例子。

#### 通过 DOM 方式向页面注入代码

在 `content_script` 中通过 DOM 方式向页面注入 `indeject-script` 代码示例：

**content-script.js**
```
document.addEventListener('DOMContentLoaded', () => {
    injectCustomJs();
})

function injectCustomJs(path) {
    path = path || 'js/injected-script.js';
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    // 获取 injected-script 相对地址
    temp.src = chrome.extension.getURL(path);
    console.log(temp.src);
    
    temp.onload = function () {
        // 执行完后移除该标签
        this.parentNode.removeChild(this);
    };
    document.head.appendChild(temp);
}
```

**injected-script.js**
```
console.log('this is injected.js!!')
```

此时，运行浏览器你会发现报错
```
GET chrome-extension://invalid/ net::ERR_FAILED
```

这是因为 `web` 访问插件中的资源的话必使用 `web_accessible_resources` 显示声明才行

**manifest.json**
```
{
    "name": "contextMenu",
    "manifest_version": 2,
    "version": "0.0.1",
    "content_scripts": [{
        "matches": ["<all_urls>"],
        "js": ["js/content-script.js"],
        "run_at": "document_start"
    }],
    "web_accessible_resources": [
        "js/injected-script.js"
    ]
}
```

上面这种方式是通过往页面中插入一个 <script\> 标签的方式向页面注入代码，实际上我们不是每次都需要注入一整个文件，有时我们也许只需要注入一句代码，有更方便的办法吗？有！

#### 通过编程方式向页面注入代码

 查看 [英文文档](https://developer.chrome.com/extensions/content_scripts#functionality) | [中文文档](https://crxdoc-zh.appspot.com/extensions/content_scripts#pi)
 
 首先要在 `manifest.json` 中添加权限
 
**manifest.json**
```
{
    // ...
    "permissions": [
        "activeTab"
    ]
    // ...
}
```
 
**background.js**
```
chrome.tabs.executeScript({
    code: 'document.body.style.backgroundColor="orange"'
    
});
```

或者也可以通过这种方式注入一整个文件：

```
chrome.runtime.onMessage.addListener(function(message, callback) {
    if (message == “runContentScript”){
        chrome.tabs.executeScript({
        file: 'contentScript.js'
        });
    }
});
```

### popup
`popup` 是点击  `browser_action` 图标时打开的一个小窗口网页，焦点离开网页就立即关闭，一般用来做一些临时性的交互。

`popup` 可以包含任意你想要的 HTML 内容，并且会自适应大小。可以通过 `default_popup` 字段来指定 `popup` 页面，也可以调用 `setPopup()` 方法。

**manifest.json**
```
{
    // ...
    "browser_action": {
        // 插件图标
        "default_icon": "img/icon.png",
        // 图标悬停时的标题，可选
        "default_title": "这是一个示例Chrome插件",
        // 弹出页面
        "default_popup": "popup.html"
    }
    // ...
}
```

> **注意**：
由于单击图标打开 `popup`，焦点离开又立即关闭，所以 `popup` 页面的生命周期一般很短，需要长时间运行的代码千万不要写在 `popup` 里面。

在权限上，它和 `background` 非常类似，它们之间最大的不同是生命周期的不同，`popup` 中可以直接通过 `chrome.extension.getBackgroundPage()` 获取 `background` 的 `window` 对象。
