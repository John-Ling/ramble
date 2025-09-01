"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
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
import { Eye, EyeOff, FilterIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Checkbox } from "@/components/ui/checkbox";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"

import EmotionPlotGraph from "./emotion_plot_graph";

import useSWR from "swr";
import { User } from "next-auth";
import { date_to_db_date, double_encode } from "@/lib/utils";

import { useUser } from "@/hooks/useUser";


interface EmotionPlotProps {
  dbDate: string;
  fetchCount: number;
  filterBy: string;
}

export default function EmotionPlot() {
  const user = useUser();
  // Initialize visible emotions with visibility state
  const [visibleEmotions, setVisibleEmotions] = useState<VisibleEmotion[]>(() => 
    defaultGraphEmotions.map(emotion => ({ ...emotion, visible: !emotion.hidden }))
  );

  const todayDbDate = date_to_db_date(new Intl.DateTimeFormat("en-US").format(new Date()));

  const [filterCount, setFilterCount] = useState<number>(5);

  // filter by past n entries, past n weeks  months and  years
  const [filterBy, setFilterBy] = useState<"entry" | "day" | "week" | "month" | "year">("entry");

  const on_dropdown_value_change = (filter: string) => {
    if (filter === "day" || filter === "week" || filter === "month" || filter === "year" || filter === "entry") {
      setFilterBy(filter);
      setFilterCount(1);
    }
}

  const toggle_emotion_visibility = (emotionName: string) => {
    setVisibleEmotions(prev => 
      prev.map(emotion => 
        emotion.emotion === emotionName 
          ? { ...emotion, visible: !emotion.visible }
          : emotion
      )
    );
  };

  const toggle_all_emotions = (visible: boolean) => {
    setVisibleEmotions(prev => 
      prev.map(emotion => ({ ...emotion, visible }))
    );
  };


  const on_input_change = (e: ChangeEvent<HTMLInputElement>) => {

    let parsed = parseInt(e.target.value);

    if (isNaN(parsed)) {
      // stop the change
      return;
    }

    let limit = 0;

    switch(filterBy)
    {
      
      case "entry":
        limit =31;
        break;
      case "day":
        limit = 31;
        break;
      case "week":
        limit = 8;
        break;
      case "month":
        limit = 4;
        break;
      case "year":
        limit = 1;
        break;
    }

    if (parsed > limit)
    {
      return;
    }

    setFilterCount(parsed);
    return;
  }

  const visibleCount = visibleEmotions.filter(e => e.visible).length;
  const totalCount = visibleEmotions.length;


  const fetched = useLoadedEmotionData(user, todayDbDate, filterCount, filterBy);

  useEffect(() => {
    if (fetched.data) {
      console.log(fetched.data);
    } else  {
      console.log("No data");
    }
  }, [fetched.data])



  let label = "entries";

  switch(filterBy){
    case "day":
      label = "days";
      break;
    case "week":
      label = "weeks";
      break;
    case "month":
      label = "months";
      break;
    case "year":
      label = "year";
      break;
  }


  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Emotion data for the past {filterCount} {label}</h2>
      <div className="flex gap-2 mb-4">
        {/* filter Dropdown */}
        <Input className="w-[15ch] bg-card" type="text" onChange={on_input_change} value={filterCount}  placeholder="Filter Count"/>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="secondary" className="text-foreground"  > <FilterIcon/> {filterBy}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={filterBy} onValueChange={on_dropdown_value_change}>
              <DropdownMenuRadioItem value="entry">Entries</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="day">Days</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="week">Weeks</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="month">Months</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="year">Years</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* emotion visibility panel */}
        <Popover>
          <PopoverTrigger>
            <Button variant="secondary" size="sm" className="gap-2 text-foreground">
              Emotions Displayed ({visibleCount}/{totalCount})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Emotion Visibility</h4>
              </div>
              
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggle_all_emotions(true)}
                  className="flex-1"
                >
                  Show All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggle_all_emotions(false)}
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
                        onCheckedChange={ () => toggle_emotion_visibility(emotion.emotion) }
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
                      { emotion.visible ? <Eye className="h-4" /> : <EyeOff className="h-4"/> }
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    {/* maximum 12 labelled points but  */}
    <EmotionPlotGraph data={fetched.data} visibleEmotions={visibleEmotions} isLoading={fetched.isLoading} />
    </>
  );
}

function useLoadedEmotionData(user: User | null, dbDate: string, fetchCount: number, filterBy: string) {
  const uid = user?.id;
  const fetcher = (url: string) => fetch(url).then(r => r.json());  
  const { data, mutate, error, isLoading } = useSWR(uid && dbDate && fetchCount && filterBy ? `/api/dashboard/emotions/${uid}/${double_encode(dbDate)}/${fetchCount}?filterBy=${filterBy}` : null, fetcher,  {
    dedupingInterval: 5000,
    revalidateOnFocus: false
  });

  return { data: data, mutate, error, isLoading };
}


const defaultGraphEmotions: GraphEmotion[]  = [
    {
        emotion: "amusement",
        colour: "var(--color-chart-1)",
        hidden: true
    },
    {
        emotion: "confusion",
        colour: "var(--color-chart-2)",
        hidden: true
    },
    {
        emotion: "realization",
        colour: "var(--color-chart-3)",
        hidden: true
    },
    {
        emotion: "optimism",
        colour: "var(--color-chart-4)",
        hidden: true
    },
    {
        emotion: "joy",
        colour: "var(--color-chart-5)",
        hidden: false
    },
    {
        emotion: "curiosity",
        colour: "var(--color-chart-6)",
        hidden: true
    },
    {
        emotion: "sadness",
        colour: "var(--color-chart-7)",
        hidden: false
    },
    {
        emotion: "desire",
        colour: "var(--color-chart-8)",
        hidden: true
    },
    {
        emotion: "disappointment",
        colour: "var(--color-chart-9)",
        hidden: true
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
        hidden: true
    },
    {
        emotion: "nervousness",
        colour: "var(--color-chart-14)",
        hidden: false
    },
    {
        emotion: "love",
        colour: "var(--color-chart-15)",
        hidden: true
    },
    {
        emotion: "disapproval",
        colour: "var(--color-chart-16)",
        hidden: true
    },
    {
        emotion: "relief",
        colour: "var(--color-chart-17)",
        hidden: true
    },
    {
        emotion: "remorse",
        colour: "var(--color-chart-18)",
        hidden: true
    },
    {
        emotion: "grief",
        colour: "var(--color-chart-19)",
        hidden: true
    },
    {
        emotion: "caring",
        colour: "var(--color-chart-20)",
        hidden: true
    },
    {
        emotion: "gratitude",
        colour: "var(--color-chart-21)",
        hidden: true
    },
    {
        emotion: "disgust",
        colour: "var(--color-chart-22)",
        hidden: false
    },
    {
        emotion: "surprise",
        colour: "var(--color-chart-23)",
        hidden: true
    },
    {
        emotion: "admiration",
        colour: "var(--color-chart-24)",
        hidden: true
    },
    {
        emotion: "fear",
        colour: "var(--color-chart-25)",
        hidden: false
    },
    {
        emotion: "approval",
        colour: "var(--color-chart-26)",
        hidden: true
    },
    {
        emotion: "excitement",
        colour: "var(--color-chart-27)",
        hidden: true
    },
    {
        emotion: "pride",
        colour: "var(--color-chart-28)",
        hidden: true
    },
]