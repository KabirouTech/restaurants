export interface ClosedDatesInfo {
    blockedDates: string[];    // "yyyy-MM-dd" strings
    closedDaysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

export function isDateClosed(dateStr: string, info: ClosedDatesInfo): boolean {
    if (!dateStr) return false;
    // Check explicitly blocked dates
    if (info.blockedDates.includes(dateStr)) return true;
    // Check day of week defaults
    const dow = new Date(dateStr + "T00:00:00").getDay();
    return info.closedDaysOfWeek.includes(dow);
}

export function isDateInPast(dateStr: string): boolean {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr + "T00:00:00");
    return date < today;
}

export function getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
