let resultsRendered = false;
let analysisRunning = false;
let statusIndicator;

// Click event handler for the "ANALYZE PAGE" button
function triggerAnalysis() {
    if (analysisRunning) return;

    analysisRunning = true;

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        toggleStatusBlinking();
        
        if (tabs[0].url.startsWith("chrome://")) {
            analysisFail("Legal Buddy cannot run on this page.");
            return;
        }

        chrome.tabs.sendMessage(tabs[0].id, { action: 'getBodyText' }, data => {
            if (data === undefined) {
                analysisFail("Please refresh the current tab before running an analysis.");
                return;
            }

            chrome.runtime.sendMessage({ action: 'sendRequest', data: data }, response => {
                if (response === undefined || response === null || response.status === 'failed') {
                    analysisFail("Could not reach server for processing this policy. Please try again later.");
                    return;
                }
                
                render(JSON.parse(response.body));
            });
        });
    });
}

function analysisFail(msg) {
    statusIndicator.style.color = 'red';
    toggleStatusBlinking();
    showAlert(msg, 5000);
    analysisRunning = false;
}

/*
    Browser extensions disallow inline JavaScript, thus we cannot
    set onclick events from HTML. They have to be attached to the
    DOM elements using addEventListener like so. Here, we attach
    such listeners.
*/
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("analyzeButton").addEventListener('click', triggerAnalysis);


    let tabLinks = document.getElementsByClassName("tabLink");
    for (let tl of tabLinks) {
        tl.addEventListener('click', () => openTab(event, tl.innerText));
    }

    let accordions = document.getElementsByClassName("accordion");
    for (let acc of accordions) {
        acc.addEventListener('click', function () {
            if (!resultsRendered) {
                statusIndicator.style.color = 'red';
                showAlert("First, run an analysis on the page.", 5000);
                return;
            }

            this.classList.toggle("active");

            let panel = this.nextElementSibling;

            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }

    clearPanels();
    statusIndicator = document.getElementById("statusIndicator");
    document.getElementById("defaultTab").click();
});

// UI Logic below
function openTab(event, tabName) {
    let tabContents = document.getElementsByClassName("tabContent");
    for (let tc of tabContents) {
        tc.style.display = "none";
    }

    let tabLinks = document.getElementsByClassName("tabLink");
    for (let tl of tabLinks) {
        tl.className = tl.className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

function clearPanels() {
    let fairnessPanels = document.querySelectorAll("#FAIRNESS > .panel");
    for (let panel of fairnessPanels) {
        const countSpan = panel.previousElementSibling.childNodes[1];
        countSpan.style.display = 'none';
        panel.innerHTML = '';
    }

    let categoriesPanels = document.querySelectorAll("#CATEGORIES > .panel");
    for (let panel of categoriesPanels) {
        const countSpan = panel.previousElementSibling.childNodes[1];
        countSpan.style.display = 'none';
        panel.innerHTML = '';
    }
}

function displayCount(panel, count) {
    const countSpan = panel.previousElementSibling.childNodes[1];
    countSpan.style.display = '';
    countSpan.innerText = count;
}

function render(response) {
    clearPanels();

    let fairnessPanels = document.querySelectorAll("#FAIRNESS > .panel");

    for (let panel of fairnessPanels) {
        let clauses = response['Fairness'][panel.id];

        if (clauses === undefined || clauses === null || clauses.length === 0) {
            panel.innerText = "No clauses in this category.";
            displayCount(panel, 0);
            continue;
        }

        displayCount(panel, clauses.length);

        let unfairClausesList = document.createElement("ul");
        for (let clause of clauses) {
            let newListItem = document.createElement("li");
            newListItem.innerText = clause;
            unfairClausesList.appendChild(newListItem);
        }

        panel.appendChild(unfairClausesList);
    }

    let categoriesPanels = document.querySelectorAll("#CATEGORIES > .panel");

    for (let panel of categoriesPanels) {
        let clauses = response['Categories'][panel.id];

        if (clauses === undefined || clauses === null || clauses.length === 0) {
            panel.innerText = "No clauses in this category.";
            displayCount(panel, 0);
            continue;
        }

        displayCount(panel, clauses.length);

        let clauseCategoriesList = document.createElement("ul");
        for (let clause of clauses) {
            let newListItem = document.createElement("li");
            newListItem.innerText = clause;
            clauseCategoriesList.appendChild(newListItem);
        }

        panel.appendChild(clauseCategoriesList);
    }

    analysisRunning = false;
    resultsRendered = true;
    toggleStatusBlinking();
    statusIndicator.style.color = 'green';
}

function showAlert(message, timeout) {
    let alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.hidden = false;

    setTimeout(_ => {
        alertBox.hidden = true;
    }, timeout);
}

function toggleStatusBlinking() {
    statusIndicator.classList.toggle("blinking");
}