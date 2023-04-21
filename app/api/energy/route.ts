import { readFile } from 'fs/promises';
import path from 'path';
import { ParseResult, parse } from 'papaparse';
import { NextResponse } from 'next/server';

/**
 * Parses the given csv file and returns it as a string array of rows
 * @param fileName the csv file to parse
 * @returns an array of string arrays representing each row of the csv
 */
const parseCsv = async (fileName: string): Promise<string[][]> => {
  // Could consider streaming approach if files were to get big, rather than
  // loading whole file in memory
  const filePath = path.join(process.cwd(), 'data/', fileName);
  const csvData = await readFile(filePath);
  const result: ParseResult<string[]> = parse(csvData.toString());
  if (result.errors.length > 0) {
    throw new Error(`Unable to parse data from file ${fileName}`); // Should be reported to logging
  }
  // Rsemove first and last row before returning (headings and new line)
  return result.data.slice(1, result.data.length - 1);
};

type DataPoint = {
  consumption: number;
  isAnomalous: boolean;
  temperature?: number;
};
export type GraphData = Record<string, DataPoint>;

export async function GET(request: Request) {
  /* Go through the CSV files and build up the json data object with the format:
    {
      <timeInMilliseconds>: {
        consumption: 12.34,
        temperature: 5.67, // If present
        isAnomalous: true/false
      }, ...
    }
  */
  const data: GraphData = {};

  // What if one of the CSV's fail to parse, but the other's are fine?
  const energy = await parseCsv('HalfHourlyEnergyData.csv');
  const weather = await parseCsv('Weather.csv');
  const anomalies = await parseCsv('HalfHourlyEnergyDataAnomalies.csv');

  // These loops are currently sequential, i.e. the energy loop has to run first
  // But a future refactor could be to make them less coupled and able to be run independantly
  // Which will allow easier testing of each one in isolation
  energy.forEach(([timeStr, consumption]) => {
    const parsed = Date.parse(timeStr);
    data[parsed] = { consumption: Number(consumption), isAnomalous: false };
  });

  weather.forEach(([timeStr, temperature, _]) => {
    // Date.parse expects MM/DD/YYYY HH:mm format dates, so we need to switch them around
    const [day, month, rest] = timeStr.split('/');
    const parsed = Date.parse(`${month}/${day}/${rest}`);
    data[parsed] = { ...data[parsed], temperature: Number(temperature) };
  });

  anomalies.forEach(([timeStr, _]) => {
    const parsed = Date.parse(timeStr);
    data[parsed] = { ...data[parsed], isAnomalous: true };
  });

  return NextResponse.json(data);
}
