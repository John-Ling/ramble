"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";

interface EmotionPlotGraphProps {
  data?: EmotionDataAPIResponse | undefined;
  visibleEmotions: VisibleEmotion[];
  isLoading: boolean;
}

export default function EmotionPlotGraph({ data, visibleEmotions, isLoading }: EmotionPlotGraphProps) {
  console.log("ADDED DATA");
  console.log(data);
  
  if (isLoading || data === undefined || !data) {
    return (
      <Skeleton className="w-full max-w-6xl h-96 rounded-lg bg-card" />
    );
  }

  console.log(data);

  const datapoints: DataPoint[] = [];

  // data points are ordered in reverse so we move backwards
  for (let i = data.datapoints.length - 1; i >= 0; i--) {
    datapoints.push(create_data_point(data.datapoints[i]));
  }

  console.log(datapoints);

  return (
    <>
      <div className="w-full max-w-6xl h-96 p-4 rounded-lg bg-background border-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datapoints}>
            <CartesianGrid stroke={"var(--color-card)"} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={"var(--color-muted-foreground"} />
            <YAxis stroke={"var(--color-foreground"} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--color-card)", border: "none" }}
              labelStyle={{ color: "var(--color-foreground"}}
              itemStyle={{ color: "var(--color-foreground"}}
            />
            {visibleEmotions
              .filter((emotion: VisibleEmotion) => emotion.visible)
              .map((emotion: VisibleEmotion) => (
                <Line 
                  key={emotion.emotion}
                  type="monotone" 
                  dataKey={emotion.emotion}
                  stroke={emotion.colour}
                  strokeWidth={3}
                  dot={{fill: emotion.colour}}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}



function create_data_point(point: EmotionDataAPIDataPoint) {
  return {
    name: point.created,
    neutral: point.neutral,
    joy: point.joy,
    love: point.love,
    gratitude: point.gratitude,
    excitement: point.excitement,
    relief: point.relief,
    fear:  point.fear,
    amusement: point.amusement,
    disgust: point.disgust,
    caring: point.caring,
    grief: point.grief,
    anger: point.anger,
    surprise: point.surprise,
    disappointment: point.disappointment,
    remorse: point.remorse,
    embarrassment: point.embarrassment,
    curiosity: point.curiosity,
    nervousness: point.nervousness,
    desire: point.desire,
    approval: point.approval,
    confusion: point.confusion,
    optimism: point.optimism,
    annoyance: point.annoyance,
    sadness: point.sadness,
    disapproval: point.disapproval,
    realization: point.realization,
    admiration: point.admiration,
  } as DataPoint;
}