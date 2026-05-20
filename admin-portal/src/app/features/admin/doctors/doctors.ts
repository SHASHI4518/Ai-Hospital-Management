import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { RouterModule } from '@angular/router';

const API = 'http://localhost:8080';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, SidebarComponent, RouterModule],
  templateUrl: './doctors.html',
  styleUrls: ['./doctors.css']
})
export class DoctorsComponent implements OnInit {

  activeTab: 'add' | 'edit' = 'add';
  searchText = '';
  successMsg = '';
  errorMsg = '';

  // ── Add form fields ──────────────────────────────────────────
  name = '';
  specialization = '';
  experience = '';
  location = '';
  clinic = '';
  fee = '';
  available = true;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  imageError = '';

  // ── Doctors list ─────────────────────────────────────────────
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  selectedDoctor: any = null;
  editImageFile: File | null = null;
  editImagePreview: string | null = null;
  editImageError = '';

  // ── Slot management ──────────────────────────────────────────
  selectedDate: string = new Date().toISOString().split('T')[0];

  readonly ALL_SLOTS = [
    '09:00','10:00','11:00','12:00','13:00','14:00',
    '15:00','16:00','17:00','18:00','19:00','20:00','21:00'
  ];

  // doctorSlots[`${docId}_${date}`][time] = 0|1
  doctorSlots: { [slotKey: string]: { [time: string]: number } } = {};

  // date-wise availability override per doctor
  // dateAvailability[`${docId}_${date}`] = true|false|null (null=not loaded yet)
  dateAvailability: { [key: string]: boolean | null } = {};

