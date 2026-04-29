import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
