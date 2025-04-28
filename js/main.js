//  Handling UI interactions for the API testing tool
// Function to switch between main tabs
function switchMainTab(button) {
    let tabId = button.getAttribute('data-tab');

    // Hide all tabs
    let allTabButtons = document.querySelectorAll('.tab-btn');
    let allTabContents = document.querySelectorAll('.tab-content');

    allTabButtons.forEach(btn => btn.classList.remove('active'));
    allTabContents.forEach(content => content.classList.remove('active'));

    // Show selected tab
    button.classList.add('active');
    document.getElementById(tabId + '-tab').classList.add('active');
}

// Function to switch between response tabs
function switchResponseTab(button) {
    let tabId = button.getAttribute('data-tab');

    // Hide all response tabs
    let allResponseButtons = document.querySelectorAll('.response-tab-btn');
    let allResponseContents = document.querySelectorAll('.response-tab-content');

    allResponseButtons.forEach(btn => btn.classList.remove('active'));
    allResponseContents.forEach(content => content.classList.remove('active'));

    // Show selected response tab
    button.classList.add('active');
    document.getElementById('response-' + tabId + '-tab').classList.add('active');
}

// Function to create new row (for params or headers)
function createNewRow(type) {
    let newRow = document.createElement('div');
    newRow.className = type + '-row';

    newRow.innerHTML = `
        <input type="text" class="${type}-key" placeholder="Key">
        <input type="text" class="${type}-value" placeholder="Value">
        <button type="button" class="btn-remove">×</button>
    `;

    document.querySelector('.' + type + 's-list').appendChild(newRow);

    // Add delete button functionality
    let deleteButton = newRow.querySelector('.btn-remove');
    deleteButton.addEventListener('click', () => newRow.remove());
}

// Function to render headers as table
function renderHeadersTable(headers) {
    const table = document.createElement('table');

    let tableRows = '<tr><th>Header</th><th>Value</th></tr>';

    Object.entries(headers).forEach(([key, value]) => {
        tableRows += `<tr><td>${key}</td><td>${value}</td></tr>`;
    });

    table.innerHTML = tableRows;

    const headerContainer = document.getElementById('response-headers');
    if (headerContainer) {
        headerContainer.innerHTML = '';
        headerContainer.appendChild(table);
    }
}

// Function to Send API request
async function sendApiRequest() {
    const urlElement = document.getElementById('endpoint-url');
    const methodElement = document.getElementById('method');

    if (!urlElement || !methodElement) {
        console.error('Required elements not found in the DOM');
        return;
    }

    const url = urlElement.value;
    const method = methodElement.value;

    if (!url) {
        alert('Please enter a URL');
        return;
    }

    // Show loading state
    const responseStatus = document.getElementById('response-status');
    if (responseStatus) {
        responseStatus.textContent = 'Loading...';
    }

    // Get parameters
    let params = {};
    document.querySelectorAll('.param-row').forEach(row => {
        let keyInput = row.querySelector('.param-key');
        let valueInput = row.querySelector('.param-value');

        if (keyInput && valueInput && keyInput.value) {
            params[keyInput.value] = valueInput.value;
        }
    });

    // Get headers
    let headers = {};
    document.querySelectorAll('.header-row').forEach(row => {
        let keyInput = row.querySelector('.header-key');
        let valueInput = row.querySelector('.header-value');

        if (keyInput && valueInput && keyInput.value) {
            headers[keyInput.value] = valueInput.value;
        }
    });

    // Get request body
    const bodyContentElement = document.getElementById('body-content');
    let bodyData = bodyContentElement ? bodyContentElement.value : '';
    let requestBody = {};

    if (bodyData) {
        try {
            requestBody = JSON.parse(bodyData);
        } catch (error) {
            alert('Invalid JSON in request body');
            if (responseStatus) {
                responseStatus.textContent = 'Error: Invalid JSON in request body';
            }
            return;
        }
    }

    // Prepare data for sending
    const data = {
        url: url,
        method: method,
        params: params,
        headers: headers,
        body: requestBody
    };

    try {
        // Send request to Flask backend
        const response = await axios.post(`http://localhost:8000/${method.toLowerCase()}`, data);

        // Display response
        const responseBodyElement = document.getElementById('response-body');
        if (responseBodyElement) {
            if (response.data.method != "GET") {
                responseData = response.data.body.body;
            }
            else {
                responseData = response.data.body;
            }
            responseBodyElement.textContent = JSON.stringify(responseData, null, 2);
            document.getElementById('size-container').textContent = `Size: ${response.data.request_size_kb}`;
            document.getElementById('response-time').textContent = `${response.data.time}`;
        }

        // Handle headers display
        if (response.data.method === "GET") {
            renderHeadersTable(response.data.headers);
        }
        else {
            renderHeadersTable(response.data.body.headers);
        }
        console.log(response.data)
        // Update status
        if (responseStatus) {
            responseStatus.textContent = `Status: ${response.status} ${response.statusText}`;
        }
    } catch (error) {
        console.error('Request error:', error);

        // Handle errors
        const responseBodyElement = document.getElementById('response-body');
        if (responseBodyElement) {
            const errorData = error.response?.data || { message: error.message };
            responseBodyElement.textContent = JSON.stringify(errorData, null, 2);
        }

        if (responseStatus) {
            const statusText = error.response?.statusText || 'Request Failed';
            const status = error.response?.status || '';
            responseStatus.textContent = `Error: ${status} ${statusText}`;
        }
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add click events for main tabs
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => switchMainTab(button));
    });

    // Add click events for response tabs
    document.querySelectorAll('.response-tab-btn').forEach(button => {
        button.addEventListener('click', () => switchResponseTab(button));
    });

    // Add click event for adding new parameter
    const addParamButton = document.getElementById('add-param');
    if (addParamButton) {
        addParamButton.addEventListener('click', () => createNewRow('param'));
    }

    // Add click event for adding new header
    const addHeaderButton = document.getElementById('add-header');
    if (addHeaderButton) {
        addHeaderButton.addEventListener('click', () => createNewRow('header'));
    }

    // Add click events for format buttons
    document.querySelectorAll('.format-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all format buttons
            document.querySelectorAll('.format-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button
            button.classList.add('active');
        });
    });

    // Add delete functionality to existing remove buttons
    document.querySelectorAll('.btn-remove').forEach(button => {
        button.addEventListener('click', (e) => e.target.closest('.param-row, .header-row').remove());
    });

    // Add click event for send request button
    const sendRequestButton = document.getElementById('send-request');
    if (sendRequestButton) {
        sendRequestButton.addEventListener('click', sendApiRequest);
    }

    // Add initial parameter and header rows
    createNewRow('param');
    createNewRow('header');
});