  savingSlots = false;
  savingAvailability = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadDoctors(); }

  switchTab(tab: 'add' | 'edit') {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'edit') this.loadDoctors();
  }

  clearMessages() { this.successMsg = ''; this.errorMsg = ''; }

  // ── Image handling ───────────────────────────────────────────

  onFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.processFile(f);
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    const f = e.dataTransfer?.files[0];
    if (f) this.processFile(f);
  }
  private processFile(file: File) {
    this.imageError = '';
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      this.imageError = 'Only JPG, PNG, or WEBP images are allowed.'; return;
    }
    if (file.size > 5 * 1024 * 1024) { this.imageError = 'File must be under 5 MB.'; return; }
    this.imageFile = file;
    const r = new FileReader();
    r.onload = e => { this.imagePreview = e.target?.result as string; this.cdr.detectChanges(); };
    r.readAsDataURL(file);
  }
  removePhoto() { this.imageFile = null; this.imagePreview = null; this.imageError = ''; }

  onEditFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.processEditFile(f);
  }
  onEditDrop(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    const f = e.dataTransfer?.files[0];
    if (f) this.processEditFile(f);
  }
  private processEditFile(file: File) {
    this.editImageError = '';
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      this.editImageError = 'Only JPG, PNG, or WEBP images are allowed.'; return;
    }
    if (file.size > 5 * 1024 * 1024) { this.editImageError = 'File must be under 5 MB.'; return; }
    this.editImageFile = file;
    const r = new FileReader();
    r.onload = e => { this.editImagePreview = e.target?.result as string; this.cdr.detectChanges(); };
    r.readAsDataURL(file);
  }
  removeEditPhoto() { this.editImageFile = null; this.editImagePreview = null; this.editImageError = ''; }

  // ── Add doctor ───────────────────────────────────────────────

  addDoctor() {
    if (!this.name.trim() || !this.specialization.trim()) {
      this.errorMsg = 'Name and Specialization are required.'; return;
    }
    this.clearMessages();
    const fd = new FormData();
    fd.append('name', this.name);
    fd.append('specialization', this.specialization);
    fd.append('experience', this.experience);
    fd.append('location', this.location);
    fd.append('clinic', this.clinic);
    fd.append('fee', this.fee);
    fd.append('available', String(this.available));
    if (this.imageFile) fd.append('image', this.imageFile);

    this.http.post(`${API}/doctors`, fd, { responseType: 'text' }).subscribe({
      next: () => {
        this.successMsg = 'Doctor added successfully!';
        this.resetAddForm();
        this.loadDoctors();
      },
      error: () => { this.errorMsg = 'Error adding doctor. Please try again.'; }
    });
  }

  resetAddForm() {
    this.name = ''; this.specialization = ''; this.experience = '';
    this.location = ''; this.clinic = ''; this.fee = '';
    this.available = true;
    this.removePhoto();
  }

  // ── Load / filter doctors ────────────────────────────────────

  loadDoctors() {
    this.http.get<any[]>(`${API}/doctors`).subscribe({
      next: (res) => {
        this.doctors = res;
        this.filteredDoctors = [...res];
        this.cdr.detectChanges();
      },
      error: () => { this.errorMsg = 'Error loading doctors.'; }
    });
  }

  filterDoctors() {
    const t = this.searchText.toLowerCase();
    this.filteredDoctors = this.doctors.filter(d =>
      d.name.toLowerCase().includes(t) ||
      d.specialization.toLowerCase().includes(t) ||
      d.location?.toLowerCase().includes(t)
    );
  }

  selectDoctor(doc: any) {
    this.selectedDoctor = { ...doc };
    this.removeEditPhoto();
    this.clearMessages();
    this.loadSlots(doc.id, this.selectedDate);
    this.loadDateAvailability(doc.id, this.selectedDate);
    setTimeout(() => {
      document.getElementById('editFormSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  clearSelection() { this.selectedDoctor = null; this.removeEditPhoto(); }

  // ── Update / delete doctor ───────────────────────────────────

  updateDoctor() {
    if (!this.selectedDoctor) return;
    this.clearMessages();
    const fd = new FormData();
    fd.append('name', this.selectedDoctor.name);
    fd.append('specialization', this.selectedDoctor.specialization);
    fd.append('experience', this.selectedDoctor.experience);
    fd.append('clinic', this.selectedDoctor.clinic);
    fd.append('location', this.selectedDoctor.location);
    fd.append('fee', this.selectedDoctor.fee);
    fd.append('available', String(this.selectedDoctor.available));
    if (this.editImageFile) fd.append('image', this.editImageFile);

    this.http.put(`${API}/doctors/${this.selectedDoctor.id}`, fd, { responseType: 'text' }).subscribe({
      next: () => {
        this.successMsg = 'Doctor updated successfully!';
        this.loadDoctors();
        this.selectedDoctor = null;
        this.removeEditPhoto();
      },
      error: () => { this.errorMsg = 'Error updating doctor.'; }
    });
  }

  deleteDoctor(id: number) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    this.http.delete(`${API}/doctors/${id}`, { responseType: 'text' }).subscribe({
      next: () => {
        this.successMsg = 'Doctor deleted.';
        // Clear cached slots for this doctor
        const prefix = `${id}_`;
        Object.keys(this.doctorSlots).forEach(k => { if (k.startsWith(prefix)) delete this.doctorSlots[k]; });
        Object.keys(this.dateAvailability).forEach(k => { if (k.startsWith(prefix)) delete this.dateAvailability[k]; });
        this.loadDoctors();
        if (this.selectedDoctor?.id === id) this.selectedDoctor = null;
        this.cdr.detectChanges();
      },
      error: () => { this.errorMsg = 'Error deleting doctor.'; }
    });
  }

  // ── Slot helpers ─────────────────────────────────────────────

  /**
   * Load slots for a doctor on a specific date.
   * Also respects date-wise availability returned by backend.
   */
  loadSlots(doctorId: number, date: string) {
    if (!date) return;
    this.http.get<any>(`${API}/slots/${doctorId}?date=${date}`).subscribe({
      next: (res) => {
        const slots = Array.isArray(res) ? res : res.slots;
        const map: { [time: string]: number } = {};
        if (slots) slots.forEach((s: any) => { map[s.time] = Number(s.available); });
        const slotKey = `${doctorId}_${date}`;
        this.doctorSlots[slotKey] = map;

        // Sync date availability if backend returned it
        if (!Array.isArray(res) && res.doctorAvailableOnDate !== undefined) {
          const avKey = `${doctorId}_${date}`;
          if (res.doctorAvailableOnDate === null) {
            // no override — use global flag
            this.dateAvailability[avKey] = null;
          } else {
            this.dateAvailability[avKey] = res.doctorAvailableOnDate;
          }
        }
        this.cdr.detectChanges();
      },
      error: () => console.error(`Failed to load slots for doctor ${doctorId} on ${date}`)
    });
  }

  /** Fetch date-specific availability override */
  loadDateAvailability(doctorId: number, date: string) {
    if (!date) return;
    this.http.get<any>(`${API}/doctors/${doctorId}/availability?date=${date}`).subscribe({
      next: (res) => {
        const avKey = `${doctorId}_${date}`;
        this.dateAvailability[avKey] = res.is_available;
        this.cdr.detectChanges();
      },
      error: () => console.error(`Failed to load date availability for doctor ${doctorId}`)
    });
  }

  onDateChange() {
    if (!this.selectedDoctor) return;
    this.loadSlots(this.selectedDoctor.id, this.selectedDate);
    this.loadDateAvailability(this.selectedDoctor.id, this.selectedDate);
  }

  isChecked(docId: number, time: string): boolean {
    const slotKey = `${docId}_${this.selectedDate}`;
    const map = this.doctorSlots[slotKey];
    return map ? map[time] === 1 : false;
  }

  /** Is doctor available on the currently selected date? */
  isDoctorAvailableOnDate(docId: number): boolean {
    const avKey = `${docId}_${this.selectedDate}`;
    const override = this.dateAvailability[avKey];
    if (override === null || override === undefined) {
      // Fall back to global availability flag on selectedDoctor
      return this.selectedDoctor?.available == 1;
    }
    return override;
  }

  /** Local toggle: just updates UI state, committed via Save button */
  localToggleSlot(time: string, event: Event) {
    if (!this.selectedDoctor) return;
    const checkbox = event.target as HTMLInputElement;
    if (!this.isDoctorAvailableOnDate(this.selectedDoctor.id)) {
      checkbox.checked = false;
      return;
    }
    const docId = this.selectedDoctor.id;
    const slotKey = `${docId}_${this.selectedDate}`;
    if (!this.doctorSlots[slotKey]) this.doctorSlots[slotKey] = {};
    this.doctorSlots[slotKey][time] = checkbox.checked ? 1 : 0;
    this.cdr.detectChanges();
  }

  /**
   * Save all slot toggles for the selected date.
   * Sends a batch POST to /slots.
   */
  uploadOrUpdateSlots(docId: number) {
    if (!this.selectedDate) {
      this.errorMsg = 'Please select a valid date first.';
      return;
    }
    if (!this.isDoctorAvailableOnDate(docId)) {
      this.errorMsg = 'Doctor is marked unavailable on this date. Mark as available first.';
      return;
    }
    this.clearMessages();
    this.savingSlots = true;

    const slotKey = `${docId}_${this.selectedDate}`;
    const localMap = this.doctorSlots[slotKey] || {};

    const slotsPayload = this.ALL_SLOTS.map(time => ({
      time,
      available: localMap[time] !== undefined ? localMap[time] : 0
    }));

    this.http.post<any>(`${API}/slots`, {
      doctor_id: docId,
      date: this.selectedDate,
      slots: slotsPayload
    }).subscribe({
      next: () => {
        this.successMsg = `Slots saved for ${this.selectedDate} successfully!`;
        this.savingSlots = false;
        this.loadSlots(docId, this.selectedDate);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error saving slot configuration. Please try again.';
        this.savingSlots = false;
        this.loadSlots(docId, this.selectedDate);
        this.cdr.detectChanges();
      }
    });
  }

  // ── Date-wise Availability ───────────────────────────────────

  /**
   * Admin marks doctor available/not-available on selected date.
   * Persists to doctor_availability table.
   */
  saveDateAvailability(docId: number, isAvailable: boolean) {
    if (!this.selectedDate) {
      this.errorMsg = 'Please select a date first.';
      return;
    }
    this.clearMessages();
    this.savingAvailability = true;

    this.http.post<any>(`${API}/doctors/${docId}/availability`, {
      date: this.selectedDate,
      is_available: isAvailable
    }).subscribe({
      next: () => {
        const avKey = `${docId}_${this.selectedDate}`;
        this.dateAvailability[avKey] = isAvailable;
        this.successMsg = `Doctor marked as ${isAvailable ? 'Available' : 'Unavailable'} on ${this.selectedDate}.`;
        this.savingAvailability = false;
        // Reload slots to reflect change
        this.loadSlots(docId, this.selectedDate);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error updating date availability. Please try again.';
        this.savingAvailability = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAvailabilityChange(value: boolean) {
    if (!this.selectedDoctor) return;
    this.selectedDoctor.available = value ? 1 : 0;
  }

  trackById(index: number, item: any) { return item.id; }
}
