import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dob: string): number | null {
  if (!dob) return null;
  let day: number, month: number, year: number;
  if (dob.includes('/')) {
    const parts = dob.split('/');
    if (parts.length !== 3) return null;
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else if (dob.includes('-')) {
    const parts = dob.split('-');
    if (parts.length !== 3) return null;
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    return null;
  }

  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900 || year > new Date().getFullYear()) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatDateMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function hasMeaningfulData(obj: any): boolean {
  if (obj === null || obj === undefined) return false;
  
  if (typeof obj !== 'object') {
     return typeof obj === 'string' ? obj.trim().length > 0 : true;
  }
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
       const val = obj[key];
       if (val !== null && val !== undefined) {
         if (typeof val === 'object') {
           if (hasMeaningfulData(val)) return true;
         } else if (typeof val === 'string') {
           if (val.trim().length > 0) {
              return true;
           }
         } else if (Array.isArray(val)) {
           if (val.length > 0) return true;
         } else if (typeof val === 'boolean') {
           if (val === true) return true;
         } else {
           return true; 
         }
       }
    }
  }
  return false;
}
