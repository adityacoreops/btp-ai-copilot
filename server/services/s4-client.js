// import cds from "@sap/cds";

// // Resolves automatically to "S4D" or falls back to "S4HANA_ONPREM"
// const DESTINATION_NAME = process.env.S4HANA_DESTINATION_NAME || "S4D";

// /**
//  * Executes a GET request to S/4HANA using CAPM's dynamic service provisioning.
//  */
// export async function executeS4Request(url, params = {}) {
//   try {
//     // Dynamically provision the service configuration directly in-memory.
//     // This allows CAP to accept any destination name (like 'S4D') without package.json declarations.
//     const service = await cds.connect.to(DESTINATION_NAME, {
//       kind: "odata",
//       credentials: {
//         destination: DESTINATION_NAME
//       }
//     });

//     // Execute the GET request via CAP's unified service interface
//     const response = await service.get(url, params);
//     return response;
//   } catch (error) {
//     console.error(`CAP Dynamic Connection failed on ${url}:`, error.message);
//     throw error;
//   }
// }

import cds from "@sap/cds";

const DESTINATION_NAME = process.env.S4HANA_DESTINATION_NAME || "S4D";

/**
 * Executes a GET request to S/4HANA using CAPM's dynamic REST connector.
 * Serializes query parameters directly onto the URL path to bypass CQN validation.
 */
export async function executeS4Request(url, params = {}) {
  try {
    const service = await cds.connect.to(DESTINATION_NAME, {
      kind: "rest",
      credentials: {
        destination: DESTINATION_NAME
      }
    });

    const headers = {};

    // Force XML Accept Header for $metadata requests, otherwise default to JSON
    if (url.includes("$metadata")) {
      headers["Accept"] = "application/xml, text/xml, */*";
    } else {
      headers["Accept"] = "application/json, */*";
    }

    // --- FIX: Serialize query params onto the path ---
    // Converting the params object into a standard query string string prevents 
    // CAP from attempting to parse it as CAP Query Notation (CQN).
    let path = url;
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      path = `${url}?${queryString}`;
    }

    // Execute the request via dynamic REST pathway
    const response = await service.send({
      method: "GET",
      path: path,
      headers: headers
    });

    return response;
  } catch (error) {
    console.error(`CAP Connection Request failed on ${url}:`, error.message);
    throw error;
  }
}