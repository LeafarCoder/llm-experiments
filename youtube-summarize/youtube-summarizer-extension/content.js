let youtubeRightControls, youtubePlayer;
let currentVideo = "";
let sideChatToggle = false;
let defaultCaptionLanguage = "en";

(() => {
  console.log("Start of contentScript.js");



  // Create a link element
  var link = document.createElement('link');
  // Set the attributes for the link element
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
  // Append the link element to the head of the document
  document.head.appendChild(link);

  // videoLoaded();
})();



// ###################################
// AUXILIARY FUNCTIONS
// ###################################


function getYoutubeTranscriptNodes(captions_language) {
  console.log("getYoutubeTranscriptNodes");
  // get the HTML page content

  let yt_html = document.documentElement.innerHTML;
  // let yt_html = new XMLSerializer().serializeToString(document);
  let splitted_html = yt_html.split('"captions":')
  // if HTML is not split in 2, then there are no captions
  if (splitted_html.length <= 1){
    return new Promise((resolve, reject) => {
      resolve({
        captions_found: false,
        transcript_json: [],
        transcript: "",
        video_id: currentVideo
      });
    });
  }
  let caption_details = splitted_html[1].split(',"videoDetails')[0].replace('\n', '');
  let captions_json = JSON.parse(caption_details);
  let playerCaptionsTracklistRenderer = captions_json["playerCaptionsTracklistRenderer"];
  let captionTracks = playerCaptionsTracklistRenderer["captionTracks"];

  let captions_url = "";
  for (var key in captionTracks) {
    if (captionTracks[key]["languageCode"] === captions_language) {
      captions_url = captionTracks[key]["baseUrl"];
      break;
    }
  }

  const urlParams = new URL(captions_url).searchParams;
  video_id = urlParams.get("v");
  console.log(video_id);

  return fetch(captions_url)
    .then(response => response.text())
    .then(xmlString => {
      // Parse the XML string
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      let transcripNodes = xmlDoc.documentElement.childNodes

      let transcript_json = [];
      let full_transcript = "";
      // Iterate through the NodeList
      for (var i = 0; i < transcripNodes.length; i++) {
        // Check if the node is an element node (nodeType 1)
        if (transcripNodes[i].nodeType === 1) {
            let childText = transcripNodes[i];
            let text = childText.textContent.replace(/&#(\d+);/g, function(match, match2) {return String.fromCharCode(+match2);});;
            let start = childText.getAttribute("start");
            let dur = childText.getAttribute("dur");
            transcript_json.push({"text": text, "start": start, "dur": dur});
            full_transcript = full_transcript + " " + text;
        }
      }

      full_transcript = full_transcript.replace(/&#(\d+);/g, function(match, match2) {return String.fromCharCode(+match2);});
      console.log(full_transcript);

      return {
        captions_found: true,
        transcript_json: transcript_json,
        transcript: full_transcript,
        video_id: currentVideo
      };
    })
    .catch(error => {
      console.error('Error:', error);
    });
};




function addButtonControls() {
  if (!document.getElementById("yt-extension-sideChatBtn")) {
      const sideChatBtn = document.createElement("button");
      sideChatBtn.className = "ytp-fullscreen-button ytp-button";
      sideChatBtn.id = "yt-extension-sideChatBtn"
      // sideChatBtn.title = "Click to bookmark current timestamp";
      sideChatBtn.setAttribute("data-title-no-tooltip", "Toggle chat");
      sideChatBtn.setAttribute("aria-keyshortcuts", "c");
      sideChatBtn.setAttribute("aria-label", "Toggle chat (c)");
      sideChatBtn.setAttribute("data-priority", "0");
      sideChatBtn.title = "Toggle Chat";
      // sideChatBtn.style.marginBottom = "10px";

      const sideChatBtnI = document.createElement("i");
      sideChatBtnI.className = "fa fa-comment";
      sideChatBtn.appendChild(sideChatBtnI);

      sideChatBtn.addEventListener("click", toggleSideChat);
      youtubeRightControls.appendChild(sideChatBtn);
  }
};




function toggleSideChat() {

  let sideChatBtnI = document.getElementById("yt-extension-sideChatBtn").firstElementChild;
  if (sideChatToggle) {
      sideChatBtnI.className = "fa fa-comment";
      document.getElementById("yt-prompter-sideChatDiv").style.display = "block";
  }else{
      sideChatBtnI.className = "fa fa-comment-slash";
      document.getElementById("yt-prompter-sideChatDiv").style.display = "none";
  }
  sideChatToggle = !sideChatToggle;
};




function addSideChat() {
  console.log("Adding side chat...");
  const sideChatDiv = document.createElement("div");
  fetch(chrome.runtime.getURL('/sideChat.html'))
    .then(r => r.text())
    .then(html => {
      sideChatDiv.innerHTML = html;
      document.getElementById("secondary-inner").prepend(sideChatDiv);
  });
};




function videoLoaded() {
  console.log("video loaded..");

  youtubeRightControls = document.getElementsByClassName("ytp-right-controls")[0];
  youtubePlayer = document.getElementsByClassName('video-stream')[0];
  addButtonControls();
  addSideChat();
  // getYoutubeTranscript();
};

// ###########################################
// CHROME MESSAGE LISTENER
// ###########################################


chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  let {action, data} = msg;

  if (action === "GET_VIDEO_TRANSCRIPT"){
    console.log("action: " + action);
    currentVideo = data.videoId;
    let captions_language = data.captions_language;
    console.log(currentVideo);

    getYoutubeTranscriptNodes(captions_language)
      .then(response => {
        console.log(response);
        chrome.runtime.sendMessage({
            action: "POST_VIDEO_TRANSCRIPT",
            data: response
          }, (response) => {console.log(response);});
      });
    
  }
  
});


