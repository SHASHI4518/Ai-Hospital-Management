import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-edit-doctor',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './edit-doctor.html',
  styleUrls: ['./edit-doctor.css'] 
})
export class EditDoctorComponent implements OnInit {

  doctors: any[] = [];
  filteredDoctors: any[] = [];
  selectedDoctor: any = null;
  searchText: string = '';

  // ── edit image fields ──
  editImageFile: File | null = null;
  editImagePreview: string | null = null;
  editImageError = '';

  slots: string[] = [
    "09:00","10:00","11:00","12:00",
    "13:00","14:00","15:00","16:00",
    "17:00","18:00","19:00","20:00","21:00"
  ];

  doctorSlots: { [doctorId: number]: { [time: string]: number } } = {};
  pendingToggles: Set<string> = new Set();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadDoctors(); }

  // ── file upload handlers ──────────────────

  onEditFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.processEditFile(input.files[0]);
  }

  onEditDrop(event: DragEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const file = event.dataTransfer?.files[0];
    if (file) this.processEditFile(file);
  }

  private processEditFile(file: File) {
    this.editImageError = '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.editImageError = 'Only JPG, PNG, or WEBP images are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.editImageError = 'File must be under 5 MB.';
      return;
    }
    this.editImageFile = file;
    const reader = new FileReader();
    reader.onload = e => this.editImagePreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removeEditPhoto() {
    this.editImageFile = null;
    this.editImagePreview = null;
    this.editImageError = '';
  }

  // ── update doctor ─────────────────────────

  updateDoctor() {
    if (!this.selectedDoctor) { alert("Please select a doctor first"); return; }

    const fd = new FormData();
    fd.append('name', this.selectedDoctor.name);
    fd.append('specialization', this.selectedDoctor.specialization);
    fd.append('experience', this.selectedDoctor.experience);
    fd.append('clinic', this.selectedDoctor.clinic);
    fd.append('location', this.selectedDoctor.location);
    fd.append('fee', this.selectedDoctor.fee);
    fd.append('available', String(this.selectedDoctor.available));
    // only append image if a new file was chosen; otherwise keep existing
    if (this.editImageFile) fd.append('image', this.editImageFile);

    this.http.put(
      `http://localhost:8080/doctors/${this.selectedDoctor.id}`,
      fd,
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        alert("Doctor updated");
        this.loadDoctors();
        this.selectedDoctor = null;
        this.removeEditPhoto();
      },
      error: () => alert("Error updating doctor")
    });
  }

  // ── clear image state when switching doctor ──

  selectDoctor(doc: any) {
    this.selectedDoctor = { ...doc };
    this.removeEditPhoto();
    this.loadSlots(doc.id);
  }

  // ── rest unchanged ────────────────────────

  loadDoctors() {
    this.http.get<any[]>("http://localhost:8080/doctors").subscribe({
      next: (res) => { this.doctors = res; this.filteredDoctors = [...res]; this.cdr.detectChanges(); },
      error: () => alert("Error loading doctors")
    });
  }

  filterDoctors() {
    const text = this.searchText.toLowerCase();
    this.filteredDoctors = this.doctors.filter((doc: any) =>
      doc.name.toLowerCase().includes(text) ||
      doc.specialization.toLowerCase().includes(text) ||
      doc.location.toLowerCase().includes(text)
    );
  }

  loadSlots(doctorId: number) {
    this.http.get<any[]>(`http://localhost:8080/slots/${doctorId}`).subscribe({
      next: (res) => {
        const map: { [time: string]: number } = {};
        res.forEach((s: any) => { map[s.time] = Number(s.available); });
        this.doctorSlots[doctorId] = map;
        this.cdr.detectChanges();
      },
      error: () => console.error(`Failed to load slots for doctor ${doctorId}`)
    });
  }

  isChecked(docId: number, time: string): boolean {
    const map = this.doctorSlots[docId];
    return map ? map[time] === 1 : false;
  }

  toggleSlot(docId: number, time: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const newAvailable = checkbox.checked ? 1 : 0;
    const key = `${docId}_${time}`;
    if (this.pendingToggles.has(key)) { checkbox.checked = !checkbox.checked; return; }
    if (!this.doctorSlots[docId]) this.doctorSlots[docId] = {};
    this.doctorSlots[docId][time] = newAvailable;
    this.cdr.detectChanges();
    this.pendingToggles.add(key);
    this.http.post<any>("http://localhost:8080/slots", 
      { doctor_id: docId, time, available: newAvailable }).subscribe({
      next: (res) => { this.doctorSlots[docId][time] = Number(res.available);
         this.pendingToggles.delete(key);
         this.cdr.detectChanges(); },
      error: () => {
        this.doctorSlots[docId][time] = newAvailable === 1 ? 0 : 1;
        checkbox.checked = !checkbox.checked;
        this.pendingToggles.delete(key);
        this.cdr.detectChanges();
        alert(`Failed to update slot ${time}. Please try again.`);
      }
    });
  }

  deleteDoctor(id: number) {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    this.http.delete(`http://localhost:8080/doctors/${id}`, { responseType: 'text' }).subscribe({
      next: (res) => {
        alert(res);
        delete this.doctorSlots[id];
        this.loadDoctors();
        if (this.selectedDoctor?.id === id) this.selectedDoctor = null;
        this.cdr.detectChanges();
      },
      error: () => alert("Error deleting doctor")
    });
  }

  trackById(index: number, item: any) { return item.id; }
}