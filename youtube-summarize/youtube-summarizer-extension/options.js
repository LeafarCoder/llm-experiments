window.addEventListener('load', () => {
    // Get localized strings
    const titleText = document.getElementById('titleText');
    const apiText = document.getElementById('apiText');
    const chooseModelText = document.getElementById('choose-model-text');
    titleText.innerText = chrome.i18n.getMessage('optionsTitle');
    apiText.innerText = chrome.i18n.getMessage('apiTitle');
    chooseModelText.innerText = chrome.i18n.getMessage('apiModelTitle');

    const save_api_key_btn = document.getElementById('save_api_key');
    // Disable the submit button by default
    save_api_key_btn.disabled = true;

    // Get the input field
    const api_key_value = document.getElementById('api_key_value');
    // Hide the API key input field
    // content.type = 'password';
    // Enable the submit button if the input field is not empty
    api_key_value.addEventListener('input', () => {
        save_api_key_btn.disabled = api_key_value.value.length < 10;
    });

    // insert the saved API key into the input field if it exists
    chrome.storage.local.get('apiKey', ({ apiKey }) => {
        if (apiKey) {
            api_key_value.value = apiKey;
        }
    });

    const toggle_show_api_key_btn = document.getElementById('toggle_show_api_key');
    toggle_show_api_key_btn.addEventListener('click', () => {
        if (api_key_value.type === "password"){
            api_key_value.type = "text";
        }else{
            api_key_value.type = "password";
        }
    });

    // Save the insert API key to local storage
    save_api_key_btn.addEventListener('click', async () => {
        const apiKey = api_key_value.value;

        // Check if API Key is valid with a dymmy request
        try {
            // send the request containing the messages to the OpenAI API
            let response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            // check if the API response is ok Else throw an error
            if (!response.ok) {
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }

            // get the data from the API response as json
            let data = await response.json();
            console.log(data);

            // Store API Key on Chrome Storage
            chrome.storage.local.set({ apiKey }, () => {
                const status = document.getElementById('status');
                status.innerHTML = 'API key saved. The extension is ready to use.';
                status.style.color = 'lightgreen';
                setTimeout(function (){status.innerHTML = "";}, 3000);
            });
            
        } catch (error) {
            const status = document.getElementById('status');
            status.innerHTML = "The provided API Key is not valid.";
            status.style.color = 'red';
            setTimeout(function (){status.innerHTML = "";}, 3000);
        }
        save_api_key_btn.disabled = true;

    });

    // Delete the API key from local storage
    function deleteApiKey() {
        chrome.storage.local.set({ apiKey: '' });
        api_key_value.value = '';
    }

    // Reset the API key on button click
    const reset_api_key = document.getElementById('reset_api_key');
    reset_api_key.addEventListener('click', (event) => {
        deleteApiKey();
        const status = document.getElementById('status');
        status.innerHTML = 'API key deleted. Please enter a new API key.';
        status.style.color = 'red';
        setTimeout(function (){status.innerHTML = "";}, 3000);
    });

    // Set up the API model select dropdown
    const apiModelSelect = document.getElementById('apiModel');

    // Load the saved API model setting from Chrome storage and set the dropdown to the saved value
    chrome.storage.local.get('apiModel', ({ apiModel }) => {
        const defaultModel = 'gpt-3.5-turbo';
        if (!apiModel) {
            chrome.storage.local.set({ apiModel: defaultModel });
            apiModelSelect.value = defaultModel;
        } else {
            apiModelSelect.value = apiModel;
        }
    });

    // Save the selected API model to Chrome storage when the dropdown value changes
    apiModelSelect.addEventListener('change', () => {
        chrome.storage.local.set({ apiModel: apiModelSelect.value });
    });
});