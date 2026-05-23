// import { marked } from "marked";
// import { Chart, registerables } from "chart.js";
// Chart.register(...registerables);

// // Client State
// let activeService = null;
// let activeMetadata = null;
// let activeEntity = null;
// let currentChart = null;

// // Initialize Elements
// const servicesList = document.getElementById("services-list");
// const serviceSearch = document.getElementById("service-search");
// const selectedServiceTitle = document.getElementById("selected-service-title");
// const selectedServiceDesc = document.getElementById("selected-service-description");
// const entityDropdown = document.getElementById("entity-dropdown");
// const schemaTableBody = document.querySelector("#schema-display-table tbody");
// const resultsTableHead = document.getElementById("results-table-head");
// const resultsTableBody = document.getElementById("results-table-body");
// const recordCounter = document.getElementById("records-counter");
// const chatMessages = document.getElementById("chat-messages");
// const userInput = document.getElementById("user-input");
// const sendBtn = document.getElementById("send-btn");

// // 1. Fetch S/4HANA Services Catalog
// async function fetchServices() {
//   try {
//     const res = await fetch("/api/services");
//     const data = await res.json();
//     if (data.success) {
//       renderServices(data.services);
//     } else {
//       servicesList.innerHTML = `<p class="status-msg text-error">Failed loading: ${data.error}</p>`;
//     }
//   } catch (err) {
//     servicesList.innerHTML = `<p class="status-msg text-error">Local Service Error</p>`;
//     console.error(err);
//   }
// }

// function renderServices(services) {
//   servicesList.innerHTML = services
//     .map(srv => `
//       <div class="service-card" data-url="${srv.serviceUrl}" data-name="${srv.technicalName}" data-title="${srv.title}" data-desc="${srv.description}">
//         <h3>${srv.title}</h3>
//         <p>${srv.technicalName}</p>
//       </div>
//     `).join("");

//   document.querySelectorAll(".service-card").forEach(card => {
//     card.addEventListener("click", () => selectService(card));
//   });
// }

// // Service Filter Input Handler
// serviceSearch.addEventListener("input", (e) => {
//   const query = e.target.value.toLowerCase();
//   document.querySelectorAll(".service-card").forEach(card => {
//     const text = card.textContent.toLowerCase();
//     card.style.display = text.includes(query) ? "block" : "none";
//   });
// });

// // 2. Select & Load Active Service Schema
// async function selectService(cardElement) {
//   document.querySelectorAll(".service-card").forEach(c => c.classList.remove("active"));
//   cardElement.classList.add("active");

//   activeService = {
//     url: cardElement.dataset.url,
//     name: cardElement.dataset.name,
//     title: cardElement.dataset.title,
//     desc: cardElement.dataset.desc
//   };

//   selectedServiceTitle.textContent = activeService.title;
//   selectedServiceDesc.textContent = activeService.desc;

//   entityDropdown.innerHTML = '<option value="">Fetching entities...</option>';
//   entityDropdown.disabled = true;

//   try {
//     const res = await fetch(`/api/metadata?servicePath=${encodeURIComponent(activeService.url)}`);
//     const data = await res.json();

//     if (data.success) {
//       activeMetadata = data.metadata;
//       populateEntities(data.metadata.entitySets);
//     }
//   } catch (err) {
//     console.error("Schema fetch error:", err);
//   }
// }

// function populateEntities(entitySets) {
//   if (entitySets.length === 0) {
//     entityDropdown.innerHTML = '<option value="">-- No Entities Extracted --</option>';
//     return;
//   }

//   entityDropdown.innerHTML = '<option value="">-- Select Entity Set --</option>' + 
//     entitySets.map(set => `<option value="${set.name}">${set.name}</option>`).join("");
//   entityDropdown.disabled = false;
// }

// // 3. Entity Selection & Rendering Live OData records
// entityDropdown.addEventListener("change", async (e) => {
//   const entityName = e.target.value;
//   if (!entityName) return;

//   const foundSet = activeMetadata.entitySets.find(set => set.name === entityName);
//   activeEntity = foundSet;

//   // Render Structural Properties UI
//   renderPropertiesTable(foundSet.properties);

//   // Load Database Records
//   await fetchLiveRecords(foundSet);
  
//   // Enable Grounded Chat inputs
//   userInput.disabled = false;
//   sendBtn.disabled = false;
//   appendSystemMessage(`Grounding context loaded. Ask me about "${entityName}".`);
// });

