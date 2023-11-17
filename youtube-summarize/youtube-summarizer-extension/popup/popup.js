const queryInput = document.getElementById("query-input");
const submitButton = document.getElementById("submit-button");
const clearButton = document.getElementById("clear-button");
const queriesAnswersContainer = document.getElementById("queriesAnswersContainer");
const showHideWrapper = document.getElementById("show-hide-wrapper");

const [currentTab] = await chrome.tabs.query({active: true, currentWindow: true});

// send a message to the background script to reset the message array
chrome.runtime.sendMessage({ resetContext: true });
// focus on the input field
queryInput.focus();


queryInput.addEventListener("keyup", (event) => {
  // disable the submit button if the input field is empty
  if (queryInput.value === "") {
    submitButton.disabled = true;
  } else {
    submitButton.disabled = false;
  }

  // If the user presses enter, click the submit button
  if (event.code === "Enter") {
    event.preventDefault();
    submitButton.click();
  }
});

// Listen for clicks on the submit button
submitButton.addEventListener("click", async () => {
  await chrome.tabs.sendMessage(currentTab.id, { action: "SUBMIT_QUERY", data: {query: queryInput.value, timestamp: "20231115_1255"}});
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, response) => {
  
});
