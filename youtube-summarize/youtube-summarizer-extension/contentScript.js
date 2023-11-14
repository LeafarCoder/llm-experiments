
console.log("Start of contentScript.js");

let id_prefix = "yt-prompter-";
let youtubeRightControls, youtubePlayer;
let currentVideo = "";
let sideChatToggle = false;
let defaultCaptionLanguage = "en";

// Create a link element
var link = document.createElement('link');
// Set the attributes for the link element
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
// Append the link element to the head of the document
document.head.appendChild(link);

const getYoutubeTranscript = async () => {

  // get the HTML page content
  let yt_html = document.documentElement.innerHTML;
  let splitted_html = yt_html.split('"captions":')
  let caption_details = splitted_html[1].split(',"videoDetails')[0].replace('\n', '')
  let captions_json = JSON.parse(caption_details);
  let playerCaptionsTracklistRenderer = captions_json["playerCaptionsTracklistRenderer"];

  let captionTracks = playerCaptionsTracklistRenderer["captionTracks"];
  for (var key in captionTracks) {
    if (captionTracks[key]["languageCode"] === defaultCaptionLanguage) {
      var captions_url = captionTracks[key]["baseUrl"];
      break;
    }
  }
  
  console.log(captions_url);
  fetch(captions_url)
  .then(response => response.text())
  .then(xmlString => {
    // Parse the XML string
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    let rootNode = xmlDoc.documentElement

    let transcript_json = [];
    let full_transcript = "";
    let transcripTextNodes = rootNode.childNodes;
    // Iterate through the NodeList
    for (var i = 0; i < transcripTextNodes.length; i++) {
      // Check if the node is an element node (nodeType 1)
      if (transcripTextNodes[i].nodeType === 1) {
          let childText = transcripTextNodes[i];
          let text = childText.textContent.replace(/&#(\d+);/g, function(match, match2) {return String.fromCharCode(+match2);});;
          let start = childText.getAttribute("start");
          let dur = childText.getAttribute("dur");
          transcript_json.push({"text": text, "start": start, "dur": dur});
          full_transcript = full_transcript + " " + text;
      }
    }

    // Now you can work with the xmlDoc
    // console.log(transcript_json);

    full_transcript = full_transcript.replace(/&#(\d+);/g, function(match, match2) {return String.fromCharCode(+match2);});
    console.log(full_transcript);
    return full_transcript;
  })
  .catch(error => {
    console.error('Error:', error);
  });
};

const addButtonControls = async () => {
  
  if (!document.getElementById(id_prefix + "sideChatBtn")) {
      const sideChatBtn = document.createElement("button");
      sideChatBtn.className = "ytp-fullscreen-button ytp-button";
      sideChatBtn.id = id_prefix + "sideChatBtn"
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

const toggleSideChat = async () => {

  let sideChatBtnI = document.getElementById(id_prefix + "sideChatBtn").firstElementChild;
  if (sideChatToggle) {
      sideChatBtnI.className = "fa fa-comment";
      document.getElementById("yt-prompter-sideChatDiv").style.display = "block";
  }else{
      sideChatBtnI.className = "fa fa-comment-slash";
      document.getElementById("yt-prompter-sideChatDiv").style.display = "none";
  }
  sideChatToggle = !sideChatToggle;

};

const addSideChat = async () => {
  console.log("Adding side chat...");
  const sideChatDiv = document.createElement("div");
  fetch(chrome.runtime.getURL('/sideChat.html')).then(r => r.text()).then(html => {
      sideChatDiv.innerHTML = html;
      document.getElementById("secondary-inner").prepend(sideChatDiv);
  });
};


const videoLoaded = async () => {
  console.log("video loaded..");

  youtubeRightControls = document.getElementsByClassName("ytp-right-controls")[0];
  youtubePlayer = document.getElementsByClassName('video-stream')[0];
  addButtonControls();
  addSideChat();
  getYoutubeTranscript();
};

getYoutubeTranscript();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  let msg_type = msg.get("msgType");

  if (msg_type === "new_video"){
    let videoId = msg.get("videoId");
    if (videoId != currentVideo) {
      currentVideo = videoId;
      console.log("New video ID: " + currentVideo);

      videoLoaded();
      // ...
    }
  }
  
  sendResponse("Ok");
});
