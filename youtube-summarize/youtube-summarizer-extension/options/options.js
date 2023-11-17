window.addEventListener('load', () => {


    // ###################################################
    // VARIABLES
    // ###################################################

    // API Key
    const save_api_key_btn = document.getElementById('save_api_key');
    const api_key_value = document.getElementById('api_key_value');
    const toggle_show_api_key_btn = document.getElementById('toggle_show_api_key');
    const apikey_status = document.getElementById('status');
    const reset_api_key = document.getElementById('reset_api_key');

    // LLM Model
    const apiModelSelect = document.getElementById('apiModel');

    // Captions Language
    const captionsLanguageSelect = document.getElementById('captionsLanguage');
    


    // ###################################################
    // SETUP ELEMENTS
    // ###################################################

    // Disable the submit button by default
    save_api_key_btn.disabled = true;
    // Hide the API key input field
    api_key_value.type = 'password';
    // insert the saved API key into the input field if it exists
    chrome.storage.sync.get(['openAI_apiKey'])
    .then((result) => {
        if("openAI_apiKey" in result){
            api_key_value.value = result.openAI_apiKey;
        }
    });

    
    // ###################################################
    // EVENT LISTENERS
    // ###################################################

    // Enable the submit button if the input field is not empty
    api_key_value.addEventListener('input', () => {
        save_api_key_btn.disabled = api_key_value.value.length < 30;
    });
    toggle_show_api_key_btn.addEventListener('click', () => {
        if (api_key_value.type === "password"){
            api_key_value.type = "text";
            toggle_show_api_key_btn.innerHTML = '<i class="fa fa-eye"></i>';
        }else{
            api_key_value.type = "password";
            toggle_show_api_key_btn.innerHTML = '<i class="fa fa-eye-slash"></i>';
        }
    });

    // If the user presses enter, click the save_api_key_btn
    api_key_value.addEventListener("keyup", (event) => {
        if (event.code === "Enter" && !save_api_key_btn.disabled) {
          save_api_key_btn.click();
        }
      });

    // Save the insert API key to sync storage
    save_api_key_btn.addEventListener('click', async () => {
        const apiKey = api_key_value.value;

        // Check if API Key is valid with a dymmy request
        try {
            // send the request containing the messages to the OpenAI API
            let response = await fetch('https://api.openai.com/v1/models/gpt-4', {
                method: 'GET',
                headers: {'Authorization': `Bearer ${apiKey}`}
            });

            // check if the API response is ok Else throw an error
            if (!response.ok) {throw new Error(`Failed to fetch. Status code: ${response.status}`);}

            // get the data from the API response as json
            let data = await response.json();
            console.log("Dummy data to confirm API:");
            console.log(data);

            // Store API Key on Chrome Storage
            chrome.storage.sync.set({ openAI_apiKey: apiKey }, () => {
                statusMessage(apikey_status, 'API key saved. The extension is ready to use.', 3000);
            });
            
        } catch (error) {
            statusMessage(apikey_status, 'The provided API Key is not valid.', 3000, type='error');
        }
        save_api_key_btn.disabled = true;

    });

    // Reset the API key on button click
    reset_api_key.addEventListener('click', (event) => {
        deleteApiKey();
        statusMessage(apikey_status, 'API key deleted. Please enter a new API key.', 3000);
    });


    // Load the saved API model setting from Chrome storage and set the dropdown to the saved value
    chrome.storage.sync.get('apiModel', ({ apiModel }) => {
        const defaultModel = 'gpt-3.5-turbo';
        if (!apiModel) {
            chrome.storage.sync.set({ apiModel: defaultModel });
            apiModelSelect.value = defaultModel;
        } else {
            apiModelSelect.value = apiModel;
        }
    });

    // Save the selected API model to Chrome storage when the dropdown value changes
    apiModelSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ apiModel: apiModelSelect.value });
    });

    // Save the selected captions default language to Chrome storage when the dropdown value changes
    captionsLanguageSelect.addEventListener('change', () => {
        chrome.storage.sync.set({ captionsLanguage: captionsLanguageSelect.value });
        // Send to background.js to update worker
        chrome.runtime.sendMessage({
            action: "UPDATE_CAPTIONS_LANGUAGE",
            data: {captions_language: captionsLanguageSelect.value}
        }, (response) => {console.log(response);}
      );
    });


    // ###################################################
    // AUXILIARY FUNCTIONS
    // ###################################################

    // Delete the API key from local storage
    function deleteApiKey() {
        chrome.storage.sync.set({ openAI_apiKey: '' });
        api_key_value.value = '';
    }

    // Show a status message
    function statusMessage(element, message, timeout, type='info') {
        element.innerHTML = message;
        let color = 'lightgreen';
        if(type == 'info'){
            color = 'lightgreen';
        }else if(type == 'error'){
            color = 'red';
        }
        element.style.color = color;
        setTimeout(function (){element.innerHTML = "";}, timeout);
    }
});