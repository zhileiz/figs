import neo4j, { Node, Relationship, Integer } from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password'

console.log('Connecting to Neo4j at:', NEO4J_URI)

// Create a driver instance
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
)

// Helper function to convert Neo4j Integer to regular number
export const toNumber = (value: Integer): number => {
  return value.toNumber()
}

// Helper function to convert Neo4j Node to a plain object
export const nodeToObject = (node: Node) => {
  const convertedProperties: Record<string, any> = {}
  
  // Convert any Neo4j Integer properties to plain numbers
  for (const [key, value] of Object.entries(node.properties)) {
    if (neo4j.isInt(value)) {
      convertedProperties[key] = toNumber(value)
    } else {
      convertedProperties[key] = value
    }
  }

  return {
    id: toNumber(node.identity),
    labels: node.labels,
    properties: convertedProperties
  }
}

// Helper function to convert Neo4j Relationship to a plain object
export const relationshipToObject = (rel: Relationship) => {
  return {
    id: toNumber(rel.identity),
    type: rel.type,
    properties: rel.properties,
    startNodeId: toNumber(rel.start),
    endNodeId: toNumber(rel.end)
  }
}

export { driver } 