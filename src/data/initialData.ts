
import { Employee, User, CampusCode } from '../types';

export const INITIAL_USERS: User[] = [
  { id: "USR001", username: "shuja", password: "password1", name: "Shuja Anwar", email: "shuja@fiqhacademy.com", campus: "Main Campus", role: "admin", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR002", username: "haris", password: "password2", name: "Haris Ali", email: "haris@fiqhacademy.com", campus: "Johar Campus", role: "user", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR003", username: "umair", password: "password3", name: "Umair Aman", email: "umair@fiqhacademy.com", campus: "Masjid Campus", role: "user", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR004", username: "raid", password: "password4", name: "Raid Ansar", email: "raid@fiqhacademy.com", campus: "Maktab Campus", role: "user", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR005", username: "mudeer", password: "mudeer123", name: "Maulana Syed Osama Ali", email: "mudeer@fiqhacademy.com", campus: "Main Campus", role: "mudeer", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" }
];

const createDefaultLeaves = () => ({
  annual: { total: 20, used: 0 },
  casual: { total: 10, used: 0 },
  medical: { total: 15, used: 0 }
});

const DEFAULT_SHIFT = { start: "08:00", end: "17:00" };

export const INITIAL_EMPLOYEES: Employee[] = ([
  // MAIN CAMPUS (9)
  { id: "FAMC1001", name: "Maulana Syed Osama Ali", designation: "Mudeer", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1002", name: "Maulana Abrar Hussain", designation: "Mudeer", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1003", name: "Maulana Abid Ali", designation: "Mudeer", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1004", name: "Maulana Maaz bin Tajammul", designation: "Mudeer", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1005", name: "Sufi Jamil-ur-Rahman Abbasi", designation: "Mudeer", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1006", name: "Maulana Hammad Ahmed Turk", designation: "Naib Mudeer", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1007", name: "Shuja Anwar Ahmed Hashmi", designation: "Accountant", department: "Finance", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1008", name: "Maulana Muhammad Iqbal", designation: "Muavin", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMC1009", name: "Mufti Syed Ahmed Ali", designation: "Co-ordinator Wifaq", department: "Administration", campus: "Main Campus", shiftStart: "08:00", shiftEnd: "17:00" },

  // JOHAR CAMPUS (22)
  { id: "FAJC2001", name: "Ansar Ahmed", designation: "Mutamad", department: "Administration", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2002", name: "Muhammad Usman Khan", designation: "Naib Mudeer", department: "Administration", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2003", name: "Maulana Muhammad Umar", designation: "Masool", department: "Administration", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2004", name: "Maulana Hosh Muhammad Pasha", designation: "Ustaad", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2005", name: "Maulana Muhammad Faraz", designation: "Ustaad", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2006", name: "Maulana Abdul Qadir Hashim", designation: "Ustaad", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2007", name: "Mufti Dr. Hayat Muhammad", designation: "Ustaad", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2008", name: "Muhammad Haris Ali", designation: "Muavin", department: "Administration", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2009", name: "Qari Faysal Nadeem", designation: "Muallim Hifz", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2010", name: "Qari Rehmanullah", designation: "Muallim Hifz", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2011", name: "Qari Naseerullah", designation: "Muallim Hifz", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2012", name: "Qaria Zauja Absar Khan", designation: "Muallimah Nazra", department: "Education", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2013", name: "Abdullah Iftikhar", designation: "Designer", department: "IT", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2014", name: "Malik Aqib Farooq", designation: "Designer", department: "IT", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2015", name: "Abdul Qadeer", designation: "Muavin-e-Intezami Umoor", department: "Administration", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2016", name: "Abu Bakar", designation: "Security Guard", department: "Security", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2017", name: "Irfan Ullah", designation: "Khadim", department: "General Services", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2018", name: "Zakir Imran", designation: "Driver", department: "Transport", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2019", name: "Hidayat Ullah", designation: "Khadim", department: "General Services", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2020", name: "Muhammad Yahya", designation: "Khadim", department: "General Services", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2021", name: "Izaz Ullah", designation: "IT Assistant", department: "IT", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAJC2022", name: "Muhammad Nadeem", designation: "Librarian", department: "Library", campus: "Johar Campus", shiftStart: "08:00", shiftEnd: "17:00" },

  // MASJID CAMPUS (24)
  { id: "FAMS3001", name: "Abrar Hussain", designation: "Director", department: "Administration", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3002", name: "Muhammad Shoaib", designation: "Mufti", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "07:45", shiftEnd: "16:45" },
  { id: "FAMS3003", name: "Abdul Ghafoor Siddique", designation: "Imam e Masjid Shafeeq ur Rahman", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "06:00", shiftEnd: "17:00" },
  { id: "FAMS3004", name: "Shahid Khan", designation: "Ustaad", department: "Education", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3005", name: "Muhammad Haroon", designation: "Muavin-e-Fatawa Yasaloonak", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3006", name: "Mubashir Umer", designation: "Muavin-e-Fatawa Yasaloonak", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "22:30" },
  { id: "FAMS3007", name: "Ijaz Ahmed", designation: "Naib Imam-e-Masjid Shafeeq ur Rahman", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3008", name: "Shaheer Afzal", designation: "Rafeeq Darul Ifta", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3009", name: "AbduSaboor", designation: "Rafeeq Darul Ifta", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3010", name: "Umair Aman", designation: "Muavin e Intezami Umoor", department: "Administration", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "20:00" },
  { id: "FAMS3011", name: "Wali Maaz", designation: "Khadim-e-Masjid Shafeeq ur Rahman", department: "General Services", campus: "Masjid Campus", shiftStart: "05:00", shiftEnd: "21:00" },
  { id: "FAMS3012", name: "Shahid Ali", designation: "Khadim-e-Masjid Shafeeq ur Rahman", department: "General Services", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3013", name: "Saddam Hussain", designation: "Khadim-e-Masjid Shafeeq ur Rahman", department: "General Services", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "21:00" },
  { id: "FAMS3014", name: "Shahid Sangrasi", designation: "Khadim-e-Masjid Shafeeq ur Rahman", department: "General Services", campus: "Masjid Campus", shiftStart: "07:00", shiftEnd: "21:00" },
  { id: "FAMS3015", name: "Abdullah Iftikhar", designation: "Designer", department: "IT", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3016", name: "Bint e Jameel", designation: "Muallima", department: "Education", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3017", name: "Umme Yahya", designation: "Muallima", department: "Education", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3018", name: "Shahbaz Ali", designation: "Ustaad", department: "Education", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3019", name: "Muhammad Usman Habib", designation: "Muin Mufti", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3020", name: "Ahsan Ullah Shaiq", designation: "Raees Darul Ifta Fatawa Yasaloonak / Ustaad", department: "Religious Affairs", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3021", name: "Muhammad bin Ismail", designation: "Ustaad", department: "Education", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMS3022", name: "Ameer Muavia", designation: "Muawin Madarsa", department: "Education", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "20:00" },
  { id: "FAMS3023", name: "Ghulam Abbas", designation: "Khadim-e-Masjid Shafeeq ur Rahman", department: "General Services", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "20:00" },
  { id: "FAMS3024", name: "Mumtaz", designation: "Khadim-e-Masjid Shafeeq ur Rahman", department: "General Services", campus: "Masjid Campus", shiftStart: "08:00", shiftEnd: "20:00" },

  // MAKTAB CAMPUS (10)
  { id: "FAMT4001", name: "Muhammad Raid", designation: "Masool Intizami Umoor", department: "Administration", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4002", name: "Daniyal Tasleem", designation: "Office Assistant", department: "Administration", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4003", name: "Qari Muhammad Tahir Sami", designation: "Muallim", department: "Education", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4004", name: "Qari Ammar Ansari", designation: "Muallim", department: "Education", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4005", name: "Qari Muhammad Idrees", designation: "Muallim", department: "Education", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4006", name: "Umm-e-Ahsan", designation: "Muallimah", department: "Education", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4007", name: "Umme Hatim", designation: "Muallimah", department: "Education", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4008", name: "Afzal Khan", designation: "Cook", department: "Kitchen", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4009", name: "Ubaid Ullah", designation: "Khadim", department: "General Services", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
  { id: "FAMT4010", name: "Qasim Sangrasi", designation: "Security Guard", department: "Security", campus: "Maktab Campus", shiftStart: "08:00", shiftEnd: "17:00" },
] as any[]).map(emp => ({
  ...emp,
  campus: emp.campus as CampusCode,
  status: 'full_time' as const,
  username: emp.id,
  password: "abc123",
  accountLocked: false,
  attendance: [],
  leaves: createDefaultLeaves(),
  leaveRequests: [],
  performanceReviews: []
}));
