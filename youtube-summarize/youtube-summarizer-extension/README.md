
- Get youtube video status:
 - Timestamp
 - 1000 word context around the timestemp

Ideas:
[ ] Ask for what we're seeing on the screen. Use GPT4-vision (GPT-4 Turbo with vision)
[ ] Adjust dark/light theme CSS according to prefered in the system [https://stackoverflow.com/questions/56393880/how-do-i-detect-dark-mode-using-javascript]
[ ] Make sure the provided API Key is functional (by submiting a dummy API request to Models.list)
[ ] For each query, before sending to /completions, check number of tokens and if the price is gonna be above certain delimited threshold (Options page). if not send right away, if so, ask permission.

[ ] Use API upon extension isntallation to create own API YT assistant associated to the API Key personal account.
[ ] Give user the option to add video transcript to the "knowledge base" (inform about limitations, file size)
[ ] Give knowledge base with timestamps, so we can jump to the video frame.
[ ] Allow the user to ask questions related to what's beeing seen in the video "how to solve this formula?" / "what is the yellow object?" / ...

