export interface School {
  id: string;
  name: string;
  city: string;
}

export const schools: School[] = [
  { id: "lic1", name: "Colegiul Național Cantemir Vodă", city: "București" },
  { id: "lic2", name: "Colegiul Național Spiru Haret", city: "București" },
];

const SCHOOL_STORAGE_KEY = "pylearn-school";

export function getSelectedSchool(): string | null {
  return localStorage.getItem(SCHOOL_STORAGE_KEY);
}

export function setSelectedSchool(schoolId: string) {
  localStorage.setItem(SCHOOL_STORAGE_KEY, schoolId);
}

export function clearSelectedSchool() {
  localStorage.removeItem(SCHOOL_STORAGE_KEY);
}
