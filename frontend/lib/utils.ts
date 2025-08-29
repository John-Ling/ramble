import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


// new Intl.DateTimeFormat("en-US").format(new Date()).replaceAll('/', '-')
export function date_to_db_date(date: string) {
    // convert Ramble's formatted date into ISO style date for use with mongodb
    const split: string[] = date.split('/');
    return `${split[2]}-${split[0].padStart(2, '0')}-${split[1].padStart(2, '0')}`
}

export function db_date_to_date(dbDate: string) {
    const split: string[] = dbDate.split('-');
    return `${split[2].padStart(2, '0')}/${split[1]}/${split[0]}`
}

