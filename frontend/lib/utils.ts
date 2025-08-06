import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { google_sign_out } from "./firebase/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function date_to_db_date(date: string) {
  const split: string[] = date.split('/');
  return `${split[2]}-${split[1]}-${split[0]}`
}

export function db_date_to_date(dbDate: string) {
  const split: string[] = dbDate.split('-');
  return `${split[2]}/${split[1]}/${split[0]}`
}

export function logout_google() {
  google_sign_out();
  window.location.href = "/login";
}