import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z} from "zod";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { queryInfluxDB, getLatestData, getDataInRange, getRecentActiveMeasurements } from "./influxdb.js";


// Load environment variables from .env file
dotenv.config();



// Create an MCP server
const server = new McpServer({
    name: "Home Dude",
    version: "1.0.0"
});




// Add InfluxDB query tool
server.tool("influxdb-query",
    { query: z.string() },
    async ({ query }) => {
        try {
            const results = await queryInfluxDB(query);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                    type: "text",
                    text: `Error executing query: ${errorMessage}`
                }]
            };
        }
    }
);

// Add tool to get latest data from a measurement
server.tool("influxdb-latest",
    {
        measurement: z.string(),
        field: z.string(),
        timeRange: z.string().optional()
    },
    async ({ measurement, field, timeRange }) => {
        try {
            const results = await getLatestData(measurement, field, timeRange);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                    type: "text",
                    text: `Error getting latest data: ${errorMessage}`
                }]
            };
        }
    }
);

// Add tool to get data within a time range
server.tool("influxdb-range",
    {
        measurement: z.string(),
        field: z.string(),
        start: z.string(),
        stop: z.string().optional()
    },
    async ({ measurement, field, start, stop }) => {
        try {
            const results = await getDataInRange(measurement, field, start, stop);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                    type: "text",
                    text: `Error getting data in range: ${errorMessage}`
                }]
            };
        }
    }
);

// Listing resource for statictest:/ (acts like a folder)
server.resource(
    "echo",
    new ResourceTemplate("echo://{message}", { list: undefined }),
    async (uri, { message }) => ({
        contents: [{
            uri: uri.href,
            text: `Resource echo: ${message}`
        }]
    })
);

server.tool("read-sensors-map", {}, async () => {
    try {
        const data = await readFile("sensorLocations.txt", "utf-8");
        return {
            content: [{
                type: "text",
                text: data
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error reading sensors.txt: ${error instanceof Error ? error.message : String(error)}`
            }]
        };
    }
});

server.tool("measurements-recent",
    {},
    async () => {
        try {
            const measurements = await getRecentActiveMeasurements();

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(measurements, null, 2),
                    mimeType: "application/json"
                }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({ error: `Error getting recent measurements: ${errorMessage}` }, null, 2),
                    mimeType: "application/json"
                }]
            };
        }
    }
)




// Add resource for recent active measurements (last 2 days)
server.resource("measurements:/recent",
    "measurements:/recent",
    async () => {
        try {
            const measurements = await getRecentActiveMeasurements();

            return {
                contents: [{
                    uri: "measurements:/recent",
                    text: JSON.stringify(measurements, null, 2),
                    mimeType: "application/json"
                }]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
                contents: [{
                    uri: "measurements:/recent",
                    text: JSON.stringify({ error: `Error getting recent measurements: ${errorMessage}` }, null, 2),
                    mimeType: "application/json"
                }]
            };
        }
    }
)

server.prompt(
    "review-code",
    { code: z.string() },
    ({ code }) => ({
        messages: [{
            role: "user",
            content: {
                type: "text",
                text: `Please review this code:\n\n${code}`
            }
        }]
    })
);

server.tool(
    "echo",
    { message: z.string() },
    async ({ message }) => ({
        content: [{ type: "text", text: `Tool echo: ${message}` }]
    })
);


// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);