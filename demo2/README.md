## 右键菜单
本例实现一个右键菜单来改变网页背景颜色。

先来认识一下右键菜单。开发者可以自定义浏览器右键菜单，主要是通过 [chrome.contextMenus](https://crxdoc-zh.appspot.com/extensions/contextMenus) API 实现。


### 编写第一个右键菜单

**manifest.json**
```
{
    "name": "contextMenu",
    "manifest_version": 2,
    "version": "0.0.1",
    "browser_action": {
        "default_icon": "icon.png",
        "default_title": "changeColor"
    },
    "background": {
        "js": ["js/background.js"]
    },
    "permissions": [
        "contextMenus"
    ]
}
```

**background.js**
```
chrome.contextMenus.create({
    type: 'normal', // 菜单项类型
    title: 'test',
    onclick: () => {
        alert('test 右键菜单');   
    }
})
```

### 简单的划词搜索功能

现在我们来写一个选择关键词然后 google 搜索的右键菜单。
**manifest.json**
```
{
    // ...
    "permissions": [
        "tabs"
    ]
    // ...
}
```
`manifest.json` 中 `permissions` 字段增加属性 `tabs`。

**background.js**
```
chrome.contextMenus.create({
    type: 'normal', // 菜单项类型
    title: 'search: %s',    // s% 表示选中的文字
    contexts: ["selection"],    // 当选中文字时才会被激活
    onclick: (param) => {
        chrome.tabs.create({
            url: `https://www.google.com/search?q=${encodeURI(param.selectionText)}`
        })
    }
})
```

### 实现改变网页背景颜色功能

我们先来分析一下要实现改变网页背景颜色需要做哪些事：
> 1. 增加右键菜单选项
> 2. 给每个选项设置对应事件

**1. 增加菜单项**

**background.js**
```
hrome.contextMenus.create({
    type: 'radio', // 菜单项类型
    title: 'White'    // 菜单名字
})

chrome.contextMenus.create({
    type: 'radio',
    title: 'Coral'
})

chrome.contextMenus.create({
    type: 'radio',
    title: 'LightCyan'
})
```

当一个页面添加多个菜单时，自动注册为二级菜单，这些多个菜单为并列关系。

具体规则见 [英文文档](https://developer.chrome.com/apps/contextMenus) | [中文文档](https://crxdoc-zh.appspot.com/extensions/contextMenus)

**2.为菜单注册事件**

这里我只拿一个菜单项举例，其它同理。

**background.js**
```
chrome.contextMenus.create({
    type: 'radio', // 菜单项类型
    title: 'White',    // 菜单名字
    onclick: () => {
        chrome.tabs.executeScript({
            code: `document.body.style.backgroundColor="${color}"`;
        });
    }
})
```
