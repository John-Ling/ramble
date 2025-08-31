import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function date_to_db_date(date: string) {
    const split: string[] = date.split('/');
    return `${split[2].padStart(4, '0')}-${split[0].padStart(2, '0')}-${split[1].padStart(2, '0')}`
}

export function db_date_to_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2].padStart(2, '0')}/${split[1].padStart(2, '0')}/${split[0].padStart(4, '0')}`
}

export function double_encode(s: string) {
  // double uri encode 
  return encodeURIComponent(encodeURIComponent(s));
}