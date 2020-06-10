/*
    send takes the webpage's body's text content
    as input and uses the JS Fetch API to
    send a request to the server for further
    pre-processing and eventual classification.

    The request payload is JSON formatted with
    two fields:
    - bodyText: the webpage body's text
    - url: the URL of the current page

    Ensure that the server sends the following header:
    Access-Control-Allow-Origin: *
*/
function send(bodyText, tabURL) {
    let payload = {
        body: bodyText,
        url: tabURL
    };

    // returns a Promise
    return fetch("http://localhost:5000/process", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(payload)
    });
}

/*
    This listener receives the extracted text from the web pages
    and sends it to the server for further processing.

    Then, we return the response from the server, which contains the
    classification results to the extension.

    Useful:
    https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent/20077854#20077854
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendRequest') {
        send(request.data.bodyText, request.data.tabURL)
            .then(response => response.text().then(data => sendResponse({ status: 'success', body: data })))
            .catch(err => sendResponse({ status: 'failed', body: err }));

        // Required for synchronizing the flow of execution
        // https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-484772327
        return true;
    }
});
