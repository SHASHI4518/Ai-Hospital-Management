import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DoctorService } from 'src/app/core/services/doctor.service';

const API = 'http://localhost:8080';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  selectedDoctorId: number | null = null;
  doctors: any[] = [];
  appointments: any[] = [];
  selectedDate = '';
  selectedTime = '';
  today: string = new Date().toISOString().split('T')[0];

  slots: string[] = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  // doctorSlots[`${docId}_${date}`][time] = 0|1
  doctorSlots: { [slotKey: string]: { [time: string]: number } } = {};

  // Per-date doctor availability: true = available, false = not available, null = not loaded
  dateAvailability: { [key: string]: boolean } = {};
  loadingSlots = false;

  specializationsInfo = [
    { name: 'Gynecologist', desc: 'Women health, pregnancy, and reproductive care.', icon: '🩺' },
    { name: 'Cardiologist', desc: 'Heart health, cardiovascular diseases, and hypertension.', icon: '❤️' },
    { name: 'Dermatologist', desc: 'Skin conditions, acne, allergies, and hair disorders.', icon: '✨' },
    { name: 'Pediatrician', desc: 'Medical care for infants, children, and adolescents.', icon: '👶' },
    { name: 'Orthopedic Doctor', desc: 'Bone, joint, ligament, and muscle treatment.', icon: '🦴' },
    { name: 'Neurologist', desc: 'Brain, spinal cord, and nervous system disorders.', icon: '🧠' },
    { name: 'Psychiatrist', desc: 'Mental health, emotional wellness, and therapy.', icon: '💭' },
    { name: 'Ophthalmologist', desc: 'Eye examinations, vision care, and surgeries.', icon: '👁️' },
    { name: 'ENT Specialist', desc: 'Ear, nose, throat, and head-neck conditions.', icon: '👂' },
    { name: 'General Physician', desc: 'Primary care, family medicine, and routine checkups.', icon: '🏥' },
    { name: 'Dentist', desc: 'Oral hygiene, dental fillings, and teeth alignment.', icon: '🦷' },
    { name: 'Urologist', desc: 'Urinary tract and male reproductive system care.', icon: '💧' },
    { name: 'Oncologist', desc: 'Cancer diagnosis, treatment, and chemotherapy.', icon: '🎗️' },
    { name: 'Radiologist', desc: 'X-rays, MRIs, CT scans, and medical imaging.', icon: '🩻' },
    { name: 'Pulmonologist', desc: 'Respiratory tracking, lungs, and asthma care.', icon: '🫁' },
    { name: 'Endocrinologist', desc: 'Hormone imbalances, thyroid, and diabetes management.', icon: '🩸' },
    { name: 'Gastroenterologist', desc: 'Digestive system, stomach, and liver health.', icon: '🍏' },
    { name: 'Nephrologist', desc: 'Kidney functions, treatments, and dialysis management.', icon: '💧' },
    { name: 'Surgeon', desc: 'Operative treatments and complex physical interventions.', icon: '✂️' },
    { name: 'Physiotherapist', desc: 'Physical rehabilitation, posture, and movement recovery.', icon: '🏃' }
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

  loadDoctors() {
    this.doctorService.getDoctors().subscribe((res: any) => {
      this.doctors = res;
    });
  }

  /**
   * Load slots for a doctor+date from backend.
   * Backend returns { doctorAvailableOnDate: bool|null, slots: [...] }
   */
  loadSlots(doctorId: number, date: string) {
    if (!date) return;
    this.loadingSlots = true;

    this.http.get<any>(`${API}/slots/${doctorId}?date=${date}`).subscribe({
      next: (res) => {
        const slotKey = `${doctorId}_${date}`;
        const avKey = slotKey;

        // Handle both old array response and new object response
        let slotsArr: any[] = [];
        let doctorAvailableOnDate: boolean | null = null;

        if (Array.isArray(res)) {
          slotsArr = res;
        } else {
          slotsArr = res.slots || [];
          doctorAvailableOnDate = res.doctorAvailableOnDate;
        }

        const map: { [time: string]: number } = {};
        slotsArr.forEach((s: any) => { map[s.time] = Number(s.available); });
        this.doctorSlots[slotKey] = map;

        // Set date-wise availability
        if (doctorAvailableOnDate === false) {
          this.dateAvailability[avKey] = false;
        } else if (doctorAvailableOnDate === true) {
          this.dateAvailability[avKey] = true;
        } else {
          // null = no override, check global
          const doc = this.doctors.find(d => d.id === doctorId);
          this.dateAvailability[avKey] = doc ? doc.available === 1 : false;
        }

        this.loadingSlots = false;
        this.cd.detectChanges();
      },
      error: () => {
        console.error(`Failed to load slots for doctor ${doctorId} on date ${date}`);
        this.loadingSlots = false;
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

  /**
   * Whether a slot button should be disabled.
   * Disabled if: no date, slots not loaded, or admin set available=0 for that slot.
   */
  isSlotDisabled(docId: number, time: string): boolean {
    if (!this.selectedDate) return true;
    const slotKey = `${docId}_${this.selectedDate}`;

    // If doctor is unavailable on this date, all slots disabled
    if (this.dateAvailability[slotKey] === false) return true;

    const map = this.doctorSlots[slotKey];
    if (!map) return true;
    if (map[time] === undefined) return true;
    return map[time] === 0;
  }

  /** True if doctor is available on the selectedDate */
  isDoctorAvailableOnDate(docId: number): boolean {
    if (!this.selectedDate) {
      const doc = this.doctors.find(d => d.id === docId);
      return doc ? doc.available === 1 : false;
    }
    const avKey = `${docId}_${this.selectedDate}`;
    if (this.dateAvailability[avKey] !== undefined) {
      return this.dateAvailability[avKey];
    }
    // Fallback to global
    const doc = this.doctors.find(d => d.id === docId);
    return doc ? doc.available === 1 : false;
  }

  /** True if slots have been fetched for the current doctor+date */
  hasSlotsLoaded(docId: number): boolean {
    if (!this.selectedDate) return false;
    const slotKey = `${docId}_${this.selectedDate}`;
    return this.doctorSlots[slotKey] !== undefined;
  }

  loadAppointments() {
    const mobile = localStorage.getItem("user");
    if (!mobile) return;

    this.http.get<any[]>(`${API}/appointments/${mobile}`).subscribe({
      next: (res) => {
        this.appointments = res;
        this.cd.detectChanges();
      },
      error: () => { console.error("Failed to load appointments"); }
    });
  }

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
      next: (res) => {
        alert(res);
        this.loadAppointments();
        this.loadSlots(doctorId, this.selectedDate);
        this.selectedDate = '';
        this.selectedTime = '';
      },
      error: () => { alert("Error booking appointment"); }
    });
  }

  cancel(id: number) {
    this.http.delete(`${API}/appointments/${id}`, { responseType: 'text' }).subscribe({
      next: (res) => { alert(res); this.loadAppointments(); },
      error: () => { alert("Error cancelling appointment"); }
    });
  }

  getDoctorName(id: number) {
    const doc = this.doctors.find(d => d.id === id);
    return doc ? doc.name : 'Unknown';
  }

  logout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  trackById(index: number, item: any) { return item.id; }

  formatDateOnly(dateString: string): string {
    if (!dateString) return '';
    return dateString.split('T')[0];
  }
}