// ########################################################
// ########################################################
// ########################################################

async function fetch_model(){
  // get the API model from local storage
  return  new Promise((resolve, reject) => {
    chrome.storage.local.get(['apiModel'], result => resolve(result))
  });
};

async function fetch_apiKey(){
  // get the API model from local storage
  let result = await new Promise(resolve => {
    chrome.storage.local.get(['apiKey'], result => resolve(result))
  });
  return result.apiKey;
};

async function create_thread() {
  const apiKey = await fetch_apiKey();
  console.log(apiKey);

  try {
    // send the request containing the messages to the OpenAI API
    let response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v1',
        },
        body: JSON.stringify({})
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
        // chrome.runtime.sendMessage({ answer: response });

        // Add the response from the assistant to the message array
        // messageArray.push({ role: "assistant", "content": response });
        console.log(response);
        return response;
    }
} catch (error) {
    // send error message back to the content script
    chrome.runtime.sendMessage({ answer: "No answer Received: Make sure the entered API-Key is correct." });
}}


async function get_thread(thread_id) {
  const apiKey = await fetch_apiKey();
  console.log(apiKey);

  try {
    // send the request containing the messages to the OpenAI API
    let response = await fetch(`https://api.openai.com/v1/threads/${thread_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v1',
        }
    });
    // check if the API response is ok Else throw an error
    if (!response.ok) {
        throw new Error(`Failed to fetch. Status code: ${response.status}`);
    }
    // get the data from the API response as json
    let data = await response.json();

    console.log(data);
} catch (error) {
    // send error message back to the content script
    chrome.runtime.sendMessage({ answer: "No answer Received: Make sure the entered API-Key is correct." });
}}



async function get_thread_messages(thread_id) {
  const apiKey = await fetch_apiKey();
  console.log(apiKey);

  try {
    // send the request containing the messages to the OpenAI API
    let response = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v1',
        }
    });
    // check if the API response is ok Else throw an error
    if (!response.ok) {
        throw new Error(`Failed to fetch. Status code: ${response.status}`);
    }
    // get the data from the API response as json
    let data = await response.json();

    console.log(data);
} catch (error) {
    // send error message back to the content script
    chrome.runtime.sendMessage({ answer: "No answer Received: Make sure the entered API-Key is correct." });
}}

// apiModel = fetch_apikey_and_model(); 
// let data = create_thread();


// get_thread("thread_a8hstWi4PV8govqZp13Yx4nC");
// get_thread_messages("thread_a8hstWi4PV8govqZp13Yx4nC");


// curl -X GET ^
//   -H "Content-Type: application/json" ^
//   -H "Authorization: Bearer %apikey%" ^
//   https://api.openai.com/v1/threads/thread_a8hstWi4PV8govqZp13Yx4nC