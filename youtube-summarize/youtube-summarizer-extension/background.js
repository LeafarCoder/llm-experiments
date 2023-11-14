// on first install open the options page to set the API key
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
      chrome.tabs.create({ url: "options.html" });
  }
});


function resetConversationContext(){
  systemMessage = "You are a helpful Youtube helper. Users can ask you questions about videos, and based on the captions, you should provide adequate answers in a summarized and structured manner.";
  // reset the message array to remove the previous conversation
  messageArray = [
    { role: "system", content: systemMessage }
  ];
  console.log("Conversation context reset.");
}
resetConversationContext();

// a event listener to listen for a message from the content script that says the user has openend the popup
chrome.runtime.onMessage.addListener(function (request) {
  // check if the request contains a message that the user has opened the popup
  if (request.resetContext) {
    resetConversationContext();
  }
});

// listen for a request message from the content script
chrome.runtime.onMessage.addListener(async function (request) {
  // check if the request contains a message that the user sent a new message
  if (request.input) {
      // get the API key from local storage
      let apiKey = await new Promise(resolve => chrome.storage.local.get(['apiKey'], result => resolve(result.apiKey)));
      // get the API model from local storage
      let apiModel = await new Promise(resolve => chrome.storage.local.get(['apiModel'], result => resolve(result.apiModel)));
      // Add the user's message to the message array
      messageArray.push({ role: "user", "content": request.input });

      try {
          // send the request containing the messages to the OpenAI API
          let response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                  "model": apiModel,
                  "messages": messageArray,
                  "temperature": 0.0
              })
          });

          // check if the API response is ok Else throw an error
          if (!response.ok) {
              throw new Error(`Failed to fetch. Status code: ${response.status}`);
          }

          // get the data from the API response as json
          let data = await response.json();

          // check if the API response contains an answer
          if (data && data.choices && data.choices.length > 0) {
              // get the answer from the API response
              let response = data.choices[0].message.content;

              // send the answer back to the content script
              chrome.runtime.sendMessage({ answer: response });

              // Add the response from the assistant to the message array
              messageArray.push({ role: "assistant", "content": response });
          }
      } catch (error) {
          // send error message back to the content script
          chrome.runtime.sendMessage({ answer: "No answer Received: Make sure the entered API-Key is correct." });
      }
  }
  // return true to indicate that the message has been handled
  return true;
});


// chrome.action.onClicked.addListener((tab) => {
// chrome.webNavigation.onCompleted.addListener(function(details) {
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (details.url.includes('youtube.com/watch')) {
    console.log(details);
    const urlParams = new URL(details.url).searchParams;
    chrome.tabs.sendMessage(details.tabId, {
      msgType: "new_video",
      videoId: urlParams.get('v'),
    }, (response)=>{console.log(response)});
  }
});