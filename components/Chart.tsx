// Using client component so Highcharts has access to window etc.
'use client';
import { GraphData } from '@/app/api/energy/route';
import * as Highcharts from 'highcharts';
import { HighchartsReact } from 'highcharts-react-official';

/**
 * Converts a timestamp to a human readable string for display
 * @param timestamp the timestamp as a string e.g. '1577836800000'
 * @returns A readable date string e.g. '01/01/2020 00:00'
 */
const timeStampToReadable = (timestamp: string) => {
  return new Date(Number(timestamp)).toLocaleDateString('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
  });
};

interface ChartProps {
  data: GraphData;
}
type ChartConsumptionData = {
  y: number;
  color: '#FF0000' | '#0000FF';
};

const Chart = ({ data }: ChartProps) => {
  const consumptions: Array<ChartConsumptionData> = [];
  const temperatures: Array<number | null> = [];
  const anomalies: string[] = [];
  // Go through the data points and build up the highchart series data for
  // each time entry, using red for any anomalous consumption values instead of blue
  // There's an error(?) in the temperature data where the time 11:00am time is
  // duplicated, with no 11:30am entry, so skip it in the graph by using null
  Object.entries(data).forEach(([key, value]) => {
    temperatures.push(value.temperature ? value.temperature : null);
    if (value.isAnomalous) {
      anomalies.push(timeStampToReadable(key));
      consumptions.push({ y: value.consumption, color: '#FF0000' });
    } else {
      consumptions.push({ y: value.consumption, color: '#0000FF' });
    }
  });

  // Format time series from timestamps to readable times for display
  const times = Object.keys(data).map((timestamp) => timeStampToReadable(timestamp));

  const options: Highcharts.Options = {
    chart: {
      zooming: {
        type: 'x',
      },
    },
    title: {
      text: 'Consumption vs Temperature (and Anomalies)',
    },
    xAxis: {
      categories: times,
    },
    yAxis: [
      {
        labels: {
          format: '{value}W',
        },
        title: {
          text: 'Consumption',
        },
      },
      {
        labels: {
          format: '{value}°C',
        },
        title: {
          text: 'Temperature',
        },
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
      formatter(tooltip) {
        // If the x value is in the anomalies array, append a message to the
        // default tooltip, else return the default tooltip
        const defaultTooltip = tooltip.defaultFormatter.call(this, tooltip);
        if (this.x && typeof this.x === 'string' && anomalies.includes(this.x)) {
          // This causes the tooltip to gain some extra commas, so will need
          // refining in future, maybe some html manipulation? Or making
          // a custom anomalous tooltip from scratch
          return defaultTooltip + 'ANOMALY';
        }
        return defaultTooltip;
      },
    },
    series: [
      {
        name: 'Consumption',
        type: 'column',
        data: consumptions,
        tooltip: {
          valueSuffix: 'W',
        },
        color: '#0000FF',
      },
      {
        name: 'Temperature',
        type: 'spline',
        yAxis: 1,
        data: temperatures,
        tooltip: {
          valueSuffix: '°C',
        },
        color: '#000000',
      },
    ],
  };
  // Highcharts is supposed to fill it's container, but apparently only when it feels like it!
  // I've included a screenshots folder of the component looking at it's best, just in case
  return (
    <div className="flex flex-col items-center w-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
      <p className="mt-4">Click and drag on graph to zoom in</p>
    </div>
  );
};

export default Chart;
