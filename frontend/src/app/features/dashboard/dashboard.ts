import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { MatIconModule } from '@angular/material/icon';

const API = 'http://localhost:8080';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('comboInput') comboInputRef!: ElementRef<HTMLInputElement>;

  selectedDoctorId: number | null = null;
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  doctorSearch = '';

  // ── Combobox state ──────────────────────────────────────
  dropdownOpen = false;
  comboHighlightIndex = -1;
  // ────────────────────────────────────────────────────────

  appointments: any[] = [];
  selectedDate = '';
  selectedTime = '';
  today: string = new Date().toISOString().split('T')[0];

  readonly ALL_SLOTS = [
    "09:00","10:00","11:00","12:00","13:00","14:00",
    "15:00","16:00","17:00","18:00","19:00","20:00","21:00"
  ];

  doctorSlots: { [slotKey: string]: { [time: string]: number } } = {};
  dateAvailability: { [key: string]: boolean } = {};
  loadingSlots = false;

  specializationsInfo = [
    { name: 'Gynecologist',       desc: 'Women health, pregnancy, and reproductive care.',           icon: '🩺' },
    { name: 'Cardiologist',       desc: 'Heart health, cardiovascular diseases, and hypertension.',  icon: '❤️' },
    { name: 'Dermatologist',      desc: 'Skin conditions, acne, allergies, and hair disorders.',     icon: '✨' },
    { name: 'Pediatrician',       desc: 'Medical care for infants, children, and adolescents.',      icon: '👶' },
    { name: 'Orthopedic Doctor',  desc: 'Bone, joint, ligament, and muscle treatment.',              icon: '🦴' },
    { name: 'Neurologist',        desc: 'Brain, spinal cord, and nervous system disorders.',         icon: '🧠' },
    { name: 'Psychiatrist',       desc: 'Mental health, emotional wellness, and therapy.',           icon: '💭' },
    { name: 'Ophthalmologist',    desc: 'Eye examinations, vision care, and surgeries.',             icon: '👁️' },
    { name: 'ENT Specialist',     desc: 'Ear, nose, throat, and head-neck conditions.',              icon: '👂' },
    { name: 'General Physician',  desc: 'Primary care, family medicine, and routine checkups.',     icon: '🏥' },
    { name: 'Dentist',            desc: 'Oral hygiene, dental fillings, and teeth alignment.',       icon: '🦷' },
    { name: 'Urologist',          desc: 'Urinary tract and male reproductive system care.',          icon: '💧' },
    { name: 'Oncologist',         desc: 'Cancer diagnosis, treatment, and chemotherapy.',            icon: '🎗️' },
    { name: 'Radiologist',        desc: 'X-rays, MRIs, CT scans, and medical imaging.',             icon: '🩻' },
    { name: 'Pulmonologist',      desc: 'Respiratory tracking, lungs, and asthma care.',            icon: '🫁' },
    { name: 'Endocrinologist',    desc: 'Hormone imbalances, thyroid, and diabetes management.',    icon: '🩸' },
    { name: 'Gastrnterologist',   desc: 'Digestive system, stomach, and liver health.',             icon: '🍏' },
    { name: 'Nephrologist',       desc: 'Kidney functions, treatments, and dialysis management.',   icon: '💧' },
    { name: 'Surgeon',            desc: 'Operative treatments and complex physical interventions.',  icon: '✂️' },
    { name: 'Physiotherapist',    desc: 'Physical rehabilitation, posture, and movement recovery.', icon: '🏃' }
  ];

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDoctors();
    this.loadAppointments();
  }

  // ── Close dropdown when clicking outside ─────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.combobox-wrapper')) {
      this.closeDropdown();
    }
  }

  // ── Combobox methods ──────────────────────────────────────

  openDropdown() {
    this.dropdownOpen = true;
    // Clear the input text so user sees the full list immediately
    if (this.selectedDoctorId && this.doctorSearch === this.getSelectedDoctorLabel()) {
      this.doctorSearch = '';
      this.filteredDoctors = this.doctors;
    }
    this.comboHighlightIndex = -1;
    this.cd.detectChanges();
    // Focus input
    setTimeout(() => this.comboInputRef?.nativeElement?.focus(), 0);
  }

  closeDropdown() {
    this.dropdownOpen = false;
    this.comboHighlightIndex = -1;
    // Restore label text if a doctor is selected
    if (this.selectedDoctorId) {
      this.doctorSearch = '';
    }
    this.cd.detectChanges();
  }

  selectDoctor(doc: any) {
    this.selectedDoctorId = doc.id;
    this.doctorSearch = '';
    this.selectedDate = '';
    this.selectedTime = '';
    this.dropdownOpen = false;
    this.comboHighlightIndex = -1;
    this.cd.detectChanges();
  }

  clearSelection() {
    this.selectedDoctorId = null;
    this.doctorSearch = '';
    this.filteredDoctors = this.doctors;
    this.selectedDate = '';
    this.selectedTime = '';
    this.dropdownOpen = false;
    this.cd.detectChanges();
  }

  getSelectedDoctorLabel(): string {
    if (!this.selectedDoctorId) return '';
    const doc = this.doctors.find(d => d.id === this.selectedDoctorId);
    return doc ? `${doc.name} — ${doc.specialization}` : '';
  }

  onComboKeydown(event: KeyboardEvent) {
    if (!this.dropdownOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') this.openDropdown();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.comboHighlightIndex = Math.min(this.comboHighlightIndex + 1, this.filteredDoctors.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.comboHighlightIndex = Math.max(this.comboHighlightIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.comboHighlightIndex >= 0 && this.filteredDoctors[this.comboHighlightIndex]) {
          this.selectDoctor(this.filteredDoctors[this.comboHighlightIndex]);
        }
        break;
      case 'Escape':
        this.closeDropdown();
        break;
    }
    this.cd.detectChanges();
  }

  // ── Search / filter ───────────────────────────────────────

  loadDoctors() {
    this.doctorService.getDoctors().subscribe((res: any) => {
      this.doctors = res;
      this.filteredDoctors = res;
      this.cd.detectChanges();
    });
  }

  onSearchChange() {
    const q = this.doctorSearch.trim().toLowerCase();
    this.dropdownOpen = true;
    this.comboHighlightIndex = -1;
    if (!q) {
      this.filteredDoctors = this.doctors;
    } else {
      this.filteredDoctors = this.doctors.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q)
      );
    }
    this.cd.detectChanges();
  }

  // ── Slot loading ──────────────────────────────────────────

  loadSlots(doctorId: number, date: string) {
    if (!date) return;
    this.loadingSlots = true;
    const slotKey = `${doctorId}_${date}`;

    this.http.get<any>(`${API}/slots/${doctorId}?date=${date}`).subscribe({
      next: (res) => {
        const slotsArr: any[] = res.slots || (Array.isArray(res) ? res : []);
        const doctorAvailableOnDate: boolean | null = Array.isArray(res)
          ? null : res.doctorAvailableOnDate;

        const map: { [time: string]: number } = {};
        slotsArr.forEach((s: any) => { map[s.time] = Number(s.available); });
        this.doctorSlots[slotKey] = map;

        if (doctorAvailableOnDate === false) {
          this.dateAvailability[slotKey] = false;
        } else if (doctorAvailableOnDate === true) {
          this.dateAvailability[slotKey] = true;
        } else {
          const doc = this.doctors.find(d => d.id === doctorId);
          this.dateAvailability[slotKey] = doc ? Number(doc.available) === 1 : false;
        }

        this.loadingSlots = false;
        this.cd.detectChanges();
      },
      error: () => {
        console.error(`Failed to load slots for doctor ${doctorId} on ${date}`);
        this.loadingSlots = false;
        this.cd.detectChanges();
      }
    });
  }

  onDoctorChange() {
    this.selectedTime = '';
    this.selectedDate = '';
  }

  onDateChange(doctorId: number) {
    this.selectedTime = '';
    if (this.selectedDate) {
      this.loadSlots(doctorId, this.selectedDate);
    }
  }

  hasSlotsLoaded(docId: number): boolean {
    if (!this.selectedDate) return false;
    return this.doctorSlots[`${docId}_${this.selectedDate}`] !== undefined;
  }

  isDoctorAvailableOnDate(docId: number): boolean {
    if (!this.selectedDate) {
      const doc = this.doctors.find(d => d.id === docId);
      return doc ? Number(doc.available) === 1 : false;
    }
    const avKey = `${docId}_${this.selectedDate}`;
    if (this.dateAvailability[avKey] !== undefined) return this.dateAvailability[avKey];
    const doc = this.doctors.find(d => d.id === docId);
    return doc ? Number(doc.available) === 1 : false;
  }

  isSlotDisabled(docId: number, time: string): boolean {
    if (!this.selectedDate) return true;
    const slotKey = `${docId}_${this.selectedDate}`;
    if (this.dateAvailability[slotKey] === false) return true;
    const map = this.doctorSlots[slotKey];
    if (!map) return true;
    return (map[time] ?? 0) === 0;
  }

  // ── Booking ───────────────────────────────────────────────

  book(doctorId: number) {
    if (!this.selectedDate || !this.selectedTime) {
      alert("Please select date and time slot");
      return;
    }
    const data = {
      user_mobile: localStorage.getItem("user"),
      doctor_id: doctorId,
      date: this.selectedDate,
      time: this.selectedTime
    };
    this.http.post(`${API}/book`, data, { responseType: 'text' }).subscribe({
      next: () => {
        this.selectedDate = '';
        this.selectedTime = '';
        this.cd.detectChanges();
        this.router.navigate(['/appointments'], { state: { fromBooking: true } });
      },
      error: () => alert("Error booking appointment")
    });
  }

  // ── Appointments ──────────────────────────────────────────

  loadAppointments() {
    const mobile = localStorage.getItem("user");
    if (!mobile) return;
    this.http.get<any[]>(`${API}/appointments/${mobile}`).subscribe({
      next: (res) => { this.appointments = res; this.cd.detectChanges(); },
      error: () => console.error("Failed to load appointments")
    });
  }

  cancel(id: number) {
    this.http.put<any>(`${API}/appointments/${id}/cancel`, {}).subscribe({
      next: () => {
        this.appointments = this.appointments.map(a =>
          a.id === id ? { ...a, status: 'cancelled' } : a
        );
        this.cd.detectChanges();
      },
      error: () => alert("Error cancelling appointment")
    });
  }

  getDoctorName(id: number) {
    const doc = this.doctors.find(d => d.id === id);
    return doc ? doc.name : 'Unknown';
  }

  logout() {
    localStorage.removeItem("user");
    this.router.navigate(['/login']);
  }

  trackById(_: number, item: any) { return item.id; }

  formatDateOnly(dateString: string): string {
    if (!dateString) return '';
    return dateString.split('T')[0];
  }
}