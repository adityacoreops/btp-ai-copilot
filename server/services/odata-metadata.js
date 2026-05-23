import { XMLParser } from "fast-xml-parser";
import { executeS4Request } from "./s4-client.js";

function ensureArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export async function fetchMetadata(serviceUrl) {
  const cleanUrl = serviceUrl.endsWith("/") ? serviceUrl : `${serviceUrl}/`;
  const xml = await executeS4Request(`${cleanUrl}$metadata`);
  return xml;
}

export function parseAndExtractMetadata(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    removeNSPrefix: true // Drops 'edmx:' and 'sap:' namespaces cleanly
  });

  const parsed = parser.parse(xmlString);
  const edmx = parsed.Edmx || {};
  const dataServices = edmx.DataServices || {};
  const schemas = ensureArray(dataServices.Schema);

  const entityTypesMap = {};
  const entitySets = [];

  for (const schema of schemas) {
    const namespace = schema.Namespace || "";

    // Parse EntityTypes
    const entityTypes = ensureArray(schema.EntityType);
    for (const type of entityTypes) {
      const typeName = type.Name;
      const keyProps = [];
      if (type.Key) {
        const refs = ensureArray(type.Key.PropertyRef);
        refs.forEach(r => { if (r.Name) keyProps.push(r.Name); });
      }

      const properties = ensureArray(type.Property).map(p => ({
        name: p.Name,
        type: p.Type,
        nullable: p.Nullable !== "false",
        maxLength: p.MaxLength,
        label: p.label || p.Name
      }));

      const navProperties = ensureArray(type.NavigationProperty).map(n => ({
        name: n.Name,
        relationship: n.Relationship,
        fromRole: n.FromRole,
        toRole: n.ToRole
      }));

      entityTypesMap[`${namespace}.${typeName}`] = {
        name: typeName,
        namespace,
        keys: keyProps,
        properties,
        navProperties
      };
      
      // Shortname mapping fallback
      entityTypesMap[typeName] = entityTypesMap[`${namespace}.${typeName}`];
    }

    // Parse EntityContainers & EntitySets
    const containers = ensureArray(schema.EntityContainer);
    for (const container of containers) {
      const sets = ensureArray(container.EntitySet);
      for (const set of sets) {
        entitySets.push({
          name: set.Name,
          entityType: set.EntityType,
          label: set.label || set.Name
        });
      }
    }
  }

  // Connect EntitySets to their corresponding fields
  const enrichedSets = entitySets.map(set => {
    const qualifiedType = set.entityType || "";
    let typeDef = entityTypesMap[qualifiedType];
    if (!typeDef) {
      const shortTypeName = qualifiedType.split(".").pop();
      typeDef = entityTypesMap[shortTypeName];
    }

    return {
      name: set.name,
      entityType: set.entityType,
      label: set.label,
      keys: typeDef ? typeDef.keys : [],
      properties: typeDef ? typeDef.properties : [],
      navigationProperties: typeDef ? typeDef.navProperties : []
    };
  });

  return {
    entitySets: enrichedSets
  };
}