// Required constants and helper functions
const airtableApiKey = 'patCnUsdz4bORwYNV.5c27cab8c99e7caf5b0dc05ce177182df1a9d60f4afc4a5d4b57802f44c65328';
const airtableBaseId = 'appi4QZE0SrWI6tt2';
const airtableTableName = 'tblQo2148s04gVPq1';
let bidNameSuggestions = [];

// Fetch data from Airtable without caching
async function fetchAirtableData(fieldName, filterFormula = '') {
    let allRecords = [];
    let offset = null;
    do {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
        if (filterFormula) url += `?filterByFormula=${encodeURIComponent(filterFormula)}`;
        if (offset) url += `${filterFormula ? '&' : '?'}offset=${offset}`;

        try {
            const response = await fetch(url, { headers: { Authorization: `Bearer ${airtableApiKey}` } });
            const data = await response.json();
            allRecords = allRecords.concat(data.records);
            offset = data.offset;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    } while (offset);

    return allRecords;
}

// Fetch "Bid Name" suggestions
async function fetchBidNameSuggestions() {
    const records = await fetchAirtableData('Bid Name', "NOT({Outcome}='Win')");
    bidNameSuggestions = records.map(record => record.fields['Bid Name']).filter(Boolean);
}

// Fetch builder by "Bid Name"
async function fetchBuilderByBidName(bidName) {
    const filterFormula = `{Bid Name} = "${bidName.replace(/"/g, '\\"')}"`;
    const records = await fetchAirtableData('Builder', filterFormula);
    return records.length ? records[0].fields['Builder'] : '';
}

// Function to create autocomplete input
function createAutocompleteInput(placeholder, suggestions, onSelection) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("autocomplete-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.classList.add("autocomplete-input");

    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    input.addEventListener("input", function () {
        const inputValue = input.value.toLowerCase();
        dropdown.innerHTML = ''; // Clear suggestions

        if (inputValue) {
            suggestions
                .filter(item => item.toLowerCase().includes(inputValue))
                .forEach(suggestion => {
                    const option = document.createElement("div");
                    option.classList.add("autocomplete-option");
                    option.textContent = suggestion;
                    option.onclick = async () => {
                        input.value = suggestion;
                        dropdown.innerHTML = '';
                        const builder = await onSelection(suggestion);
                        updateTemplateText(suggestion, builder);
                    };
                    dropdown.appendChild(option);
                });
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);

    return wrapper;
}

// Function to update all instances of "Subdivision" and "Builder"
function updateTemplateText(subdivision, builder) {
    document.querySelectorAll('.subdivisionContainer').forEach(el => (el.textContent = subdivision));
    document.querySelectorAll('.builderContainer').forEach(el => (el.textContent = builder));
}

// Populate the email template
async function populateEmailTemplate() {
    await fetchBidNameSuggestions();

    const subdivisionInputWrapper = createAutocompleteInput("Enter Bid Name", bidNameSuggestions, fetchBuilderByBidName);

    const emailContent = `
        <h2> Branch Staff@Vanir.com</h2>
        <p>CC: Vendor</p>
        <p><strong>Subject:</strong> WINNING! | <span class="subdivisionContainer"></span> | <span class="builderContainer"></span></p>
        <p>Dear Team,</p>
        <p>We are excited to announce that we have won a new project in <strong><span class="subdivisionContainer"></span></strong> for <strong><span class="builderContainer"></span></strong>. Let's coordinate with the relevant vendors and ensure a smooth project initiation.</p><br>
        
        <!--  Subcontractors  -->
        <h2>To: Subcontractors@example.com</h2>
        <p><strong>Subject:</strong> New Community | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>We are thrilled to inform you that we have been awarded a new community, <strong><span class="subdivisionContainer"></span></strong>, in collaboration with <strong><span class="builderContainer"></span></strong>. We look forward to working together and maintaining high standards for this project.</p>
        
<!-- Spanish -->
        <p><strong>Asunto:</strong> Nueva Comunidad | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>Nos complace informarles que hemos sido galardonados con una nueva comunidad, <strong><span class="subdivisionContainer"></span></strong>, en colaboración con <strong><span class="builderContainer"></span></strong>. Esperamos trabajar juntos y mantener altos estándares para este proyecto.</p>
        

        <!-- Portuguese -->
        <p><strong>Assunto:</strong> Nova Comunidade | <span class="builderContainer"></span> | <span class="subdivisionContainer"></span></p>
        <p>Estamos entusiasmados em informar que fomos premiados com uma nova comunidade, <strong><span class="subdivisionContainer"></span></strong>, em colaboração com <strong><span class="builderContainer"></span></strong>. Esperamos trabalhar juntos e manter altos padrões para este projeto.</p>
        
        
       <p>Kind regards,<br>Vanir Installed Sales Team</p>
`;

    const emailContainer = document.getElementById('emailTemplate');
    emailContainer.innerHTML = emailContent;
    emailContainer.prepend(subdivisionInputWrapper);
}

document.addEventListener('DOMContentLoaded', populateEmailTemplate);
