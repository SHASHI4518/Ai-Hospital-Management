import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { RouterModule } from '@angular/router';

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

  doctors: any[] = [];
  filteredDoctors: any[] = [];
  selectedDoctor: any = null;
  editImageFile: File | null = null;
  editImagePreview: string | null = null;
  editImageError = '';

  selectedDate: string = new Date().toISOString().split('T')[0];

  readonly ALL_SLOTS = [
    "09:00","10:00","11:00","12:00","13:00","14:00",
    "15:00","16:00","17:00","18:00","19:00","20:00","21:00"
  ];
  doctorSlots: { [slotKey: string]: { [time: string]: number } } = {};
  pendingToggles: Set<string> = new Set();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadDoctors(); }

  switchTab(tab: 'add' | 'edit') {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'edit') this.loadDoctors();
  }

  clearMessages() { this.successMsg = ''; this.errorMsg = ''; }

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

    this.http.post('http://localhost:8080/doctors', fd, { responseType: 'text' })
      .subscribe({
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

  loadDoctors() {
    this.http.get<any[]>('http://localhost:8080/doctors').subscribe({
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
    setTimeout(() => {
      document.getElementById('editFormSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  clearSelection() { this.selectedDoctor = null; this.removeEditPhoto(); }

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

    this.http.put(
      `http://localhost:8080/doctors/${this.selectedDoctor.id}`, fd, { responseType: 'text' }
    ).subscribe({
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
    this.http.delete(`http://localhost:8080/doctors/${id}`, { responseType: 'text' }).subscribe({
      next: () => {
        this.successMsg = 'Doctor deleted.';
        const prefix = `${id}_`;
        Object.keys(this.doctorSlots).forEach(key => {
          if (key.startsWith(prefix)) delete this.doctorSlots[key];
        });
        this.loadDoctors();
        if (this.selectedDoctor?.id === id) this.selectedDoctor = null;
        this.cdr.detectChanges();
      },
      error: () => { this.errorMsg = 'Error deleting doctor.'; }
    });
  }

  loadSlots(doctorId: number, date: string) {
    this.http.get<any[]>(`http://localhost:8080/slots/${doctorId}?date=${date}`).subscribe({
      next: (res) => {
        const map: { [time: string]: number } = {};
        res.forEach((s: any) => { map[s.time] = Number(s.available); });
        const slotKey = `${doctorId}_${date}`;
        this.doctorSlots[slotKey] = map;
        this.cdr.detectChanges();
      },
      error: () => console.error(`Failed to load slots for doctor ${doctorId} on date ${date}`)
    });
  }

  onDateChange() {
    if (this.selectedDoctor) {
      this.loadSlots(this.selectedDoctor.id, this.selectedDate);
    }
  }

  isChecked(docId: number, time: string): boolean {
    const slotKey = `${docId}_${this.selectedDate}`;
    const map = this.doctorSlots[slotKey];
    return map ? map[time] === 1 : false;
  }

  toggleSlot(docId: number, time: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;

    if (this.selectedDoctor && !this.selectedDoctor.available) {
      checkbox.checked = false;
      return;
    }

    const newAvailable = checkbox.checked ? 1 : 0;
    const slotKey = `${docId}_${this.selectedDate}`;
    const pendingKey = `${docId}_${this.selectedDate}_${time}`;
    if (this.pendingToggles.has(pendingKey)) { checkbox.checked = !checkbox.checked; return; }

    if (!this.doctorSlots[slotKey]) this.doctorSlots[slotKey] = {};
    this.doctorSlots[slotKey][time] = newAvailable;
    this.cdr.detectChanges();
    this.pendingToggles.add(pendingKey);

    this.http.post<any>('http://localhost:8080/slots',
      { doctor_id: docId, date: this.selectedDate, time, available: newAvailable }).subscribe({
      next: (res) => {
        this.doctorSlots[slotKey][time] = Number(res.available);
        this.pendingToggles.delete(pendingKey);
        this.cdr.detectChanges();
      },
      error: () => {
        this.doctorSlots[slotKey][time] = newAvailable === 1 ? 0 : 1;
        checkbox.checked = !checkbox.checked;
        this.pendingToggles.delete(pendingKey);
        this.cdr.detectChanges();
        alert(`Failed to update slot ${time}. Please try again.`);
      }
    });
  }

  localToggleSlot(time: string, event: Event) {
    if (!this.selectedDoctor) return;
    const checkbox = event.target as HTMLInputElement;
    if (!this.selectedDoctor.available) {
      checkbox.checked = false;
      return;
    }
    const docId = this.selectedDoctor.id;
    const slotKey = `${docId}_${this.selectedDate}`;
    if (!this.doctorSlots[slotKey]) {
      this.doctorSlots[slotKey] = {};
    }
    this.doctorSlots[slotKey][time] = checkbox.checked ? 1 : 0;
    this.cdr.detectChanges();
  }

  uploadOrUpdateSlots(docId: number) {
    if (!this.selectedDate) {
      this.errorMsg = 'Please select a valid date first.';
      return;
    }
    this.clearMessages();
    const slotKey = `${docId}_${this.selectedDate}`;
    const localMap = this.doctorSlots[slotKey] || {};
    
    const slotsPayload = this.ALL_SLOTS.map(time => ({
      time,
      available: localMap[time] !== undefined ? localMap[time] : 0
    }));

    const pendingKeys: string[] = [];
    this.ALL_SLOTS.forEach(time => {
      const pKey = `${docId}_${this.selectedDate}_${time}`;
      this.pendingToggles.add(pKey);
      pendingKeys.push(pKey);
    });
    this.cdr.detectChanges();

    this.http.post<any>('http://localhost:8080/slots', {
      doctor_id: docId,
      date: this.selectedDate,
      slots: slotsPayload
    }).subscribe({
      next: () => {
        this.successMsg = 'Slots configured and updated successfully.';
        pendingKeys.forEach(pKey => this.pendingToggles.delete(pKey));
        this.loadSlots(docId, this.selectedDate);
      },
      error: () => {
        this.errorMsg = 'Error applying slot setup configurations.';
        pendingKeys.forEach(pKey => this.pendingToggles.delete(pKey));
        this.loadSlots(docId, this.selectedDate);
      }
    });
  }

  onAvailabilityChange(value: boolean) {
    if (!this.selectedDoctor) return;
    this.selectedDoctor.available = value ? 1 : 0;

    if (!value && this.selectedDoctor.id) {
      const docId = this.selectedDoctor.id;
      const slotKey = `${docId}_${this.selectedDate}`;
      const slots = this.doctorSlots[slotKey] || {};
      const updates = Object.keys(slots)
        .filter(time => slots[time] === 1)
        .map(time =>
          this.http.post<any>('http://localhost:8080/slots',
            { doctor_id: docId, date: this.selectedDate, time, available: 0 }).toPromise()
        );
      Promise.all(updates).then(() => this.loadSlots(docId, this.selectedDate));
    }
  }

  trackById(index: number, item: any) { return item.id; }
}