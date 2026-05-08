
import { Employee, User, CampusCode } from '../types';

export const INITIAL_USERS: User[] = [
  { id: "USR001", username: "shuja", password: "password1", name: "Shuja Anwar", email: "shuja@fiqhacademy.com", campus: "Main Campus", role: "admin", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR002", username: "haris", password: "password2", name: "Haris Ali", email: "haris@fiqhacademy.com", campus: "Johar Campus", role: "user", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR003", username: "umair", password: "password3", name: "Umair Aman", email: "umair@fiqhacademy.com", campus: "Masjid Campus", role: "user", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR004", username: "raid", password: "password4", name: "Raid Ansar", email: "raid@fiqhacademy.com", campus: "Maktab Campus", role: "user", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" },
  { id: "USR005", username: "mudeer", password: "mudeer123", name: "Maulana Syed Osama Ali", email: "mudeer@fiqhacademy.com", campus: "Main Campus", role: "mudeer", accountLocked: false, createdAt: "2024-01-01T00:00:00Z" }
];

const createDefaultLeaves = () => ({
  annual: { total: 14, used: 0 },
  casual: { total: 7, used: 0 },
  medical: { total: 7, used: 0 }
});

const DEFAULT_SHIFT = { start: "08:00", end: "17:00" };

export const INITIAL_EMPLOYEES: Employee[] = ([
  // MAIN CAMPUS (11)
  { id: "FAMC1001", name: "Maulana Syed Osama Ali", designation: "Mudeer", department: "Jauhar Campus", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1002", name: "Maulana Abrar Hussain", designation: "Mudeer", department: "Masjid Campus", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1003", name: "Maulana Abid Ali", designation: "Mudeer", department: "Rabta o Social Media", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1004", name: "Maulana Maaz bin Tajammul", designation: "Mudeer", department: "Maktab Campus", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1005", name: "Sufi Jamil-ur-Rahman Abbasi", designation: "Mudeer", department: "Tasneef o Taleef", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1006", name: "Maulana Hammad Ahmed Turk", designation: "Naib Mudeer", department: "Tasneef o Taleef", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1007", name: "Shuja Anwar Ahmed Hashmi", designation: "Accountant", department: "Accounts Main Campus", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1008", name: "Shahzad Ahmed", designation: "I.T Assistant", department: "I.T", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1009", name: "Muhammad Ashraf", designation: "Drive", department: "Admin", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1010", name: "Hafeez ur Rehman", designation: "Transcriber", department: "Tasneef o Taleef", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMC1011", name: "Mufti Syed Ahmed Ali", designation: "Co-ordinator Wifaq", department: "Main Campus", campus: "Main Campus", shiftStart: "09:00", shiftEnd: "18:00" },

  // JOHAR CAMPUS (23)
  { id: "FAJC1001", name: "Maulana Muhammad Haroon", designation: "Naib Mudeer", department: "Academic", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1002", name: "Mufti Muhammad Shoaib", designation: "Muin Mufti", department: "Dar-ul-Ifta", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1003", name: "Maulana Mubashr Umer", designation: "Muavin", department: "Takhassus", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1004", name: "Maulana Shaheer Afzal", designation: "Muavin", department: "Dar-ul-Ifta", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1005", name: "Maulana Hisbullah", designation: "Muavin", department: "Dar-ul-Ifta", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1006", name: "Mufti Shahid Khan", designation: "Ustaad", department: "Takhassus", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1007", name: "Maulana M. Usman Habib", designation: "Muin Mufti", department: "Takhassus", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1008", name: "Qari Naseerullah", designation: "Muallim Hifz", department: "Madrasa", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1009", name: "Maulana Abdul Saboor", designation: "Muavin", department: "IT", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1010", name: "Syed Abdul Rahman", designation: "Accountant", department: "Finance", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1011", name: "Molana Abdullah Inayat", designation: "Masool", department: "Admin", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1012", name: "Qasim Sangarsi", designation: "Security Guard", department: "Admin", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1013", name: "Irfan Ullah", designation: "Khadim", department: "Admin", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1014", name: "Hidayat Ullah", designation: "Khadim", department: "Admin", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1015", name: "Hammadullah", designation: "Chef", department: "Admin", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1016", name: "Mufti Ahsan Ullah Shaiq", designation: "Raees", department: "Dar-ul-Ifta", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1017", name: "Maulana Dr.Muhammad Ismail Arfi", designation: "Ustaad", department: "Takhassus", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1018", name: "Mufti Asad Ullah Shahbaz", designation: "Ustaad", department: "Dar-ul-Ifta", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1019", name: "Maulana Abdul Qadir Hashim", designation: "Ustaad", department: "Academic", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1020", name: "Mufti Dr. Hayat Muhammad", designation: "Ustaad", department: "Academic", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1021", name: "Maulana Muhammad Faraz", designation: "Ustaad", department: "Academic", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1022", name: "Malik Aqib Farooq", designation: "Designer", department: "Media", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAJC1023", name: "Muhammad Ibrahim Bin Tanveer", designation: "Software Eng", department: "IT", campus: "Johar Campus", shiftStart: "09:00", shiftEnd: "18:00" },

  // MASJID CAMPUS (17)
  { id: "FAMS1001", name: "Muhammad Usman Khan", designation: "Naib Mudeer", department: "Social Media", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1002", name: "Ansar Ahmed", designation: "Mutamad", department: "Admain", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1003", name: "Qari Faysal Nadeem", designation: "Muallim Hifz", department: "Madrasa", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1004", name: "Qari Rehmanullah", designation: "Muallim Hifz", department: "Madrasa", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1005", name: "Maulana Muhammad Umar", designation: "Masool", department: "Academic", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1006", name: "Maulana Hosh Muhammad Pasha", designation: "Ustaad", department: "Academic", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1007", name: "Muhammad Saad Abdullah", designation: "Masool", department: "Admin | Mess & Transport", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1008", name: "Umm-e-Yahya", designation: "Muallima", department: "Academic", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1009", name: "Bint-e-Jameel", designation: "Muallima", department: "Academic", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1010", name: "Malik Aqib Farooq", designation: "Designer", department: "Media", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1011", name: "Shahid Ali Sanghrasi", designation: "Cook/ Khadim", department: "Admin", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1012", name: "Mumtaaz Muhib", designation: "Cook", department: "Admin", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1013", name: "Izaz Ullah", designation: "I.T Assistant", department: "I.T", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1014", name: "Ghulam Murtaza", designation: "Cook/ Khadim", department: "Admin", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1015", name: "Maulana Umar Banvi", designation: "Naib Imam", department: "Admin", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1016", name: "Wali Maaz", designation: "Muazzin/ Khadim", department: "Admin", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMS1017", name: "Saddam Hussain", designation: "Technician / Khadim", department: "Admin", campus: "Masjid Campus", shiftStart: "09:00", shiftEnd: "18:00" },

  // MAKTAB CAMPUS (16)
  { id: "FAMK1001", name: "Muhammad Raid", designation: "Masool Intizami Umoor", department: "Admin", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1002", name: "Muhammad Arif", designation: "Accountant", department: "Admin", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1003", name: "Daniyal Tasleem", designation: "Office Assistant", department: "Admin", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1004", name: "Munir Ahmed", designation: "Digital Media Coordinator", department: "Social Media", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1005", name: "Qari Muhammad Tahir Sami", designation: "Muallim", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1006", name: "Qari Ammar Ansari", designation: "Muallim", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1007", name: "Muhammad Salih", designation: "Muallim", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1008", name: "Umm-e-Ahsan", designation: "Muallimah", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1009", name: "Laiba Sahiba", designation: "Muallimah", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1010", name: "Hania Sahiba", designation: "Muallimah", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1011", name: "Bint e Mujeeb ul Islam", designation: "Coordinator", department: "Female Nazra Setion", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1012", name: "Umme Hatim", designation: "Muallimah", department: "Madrasa", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1013", name: "Muhammad Rafeeq", designation: "Cook", department: "Kitchen", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1014", name: "Ubaid Ullah", designation: "Khadim", department: "Admin", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1015", name: "Masi Sahiba", designation: "Masi", department: "Admin", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
  { id: "FAMK1016", name: "Abu Bakar", designation: "Security Guard", department: "Admin", campus: "Maktab Campus", shiftStart: "09:00", shiftEnd: "18:00" },
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