// function renderPropertiesTable(properties) {
//   schemaTableBody.innerHTML = properties.map(p => `
//     <tr>
//       <td><strong>${p.name}</strong></td>
//       <td><code>${p.type.replace("Edm.", "")}</code></td>
//       <td>${p.label || ""}</td>
//     </tr>
//   `).join("");
// }

// async function fetchLiveRecords(entitySet) {
//   resultsTableHead.innerHTML = '<tr><th class="status-msg">Fetching records...</th></tr>';
//   resultsTableBody.innerHTML = '';

//   try {
//     const res = await fetch(`/api/data/query?serviceUrl=${encodeURIComponent(activeService.url)}&entitySet=${entitySet.name}&top=15`);
//     const data = await res.json();

//     if (data.success && data.results.length > 0) {
//       const records = data.results;
//       recordCounter.textContent = `${records.length} Rows`;

//       // Render Headers dynamically from object keys
//       const keys = Object.keys(records[0]).filter(k => k !== "__metadata");
//       resultsTableHead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>`;

//       resultsTableBody.innerHTML = records.map(rec => `
//         <tr>
//           ${keys.map(k => `<td>${rec[k] !== null ? rec[k] : ""}</td>`).join("")}
//         </tr>
//       `).join("");
//     } else {
//       resultsTableHead.innerHTML = '<tr><th>No Data Found</th></tr>';
//       resultsTableBody.innerHTML = '<tr><td class="status-msg">Active entity is empty.</td></tr>';
//       recordCounter.textContent = "0 Rows";
//     }
//   } catch (err) {
//     resultsTableHead.innerHTML = '<tr><th>Request Failed</th></tr>';
//     console.error("Live Query error:", err);
//   }
// }

// // 4. Copilot Conversational Chat Layer
// sendBtn.addEventListener("click", handleChatInput);
// userInput.addEventListener("keypress", (e) => {
//   if (e.key === "Enter") handleChatInput();
// });

// async function handleChatInput() {
//   const text = userInput.value.trim();
//   if (!text) return;

//   appendMessage("user", text);
//   userInput.value = "";

//   const loaderId = appendMessage("assistant", `<div class="status-msg">Thinking...</div>`);

//   try {
//     const res = await fetch("/api/copilot/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         prompt: text,
//         serviceUrl: activeService.url,
//         serviceName: activeService.title,
//         entitySetName: activeEntity.name,
//         schema: activeEntity
//       })
//     });

//     const data = await res.json();
//     const loaderElem = document.getElementById(loaderId);

//     if (data.success) {
//       const { responseText, parsedChart } = processResponseContent(data.response);
//       loaderElem.innerHTML = marked.parse(responseText);

//       if (parsedChart) {
//         renderChart(parsedChart);
//       }
//     } else {
//       loaderElem.textContent = `Orchestration Error: ${data.error}`;
//     }
//   } catch (err) {
//     console.error("Co-analyst payload error:", err);
//   }
// }

// function processResponseContent(text) {
//   let responseText = text;
//   let parsedChart = null;

//   const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
//   const match = text.match(jsonRegex);

//   if (match) {
//     try {
//       const parsedObj = JSON.parse(match[1]);
//       if (parsedObj.chart) {
//         parsedChart = parsedObj.chart;
//         // Strip the raw code block from the written chat bubble representation
//         responseText = text.replace(match[0], "");
//       }
//     } catch (e) {
//       console.warn("Found trailing code block but failed standard chart mapping:", e.message);
//     }
//   }

//   return { responseText, parsedChart };
// }

// function renderChart(chartConfig) {
//   const ctx = document.getElementById("analyticsChart").getContext("2d");

//   if (currentChart) {
//     currentChart.destroy();
//   }

//   // Inject dark mode compliant chart config presets
//   currentChart = new Chart(ctx, {
//     type: chartConfig.type || "bar",
//     data: {
//       labels: chartConfig.labels,
//       datasets: chartConfig.datasets.map(ds => ({
//         ...ds,
//         backgroundColor: [
//           "rgba(59, 130, 246, 0.45)",
//           "rgba(168, 85, 247, 0.45)",
//           "rgba(16, 185, 129, 0.45)"
//         ],
//         borderColor: [
//           "#3b82f6",
//           "#a855f7",
//           "#10b981"
//         ],
//         borderWidth: 1
//       }))
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: { labels: { color: "#94a3b8" } }
//       },
//       scales: {
//         x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
//         y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
//       }
//     }
//   });
// }

// function appendMessage(sender, text) {
//   const id = `msg-${Date.now()}`;
//   const div = document.createElement("div");
//   div.className = `chat-msg ${sender}`;
//   div.id = id;
//   div.innerHTML = sender === "user" ? text : marked.parse(text);
//   chatMessages.appendChild(div);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
//   return id;
// }

