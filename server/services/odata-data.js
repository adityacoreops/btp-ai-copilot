import { executeS4Request } from "./s4-client.js";

export async function queryEntity({ serviceUrl, entitySet, top = 20, skip = 0, filter = "", orderBy = "", select = "" }) {
  try {
    const params = {
      "$top": top,
      "$skip": skip,
      "$format": "json"
    };

    if (filter) params["$filter"] = filter;
    if (orderBy) params["$orderby"] = orderBy;
    if (select) params["$select"] = select;

    const cleanServiceUrl = serviceUrl.endsWith("/") ? serviceUrl : `${serviceUrl}/`;
    const targetUrl = `${cleanServiceUrl}${entitySet}`;

    const data = await executeS4Request(targetUrl, params);

    // Uniform structural parsing (V2 vs V4 structure alignment)
    if (data && data.d) {
      if (Array.isArray(data.d.results)) {
        return data.d.results;
      } else if (Array.isArray(data.d)) {
        return data.d;
      }
      return [data.d];
    } else if (data && Array.isArray(data.value)) {
      return data.value;
    } else if (data) {
      return Array.isArray(data) ? data : [data];
    }

    return [];
  } catch (error) {
    console.error(`OData query execution failed on ${entitySet}:`, error.message);
    throw error;
  }
}