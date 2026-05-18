import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, SidebarComponent, RouterModule],
  templateUrl: './doctors.html',
  styleUrls: ['./doctors.css'] 
})
export class DoctorsComponent implements OnInit {

  name = '';
  specialization = '';
  experience = '';
  location = '';
  clinic = '';
  fee = '';
  available = true;

  // ── image fields (replaces `image = ''`) ──
  imageFile: File | null = null;
  imagePreview: string | null = null;
  imageError = '';

  doctors: any[] = [];
  slots = ["09:00","10:00","11:00","12:00","14:00","15:00",
           "16:00","17:00","18:00","19:00","20:00","21:00",
           "22:00","23:00","24:00"];
  doctorSlots: any = {};
  stats: any = { doctors: 0, appointments: 0, today: 0 };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadDoctors();
    this.loadStats();
  }

  // ── file upload handlers ──────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.processFile(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    this.imageError = '';
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.imageError = 'Only JPG, PNG, or WEBP images are allowed.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'File must be under 5 MB.';
      return;
    }
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = e => this.imagePreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.imageFile = null;
    this.imagePreview = null;
    this.imageError = '';
  }

  // ── doctors ──────────────────────────────

  addDoctor() {
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
      .subscribe(res => {
        alert(res);
        this.resetForm();
        this.loadDoctors();
      });
  }

  resetForm() {
    this.name = '';
    this.specialization = '';
    this.experience = '';
    this.location = '';
    this.clinic = '';
    this.fee = '';
    this.available = true;
    this.imageFile = null;
    this.imagePreview = null;
    this.imageError = '';
  }

  // ── stats ────────────────────────────────

  animateValue(key: string, target: number) {
    let current = 0;
    const interval = setInterval(() => {
      current++;
      this.stats[key] = current;
      if (current >= target) clearInterval(interval);
    }, 30);
  }

  loadStats() {
    this.http.get('http://localhost:8080/stats')
      .subscribe((res: any) => {
        this.animateValue('doctors', res.doctors);
        this.animateValue('appointments', res.appointments);
        this.animateValue('today', res.today);
      });
  }

  loadDoctors() {
    this.http.get('http://localhost:8080/doctors')
      .subscribe((res: any) => {
        this.doctors = res.map((doc: any) => ({ ...doc, slots: [] }));
        this.doctors.forEach(doc => this.loadSlots(doc.id));
      });
  }

  deleteDoctor(id: number) {
    this.http.delete(`http://localhost:8080/doctors/${id}`, { responseType: 'text' })
      .subscribe(res => {
        alert(res);
        this.doctors = this.doctors.filter(d => d.id !== id);
      });
  }

  trackById(index: number, item: any) { return item.id; }

  // ── slots ────────────────────────────────

  loadSlots(doctorId: number) {
    this.http.get(`http://localhost:8080/slots/${doctorId}`)
      .subscribe((res: any) => {
        this.doctorSlots[doctorId] = res;
        this.cdr.detectChanges();
      });
  }

  addSlot(doctorId: number, time: string) {
    this.http.post('http://localhost:8080/slots', { doctor_id: doctorId, time })
      .subscribe(() => this.loadSlots(doctorId));
  }

  deleteSlot(id: number, doctorId: number) {
    this.http.delete(`http://localhost:8080/slots/${id}`)
      .subscribe(() => this.loadSlots(doctorId));
  }
}