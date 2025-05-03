import { InfluxDB, Point, QueryApi } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// InfluxDB connection parameters
const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || '';
const org = process.env.INFLUXDB_ORG || '';
const bucket = process.env.INFLUXDB_BUCKET || '';

// Log environment variables for debugging (using stderr to avoid interfering with MCP)
console.error('InfluxDB Configuration:');
console.error(`URL: ${url}`);
console.error(`Token: ${token ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : 'Not set'}`);
console.error(`Organization: ${org || 'Not set'}`);
console.error(`Bucket: ${bucket || 'Not set'}`);

// Create InfluxDB client
const influxDB = new InfluxDB({ url, token });

// Get query client
const queryApi = influxDB.getQueryApi(org);

/**
 * Execute a Flux query against InfluxDB
 * @param query The Flux query string
 * @returns Promise with the query results
 */
export async function queryInfluxDB(query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const result = tableMeta.toObject(row);
        results.push(result);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(results);
      },
    });
  });
}

/**
 * Execute a simple query to get the latest data from a measurement
 * @param measurement The measurement name
 * @param field The field to query
 * @param timeRange Time range for the query (e.g., '-1h' for last hour)
 * @returns Promise with the query results
 */
export async function getLatestData(measurement: string, field: string, timeRange: string = '-1h'): Promise<any[]> {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: ${timeRange})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
      |> last()
  `;

  return queryInfluxDB(query);
}

/**
 * Execute a query to get data within a time range
 * @param measurement The measurement name
 * @param field The field to query
 * @param start Start time (e.g., '-1h' for last hour)
 * @param stop End time (e.g., 'now()')
 * @returns Promise with the query results
 */
export async function getDataInRange(measurement: string, field: string, start: string, stop: string = 'now()'): Promise<any[]> {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${stop})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r._field == "${field}")
  `;

  return queryInfluxDB(query);
}

/**
 * Get all measurements that have data in the last 2 days with their latest values
 * @returns Promise with an array of measurements and their latest values
 */
export async function getRecentActiveMeasurements(): Promise<any[]> {
  // First, get all measurements that have data in the last 2 days
  const measurementsQuery = `
    from(bucket: "${bucket}")
      |> range(start: -2d)
      |> distinct(column: "_measurement")
  `;

  const measurements = await queryInfluxDB(measurementsQuery);
  const measurementNames = measurements.map(m => m._value);

  // For each measurement, get the latest data for all fields
  const results = [];

  for (const measurement of measurementNames) {
    const latestDataQuery = `
      from(bucket: "${bucket}")
        |> range(start: -2d)
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> group(columns: ["_field"])
        |> last()
    `;

    const latestData = await queryInfluxDB(latestDataQuery);

    if (latestData.length > 0) {
      // Group data by measurement
      const measurementData = {
        measurement,
        fields: latestData.map(data => ({
          field: data._field,
          value: data._value,
          time: data._time
        }))
      };

      results.push(measurementData);
    }
  }

  return results;
}

export default {
  queryInfluxDB,
  getLatestData,
  getDataInRange,
  getRecentActiveMeasurements
};
