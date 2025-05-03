# LocalDude

A Node.js/TypeScript project using the Model Context Protocol (MCP) SDK.

## GitHub Repository

This project is hosted on GitHub. To clone the repository:

```bash
git clone https://github.com/username/localdude.git
cd localdude
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## Installation

```bash
npm install
```

## Available Scripts

### Development

- `npm run dev` - Starts the application in development mode with auto-rebuild on file changes
- `npm run dev:server` - Starts the server in development mode with auto-rebuild on file changes

### Build and Run

- `npm run build` - Compiles TypeScript files to JavaScript
- `npm run watch` - Compiles TypeScript files in watch mode (without restarting)
- `npm run start` - Builds and starts the main application
- `npm run server` - Builds and starts the server

## Auto-Rebuild Functionality

This project is configured to automatically rebuild and restart when TypeScript files are changed. This is implemented using:

- **nodemon**: Monitors file changes and triggers rebuilds
- **ts-node**: Executes TypeScript files directly

The auto-rebuild behavior is configured in `nodemon.json`, which watches for changes in:
- All `.ts` files in the root directory
- All `.ts` files in the `src` directory (if it exists)

When changes are detected, the application is automatically rebuilt and restarted.

## InfluxDB Integration

This project includes integration with InfluxDB for time-series data storage and querying.

### Configuration

To use the InfluxDB integration, you need to set up the following environment variables in your `.env` file:

```
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=your_organization
INFLUXDB_BUCKET=your_bucket
```

You can copy these from the `.env.example` file and replace the placeholder values with your actual InfluxDB connection details.

### Available InfluxDB Tools

The server provides the following tools for interacting with InfluxDB:

1. **influxdb-query**: Execute a custom Flux query
   ```
   {
     "query": "from(bucket: \"your_bucket\") |> range(start: -1h) |> filter(fn: (r) => r._measurement == \"your_measurement\")"
   }
   ```

2. **influxdb-latest**: Get the latest data point for a measurement and field
   ```
   {
     "measurement": "your_measurement",
     "field": "your_field",
     "timeRange": "-1h"  // optional, defaults to "-1h"
   }
   ```

3. **influxdb-range**: Get data within a time range
   ```
   {
     "measurement": "your_measurement",
     "field": "your_field",
     "start": "-1h",
     "stop": "now()"  // optional, defaults to "now()"
   }
   ```

These tools can be used through the MCP server interface to query your InfluxDB database.
