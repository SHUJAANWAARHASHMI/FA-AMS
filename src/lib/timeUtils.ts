
export const formatTo12h = (time24: string | undefined): string => {
  if (!time24 || time24 === '--:--') return '--:--';
  try {
    const [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time24;
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (e) {
    return time24;
  }
};

export const getCurrentTime12h = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};
