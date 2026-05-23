// import { executeS4Request } from "./s4-client.js";

// /**
//  * Discovers available OData services from the S/4HANA Catalog Service.
//  * Robustly parses both unwrapped CAP arrays and nested raw payloads,
//  * and limits the results to the first 10 items.
//  */
// export async function discoverServices() {
//   try {
//     const data = await executeS4Request(
//       "/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection",
//       { "$format": "json" }
//     );

//     let results = [];

//     // Robust payload structure checking
//     if (Array.isArray(data)) {
//       results = data;
//     } else if (data?.d?.results) {
//       results = data.d.results;
//     } else if (data?.value) {
//       results = data.value;
//     } else if (data?.d) {
//       results = Array.isArray(data.d) ? data.d : [data.d];
//     }

//     // --- DIAGNOSTIC LOG ---
//     // This outputs the exact payload structure to your terminal logs
//     if (results.length > 0) {
//       console.log("--- DIAGNOSTIC: First raw S/4 Catalog record properties ---");
//       console.log(JSON.stringify(results[0], null, 2));
//       console.log("-----------------------------------------------------------");
//     }

//     // Limit to only the first 10 services for performance and UI clarity
//     const limitedResults = results.slice(0, 10);

//     return limitedResults.map((service) => {
//       // Handle PascalCase (raw S/4) and camelCase (CAP map) property cases
//       const technicalName = service.TechnicalName || service.technicalName || "";
//       const title = service.Title || service.title || technicalName;
//       const description = service.Description || service.description || "";
//       const version = service.Version || service.version || "1";
      
//       // Look for any possible URL field casing variations
//       let serviceUrl = 
//         service.BaseUrl || 
//         service.BaseURL || 
//         service.baseUrl || 
//         service.baseURL || 
//         service.serviceUrl || 
//         service.Url || 
//         service.URL || 
//         "";

//       // CRITICAL FALLBACK: If the catalog did not provide a URL, construct the standard
//       // SAP Gateway convention URL: /sap/opu/odata/sap/<TECHNICAL_NAME>
//       if (!serviceUrl && technicalName) {
//         serviceUrl = `/sap/opu/odata/sap/${technicalName}`;
//       }

//       return {
//         technicalName,
//         version,
//         title,
//         description,
//         serviceUrl
//       };
//     });
//   } catch (error) {
//     console.error("OData Service Discovery failed:", error.message);
    
//     // Fallback catalog list to ensure standard APIs are clickable even on error
//     return [
//       {
//         technicalName: "API_BUSINESS_PARTNER",
//         version: "1",
//         title: "Business Partner API",
//         description: "Read & write access to Business Partner master data",
//         serviceUrl: "/sap/opu/odata/sap/API_BUSINESS_PARTNER"
//       },
//       {
//         technicalName: "API_SALES_ORDER_SRV",
//         version: "1",
//         title: "Sales Order API",
//         description: "Access sales order document lines and statuses",
//         serviceUrl: "/sap/opu/odata/sap/API_SALES_ORDER_SRV"
//       }
//     ];
//   }
// }

import { executeS4Request } from "./s4-client.js";

/**
 * Extracts only the relative pathname from an absolute S/4 URL.
 * e.g., "http://host:8000/sap/opu/odata/sap/ADT_SRV" -> "/sap/opu/odata/sap/ADT_SRV"
 */
function extractRelativePath(urlStr) {
  if (!urlStr) return "";
  try {
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      const url = new URL(urlStr);
      return url.pathname;
    }
    return urlStr;
  } catch (e) {
    return urlStr;
  }
}

/**
 * Discovers available OData services from the S/4HANA Catalog Service.
 * Robustly parses both unwrapped CAP arrays and nested raw payloads,
 * and limits the results to the first 10 items.
 */
export async function discoverServices() {
  try {
    const data = await executeS4Request(
      "/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection",
      { "$format": "json" }
    );

    let results = [];

    // Robust payload structure checking
    if (Array.isArray(data)) {
      results = data;
    } else if (data?.d?.results) {
      results = data.d.results;
    } else if (data?.value) {
      results = data.value;
    } else if (data?.d) {
      results = Array.isArray(data.d) ? data.d : [data.d];
    }

    // Limit to only the first 10 services for performance and UI clarity
    // const limitedResults = results.slice(0, 10);

    return results.map((service) => {
      // FIX: Align keys to match your S/4 system's specific catalog properties
      const technicalName = 
        service.Title || 
        service.TechnicalServiceName || 
        service.TechnicalName || 
        service.technicalName || 
        "";

      const title = service.Title || service.TechnicalServiceName || technicalName;
      const description = service.Description || service.description || "";
      const version = service.Version || service.TechnicalServiceVersion || service.version || "1";
      
      // FIX: Map the absolute 'ServiceUrl' property and extract the relative path
      const rawUrl = 
        service.ServiceUrl || 
        service.BaseUrl || 
        service.BaseURL || 
        service.baseUrl || 
        service.baseURL || 
        service.serviceUrl || 
        "";

      let serviceUrl = extractRelativePath(rawUrl);

      // Fail-safe construction in case path extraction returns empty
      if (!serviceUrl && technicalName) {
        serviceUrl = `/sap/opu/odata/sap/${technicalName}`;
      }

      return {
        technicalName,
        version,
        title,
        description,
        serviceUrl
      };
    });
  } catch (error) {
    console.error("OData Service Discovery failed:", error.message);
    
    // Fallback catalog list to ensure standard APIs are clickable even on error
    return [
      {
        technicalName: "API_BUSINESS_PARTNER",
        version: "1",
        title: "Business Partner API",
        description: "Read & write access to Business Partner master data",
        serviceUrl: "/sap/opu/odata/sap/API_BUSINESS_PARTNER"
      },
      {
        technicalName: "API_SALES_ORDER_SRV",
        version: "1",
        title: "Sales Order API",
        description: "Access sales order document lines and statuses",
        serviceUrl: "/sap/opu/odata/sap/API_SALES_ORDER_SRV"
      }
    ];
  }
}