// function appendSystemMessage(text) {
//   const div = document.createElement("div");
//   div.className = "chat-msg system";
//   div.innerHTML = `<p>${text}</p>`;
//   chatMessages.appendChild(div);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// }

// // Kickstart App
// fetchServices();

import { marked } from "marked";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// Client State
let activeService = null;
let activeMetadata = null;
let activeEntity = null;
let currentChart = null;

// Initialize Elements
const servicesList = document.getElementById("services-list");
const serviceSearch = document.getElementById("service-search");
const selectedServiceTitle = document.getElementById("selected-service-title");
const selectedServiceDesc = document.getElementById("selected-service-description");
const entityDropdown = document.getElementById("entity-dropdown");
const schemaTableBody = document.querySelector("#schema-display-table tbody");
const resultsTableHead = document.getElementById("results-table-head");
const resultsTableBody = document.getElementById("results-table-body");
const recordCounter = document.getElementById("records-counter");
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 1. Fetch S/4HANA Services Catalog
async function fetchServices() {
  try {
    const res = await fetch("/api/services");
    const data = await res.json();
    if (data.success) {
      renderServices(data.services);
    } else {
      servicesList.innerHTML = `<p class="status-msg text-error">Failed loading: ${data.error}</p>`;
    }
  } catch (err) {
    servicesList.innerHTML = `<p class="status-msg text-error">Local Service Error</p>`;
    console.error(err);
  }
}

function renderServices(services) {
  servicesList.innerHTML = services
    .map(srv => {
      // Ensure we map standard properties or fall back cleanly
      const url = srv.serviceUrl || `/sap/opu/odata/sap/${srv.technicalName}`;
      return `
        <div class="service-card" 
             data-url="${url}" 
             data-name="${srv.technicalName}" 
             data-title="${srv.title}" 
             data-desc="${srv.description || ''}">
          <h3>${srv.title}</h3>
          <p>${srv.technicalName}</p>
        </div>
      `;
    }).join("");

  document.querySelectorAll(".service-card").forEach(card => {
    card.addEventListener("click", () => selectService(card));
  });
}

// Service Filter Input Handler
serviceSearch.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll(".service-card").forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? "block" : "none";
  });
});

// 2. Select & Load Active Service Schema
async function selectService(cardElement) {
  document.querySelectorAll(".service-card").forEach(c => c.classList.remove("active"));
  cardElement.classList.add("active");

  let url = cardElement.dataset.url;
  const name = cardElement.dataset.name;

  // --- DOUBLE-LAYERED CLIENT FALLBACK ---
  // If the dataset URL is missing or stringified as "undefined", auto-resolve it
  if (!url || url === "undefined" || url === "") {
    console.warn(`[Client Fallback] Missing URL for service: ${name}. Constructing standard Gateway path.`);
    url = `/sap/opu/odata/sap/${name}`;
  }
  // ---------------------------------------

  activeService = {
    url: url,
    name: name,
    title: cardElement.dataset.title || name,
    desc: cardElement.dataset.desc || ""
  };

  selectedServiceTitle.textContent = activeService.title;
  selectedServiceDesc.textContent = activeService.desc;

  entityDropdown.innerHTML = '<option value="">Fetching entities...</option>';
  entityDropdown.disabled = true;

  try {
    const res = await fetch(`/api/metadata?servicePath=${encodeURIComponent(activeService.url)}`);
    const data = await res.json();

    if (data.success) {
      activeMetadata = data.metadata;
      populateEntities(data.metadata.entitySets);
    } else {
      console.error("Failed to parse metadata:", data.error);
      entityDropdown.innerHTML = '<option value="">-- Failed to load schema --</option>';
    }
  } catch (err) {
    console.error("Schema fetch error:", err);
    entityDropdown.innerHTML = '<option value="">-- Connection error --</option>';
  }
}

function populateEntities(entitySets) {
  if (!entitySets || entitySets.length === 0) {
    entityDropdown.innerHTML = '<option value="">-- No Entities Extracted --</option>';
    return;
  }

  entityDropdown.innerHTML = '<option value="">-- Select Entity Set --</option>' + 
    entitySets.map(set => `<option value="${set.name}">${set.name}</option>`).join("");
  entityDropdown.disabled = false;
}

