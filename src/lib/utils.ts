
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeCampus(campus: string): string {
  const map: Record<string, string> = {
    'main': 'Main Campus',
    'johar': 'Johar Campus',
    'masjid': 'Masjid Campus',
    'maktab': 'Maktab Campus'
  };
  return map[campus] || campus;
}

export function calculateLateHours(timeIn: string, shiftStart: string): number {
  if (!timeIn || !shiftStart) return 0;
  
  const [inH, inM] = timeIn.split(':').map(Number);
  const [startH, startM] = shiftStart.split(':').map(Number);
  
  const inMinutes = inH * 60 + inM;
  const startMinutes = startH * 60 + startM;
  
  if (inMinutes > startMinutes) {
    return (inMinutes - startMinutes) / 60;
  }
  return 0;
}

export function calculateOvertime(timeOut: string, shiftEnd: string): number {
  if (!timeOut || !shiftEnd) return 0;
  
  const [outH, outM] = timeOut.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);
  
  const outMinutes = outH * 60 + outM;
  const endMinutes = endH * 60 + endM;
  
  if (outMinutes > endMinutes) {
    return (outMinutes - endMinutes) / 60;
  }
  return 0;
}

export function calculateAttendanceHours(att: any, now?: Date): string {
  if (!att) return "0.00";
  
  // If we have sessions, calculate total from sessions
  if (att.sessions && att.sessions.length > 0) {
    let totalMs = 0;
    att.sessions.forEach((session: any) => {
      const [inH, inM, inS] = session.checkIn.split(':').map(Number);
      const inDate = now ? new Date(now) : new Date();
      inDate.setHours(inH, inM, inS || 0, 0);
      
      let outDate;
      if (session.checkOut) {
        const [outH, outM, outS] = session.checkOut.split(':').map(Number);
        outDate = now ? new Date(now) : new Date();
        outDate.setHours(outH, outM, outS || 0, 0);
      } else if (now) {
        outDate = now;
      }

      if (outDate) {
        const diff = outDate.getTime() - inDate.getTime();
        if (diff > 0) totalMs += diff;
      }
    });
    return (totalMs / 3600000).toFixed(2);
  }

  // Fallback for logic without sessions (old records)
  if (!att.timeIn) return "0.00";
  const [inH, inM, inS] = att.timeIn.split(':').map(Number);
  let outDate = now || new Date();
  
  if (att.timeOut) {
    const [outH, outM, outS] = att.timeOut.split(':').map(Number);
    outDate.setHours(outH, outM, outS || 0, 0);
  }

  const inDate = new Date(outDate);
  inDate.setHours(inH, inM, inS || 0, 0);
  const diffMs = outDate.getTime() - inDate.getTime();
  return diffMs < 0 ? "0.00" : (diffMs / 3600000).toFixed(2);
}

export function formatTimeDisplay(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
}

export function getLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}
