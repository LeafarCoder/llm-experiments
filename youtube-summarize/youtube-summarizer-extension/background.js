let last_video_id = "";
let captions_language = "en";
let llm_model = "gpt-3-turbo";
let openai_apikey = "";

let transcript_jsons = {};

// on first install open the options page to set the API key
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.runtime.openOptionsPage();
  }
});

function resetConversationContext() {
  systemMessage =
    "You are a helpful Youtube helper. Users can ask you questions about videos, and based on the captions, you should provide adequate answers in a summarized and structured manner.";
  // reset the message array to remove the previous conversation
  messageArray = [{ role: "system", content: systemMessage }];
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
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  let {action, data} = msg;
  console.log("runtime.onMessage: " + action);

  if (action == "UPDATE_CAPTIONS_LANGUAGE") {
    captions_language = data.captions_language;
    sendResponse(`Captions language updated to '${captions_language}'.`);
  }

  if (action == "POST_VIDEO_TRANSCRIPT") {
    let {captions_found, transcript_json, transcript, video_id} = data;
    transcript_jsons[video_id] = transcript_json;

    console.log(transcript_jsons);
    sendResponse(`Transcript received by background.js`);
  }

});


function getTranscript(tabId) {
  console.log("Getting transcript");

  chrome.tabs.sendMessage(tabId, {
    action: "GET_VIDEO_TRANSCRIPT",
    data: {
      videoId: video_id,
      captions_language: captions_language
    },
  });
}

function check_if_new_video(url) {
  if (url && url.includes("youtube.com/watch")) {
    const urlParams = new URL(url).searchParams;
    video_id = urlParams.get("v");
    if (video_id != last_video_id) {
        last_video_id = video_id;
        return true;
    }
  }
  return false;
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  console.log(details);
  let new_video = check_if_new_video(details.url);
  if (new_video) {
    console.log("New video: " + last_video_id);
    setTimeout(function() {
      getTranscript(details.tabId)},
      2000
    );
  }
});


// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log("tabs.onUpdated: " + tab.url);
//   // let new_video = check_if_new_video(tab.url);
//   // if (new_video) {
//   //   console.log("New video (page reload)");
//   //   callContent(changeInfo.url, tabId);
//   // }
// });
