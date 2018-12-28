function changeColor(color) {
    // No tabs or host permissions needed!
    chrome.tabs.executeScript({
        code: `document.body.style.backgroundColor="${color}"`
    });
}

document.addEventListener('DOMContentLoaded', () => {
    var dropdown = document.getElementById('dropdown');

    dropdown.addEventListener('change', () => {
        var index = dropdown.selectedIndex;
        var value = dropdown[index].value;
        console.log(value);
        changeColor(value);
    });

})