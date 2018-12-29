chrome.contextMenus.create({
    type: 'radio', // 菜单项类型
    title: 'White',    // 菜单名字
    onclick: () => {
        changeColor('White');
    }
})

chrome.contextMenus.create({
    type: 'radio',
    title: 'Coral',
    onclick: () => {
        changeColor('Coral');
    }
})

chrome.contextMenus.create({
    type: 'radio',
    title: 'LightCyan',
    onclick: () => {
        changeColor('LightCyan');
    }
})

function changeColor(color) {
    chrome.tabs.executeScript({
        code: `document.body.style.backgroundColor="${color}"`
    });
}