// 3. Entity Selection & Rendering Live OData records
entityDropdown.addEventListener("change", async (e) => {
  const entityName = e.target.value;
  if (!entityName) return;

  const foundSet = activeMetadata.entitySets.find(set => set.name === entityName);
  activeEntity = foundSet;

  // Render Structural Properties UI
  renderPropertiesTable(foundSet.properties);

  // Load Database Records
  await fetchLiveRecords(foundSet);
  
  // Enable Grounded Chat inputs
  userInput.disabled = false;
  sendBtn.disabled = false;
  appendSystemMessage(`Grounding context loaded. Ask me about "${entityName}".`);
});

function renderPropertiesTable(properties) {
  if (!properties || properties.length === 0) {
    schemaTableBody.innerHTML = `<tr><td colspan="3" class="status-msg">No properties found.</td></tr>`;
    return;
  }
  schemaTableBody.innerHTML = properties.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td><code>${(p.type || "Edm.String").replace("Edm.", "")}</code></td>
      <td>${p.label || ""}</td>
    </tr>
  `).join("");
}

async function fetchLiveRecords(entitySet) {
  resultsTableHead.innerHTML = '<tr><th class="status-msg">Fetching records...</th></tr>';
  resultsTableBody.innerHTML = '';

  try {
    const res = await fetch(`/api/data/query?serviceUrl=${encodeURIComponent(activeService.url)}&entitySet=${entitySet.name}&top=15`);
    const data = await res.json();

    if (data.success && data.results && data.results.length > 0) {
      const records = data.results;
      recordCounter.textContent = `${records.length} Rows`;

      // Render Headers dynamically from object keys
      const keys = Object.keys(records[0]).filter(k => k !== "__metadata");
      resultsTableHead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>`;

      resultsTableBody.innerHTML = records.map(rec => `
        <tr>
          ${keys.map(k => `<td>${rec[k] !== null && rec[k] !== undefined ? rec[k] : ""}</td>`).join("")}
        </tr>
      `).join("");
    } else {
      resultsTableHead.innerHTML = '<tr><th>No Data Found</th></tr>';
      resultsTableBody.innerHTML = '<tr><td class="status-msg">Active entity is empty.</td></tr>';
      recordCounter.textContent = "0 Rows";
    }
  } catch (err) {
    resultsTableHead.innerHTML = '<tr><th>Request Failed</th></tr>';
    console.error("Live Query error:", err);
  }
}

// 4. Copilot Conversational Chat Layer
sendBtn.addEventListener("click", handleChatInput);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleChatInput();
});

async function handleChatInput() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";

  const loaderId = appendMessage("assistant", `<div class="status-msg">Thinking...</div>`);

  try {
    const res = await fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: text,
        serviceUrl: activeService.url,
        serviceName: activeService.title,
        entitySetName: activeEntity.name,
        schema: activeEntity
      })
    });

    const data = await res.json();
    const loaderElem = document.getElementById(loaderId);

    if (data.success) {
      const { responseText, parsedChart } = processResponseContent(data.response);
      loaderElem.innerHTML = marked.parse(responseText);

      if (parsedChart) {
        renderChart(parsedChart);
      }
    } else {
      loaderElem.textContent = `Orchestration Error: ${data.error}`;
    }
  } catch (err) {
    console.error("Co-analyst payload error:", err);
  }
}

function processResponseContent(text) {
  let responseText = text;
  let parsedChart = null;

  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);

  if (match) {
    try {
      const parsedObj = JSON.parse(match[1]);
      if (parsedObj.chart) {
        parsedChart = parsedObj.chart;
        responseText = text.replace(match[0], "");
      }
    } catch (e) {
      console.warn("Found trailing code block but failed standard chart mapping:", e.message);
    }
  }

  return { responseText, parsedChart };
}

function renderChart(chartConfig) {
  const ctx = document.getElementById("analyticsChart").getContext("2d");

  if (currentChart) {
    currentChart.destroy();
  }

  currentChart = new Chart(ctx, {
    type: chartConfig.type || "bar",
    data: {
      labels: chartConfig.labels,
      datasets: chartConfig.datasets.map(ds => ({
        ...ds,
        backgroundColor: [
          "rgba(59, 130, 246, 0.45)",
          "rgba(168, 85, 247, 0.45)",
          "rgba(16, 185, 129, 0.45)"
        ],
        borderColor: [
          "#3b82f6",
          "#a855f7",
          "#10b981"
        ],
        borderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#94a3b8" } }
      },
      scales: {
        x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    }
  });
}

function appendMessage(sender, text) {
  const id = `msg-${Date.now()}`;
  const div = document.createElement("div");
  div.className = `chat-msg ${sender}`;
  div.id = id;
  div.innerHTML = sender === "user" ? text : marked.parse(text);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

function appendSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "chat-msg system";
  div.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Kickstart App
fetchServices();