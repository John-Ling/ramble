"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { ListFilter, Eye, EyeOff, Settings, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

import { Checkbox } from "@/components/ui/checkbox";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EmotionPlot() {
    const data: DataPoint[] = [ 
    create_data_point({name: "19/03/2024", fear: 0.9, approval: 0.68, optimism: 0.56, confusion: 0.5, neutral: 0.19, amusement: 0.14, annoyance: 0.07, disgust: 0.05, desire: 0.03, realisation: 0.03, anger: 0.02}),
    create_data_point({name: "20/03/2024", amusement: 0.71, disapproval: 0.64, annoyance: 0.54, optimism: 0.33, confusion: 0.03, realisation: 0.03, desire: 0.02, curiosity: 0.019, disgust: 0.01, admiration: 0.01, joy: 0.01, nervousness: 0.01, disappointment: 0.01, fear: 0.01, sadness: 0.01}),
    create_data_point({name: "28/03/2024", amusement: 0.92, optimism: 0.62, love: 0.37, admiration: 0.35, joy: 0.3, annoyance: 0.28, anger: 0.2, realisation: 0.1, confusion: 0.05, disappointment: 0.03, embarrassment: 0.02, disgust: 0.02}),
    create_data_point({name: "07/04/2024", amusement: 0.78, optimism: 0.65, confusion: 0.35, approval: 0.02, joy: 0.01}),
    create_data_point({name: "09/04/2024", joy: 0.99, amusement: 0.63, annoyance: 0.14, disapproval: 0.1, optimism: 0.05, anger: 0.02}),
  ];

  // Initialize visible emotions with visibility state
  const [visibleEmotions, setVisibleEmotions] = useState<VisibleEmotion[]>(() => 
    defaultGraphEmotions.map(emotion => ({ ...emotion, visible: true }))
  );

  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);

  // filter by past n entries, past n weeks  months and past n years
  const [filterBy, setFilterBy] = useState<"day" | "week" | "month" | "year">("week");

  const colors = darkMode
  ? {
      bg: "#1e1e2f",
      text: "#e5e7eb",
      grid: "#374151",
      line: "#60a5fa",
    }
  : {
      bg: "#ffffff",
      text: "#111827",
      grid: "#d1d5db",
      line: "#3b82f6",
    };

  const on_dropdown_value_change = (filter: string) => {
    if (filter === "day" || filter === "week" || filter === "month" || filter === "year")
    {
      setFilterBy(filter);
    }
  }

  const toggleEmotionVisibility = (emotionName: string) => {
    setVisibleEmotions(prev => 
      prev.map(emotion => 
        emotion.emotion === emotionName 
          ? { ...emotion, visible: !emotion.visible }
          : emotion
      )
    );
  };

  const toggleAllEmotions = (visible: boolean) => {
    setVisibleEmotions(prev => 
      prev.map(emotion => ({ ...emotion, visible }))
    );
  };

  const visibleCount = visibleEmotions.filter(e => e.visible).length;
  const totalCount = visibleEmotions.length;

  return (
    <div
    > 
      <div className="flex gap-2 mb-4">
        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="size-8" ><ListFilter /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={filterBy} onValueChange={on_dropdown_value_change}>
              <DropdownMenuRadioItem value="day">Day</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="week">Week</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="month">Month</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="year">Year</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Emotion Visibility Control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2 text-foreground">
              Emotions Shown ({visibleCount}/{totalCount})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Emotion Visibility</h4>
                <p className="text-sm text-muted-foreground">
                  Control which emotion lines are displayed on the chart
                </p>
              </div>
              
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllEmotions(true)}
                  className="flex-1"
                >
                  Show All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleAllEmotions(false)}
                  className="flex-1"
                >
                  Hide All
                </Button>
              </div>

              <ScrollArea className="h-[300px] w-full">
                <div className="grid gap-3">
                  {visibleEmotions.map((emotion) => (
                    <div key={emotion.emotion} className="flex items-center space-x-2">
                      <Checkbox
                        id={emotion.emotion}
                        checked={emotion.visible}
                        onCheckedChange={() => toggleEmotionVisibility(emotion.emotion)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: emotion.colour }}
                        />
                        <Label 
                          htmlFor={emotion.emotion}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                        >
                          {emotion.emotion}
                        </Label>
                      </div>
                      {emotion.visible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    
      <div className="w-full max-w-5xl h-96 p-4 rounded-lg bg-background border-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={"var(--color-muted-foreground"} />
            <YAxis stroke={"var(--color-foreground"} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--color-card)", border: "none" }}
              labelStyle={{ color: "var(--color-foreground"}}
              itemStyle={{ color: "var(--color-foreground"}}
            />
            {visibleEmotions
              .filter(emotion => emotion.visible)
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
    </div>
  );
}


interface DataPoint {
  name: string;
  neutral: number;
  joy: number;
  love: number;
  gratitude: number;
  excitement: number;
  relief: number;
  fear: number;
  amusement: number;
  disgust: number;
  caring: number;
  grief: number;
  anger: number;
  disappointment: number;
  remorse: number;
  embarrassment: number;
  curiosity: number;
  nervousness: number;
  desire: number;
  approval: number;
  confusion: number;
  optimism: number;
  surprise: number;
  annoyance: number;
  sadness: number;
  disapproval: number;
  realisation: number;
  admiration: number;
}


interface VisibleEmotion extends GraphEmotion {
  visible: boolean;
}

function create_data_point(options: Partial<DataPoint>): DataPoint {
  return {
    name: options.name || "",
    neutral: options.neutral || 0,
    joy: options.joy || 0,
    love: options.love || 0,
    gratitude: options.gratitude || 0,
    excitement: options.excitement || 0,
    relief: options.relief || 0,
    fear:  options.fear || 0,
    amusement: options.amusement || 0,
    disgust: options.disgust || 0,
    caring: options.caring || 0,
    grief: options.grief || 0,
    anger: options.anger || 0,
    disappointment: options.disappointment || 0,
    remorse: options.remorse || 0,
    embarrassment: options.embarrassment || 0,
    curiosity: options.curiosity || 0,
    nervousness: options.nervousness || 0,
    desire: options.desire || 0,
    approval: options.approval || 0,
    confusion: options.confusion || 0,
    optimism: options.optimism || 0,
    annoyance: options.annoyance || 0,
    sadness: options.sadness || 0,
    disapproval: options.disapproval || 0,
    realisation: options.realisation || 0,
    admiration: options.admiration || 0,
  } as DataPoint
}



const defaultGraphEmotions: GraphEmotion[]  = [
    {
        emotion: "amusement",
        colour: "var(--color-chart-1)",
        hidden: false
    },
    {
        emotion: "confusion",
        colour: "var(--color-chart-2)",
        hidden: false
    },
    {
        emotion: "realization",
        colour: "var(--color-chart-3)",
        hidden: false
    },
    {
        emotion: "optimism",
        colour: "var(--color-chart-4)",
        hidden: false
    },
    {
        emotion: "joy",
        colour: "var(--color-chart-5)",
        hidden: false
    },
    {
        emotion: "curiosity",
        colour: "var(--color-chart-6)",
        hidden: false
    },
    {
        emotion: "sadness",
        colour: "var(--color-chart-7)",
        hidden: false
    },
    {
        emotion: "desire",
        colour: "var(--color-chart-8)",
        hidden: false
    },
    {
        emotion: "disappointment",
        colour: "var(--color-chart-9)",
        hidden: false
    },
    {
        emotion: "embarrassment",
        colour: "var(--color-chart-10)",
        hidden: false
    },
    {
        emotion: "anger",
        colour: "var(--color-chart-11)",
        hidden: false
    },
    {
        emotion: "neutral",
        colour: "var(--color-chart-12)",
        hidden: false
    },
    {
        emotion: "annoyance",
        colour: "var(--color-chart-13)",
        hidden: false
    },
    {
        emotion: "nervousness",
        colour: "var(--color-chart-14)",
        hidden: false
    },
    {
        emotion: "love",
        colour: "var(--color-chart-15)",
        hidden: false
    },
    {
        emotion: "disapproval",
        colour: "var(--color-chart-16)",
        hidden: false
    },
    {
        emotion: "relief",
        colour: "var(--color-chart-17)",
        hidden: false
    },
    {
        emotion: "remorse",
        colour: "var(--color-chart-18)",
        hidden: false
    },
    {
        emotion: "grief",
        colour: "var(--color-chart-19)",
        hidden: false
    },
    {
        emotion: "caring",
        colour: "var(--color-chart-20)",
        hidden: false
    },
    {
        emotion: "gratitude",
        colour: "var(--color-chart-21)",
        hidden: false
    },
    {
        emotion: "disgust",
        colour: "var(--color-chart-22)",
        hidden: false
    },
    {
        emotion: "surprise",
        colour: "var(--color-chart-23)",
        hidden: false
    },
    {
        emotion: "admiration",
        colour: "var(--color-chart-24)",
        hidden: false
    },
    {
        emotion: "fear",
        colour: "var(--color-chart-25)",
        hidden: false
    },
    {
        emotion: "approval",
        colour: "var(--color-chart-26)",
        hidden: false
    },
    {
        emotion: "excitement",
        colour: "var(--color-chart-27)",
        hidden: false
    },
    {
        emotion: "pride",
        colour: "var(--color-chart-28)",
        hidden: false
    },
]