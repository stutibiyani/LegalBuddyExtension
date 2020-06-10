chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getBodyText') {
        const paras = document.getElementsByTagName("p");
        let text = '';
        for (const para of paras) {
            text += para.textContent;
        }

        sendResponse({bodyText: text, tabURL: window.location.href});
    }
});