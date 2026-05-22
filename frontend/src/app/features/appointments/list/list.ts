import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

const API = 'http://localhost:8080';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class AppointmentListComponent implements OnInit {

  appointments: any[] = [];
  doctors: any[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAppointments();
    this.loadDoctors();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.loadAppointments();
    });
  }

  loadAppointments() {
    this.loading = true;
    const mobile = localStorage.getItem('user');
    this.http.get<any[]>(`${API}/appointments/${mobile}`).subscribe({
      next: (res) => {
        this.appointments = [...res];
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  loadDoctors() {
    this.http.get<any[]>(`${API}/doctors`).subscribe({
      next: (res) => {
        this.doctors = [...res];
        this.cd.detectChanges();
      }
    });
  }

  getDoctor(id: number) {
    return this.doctors.find(d => d.id === id);
  }

  getDoctorName(id: number) {
    const doc = this.doctors.find(d => d.id === id);
    return doc ? doc.name : 'Unknown';
  }

  /** Returns count of appointments matching a given status */
  getStatusCount(status: string): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  /** Cancel = PUT → status: 'cancelled' (does NOT delete the record) */
  cancel(id: number) {
    this.http.put<any>(`${API}/appointments/${id}/cancel`, {}).subscribe({
      next: () => {
        this.appointments = this.appointments.map(a =>
          a.id === id ? { ...a, status: 'cancelled' } : a
        );
        this.appointments = [...this.appointments];
        this.cd.detectChanges();
      },
      error: () => alert('Error cancelling appointment')
    });
  }

  /** Hard delete — removes record permanently */
  deleteHistory(id: number) {
    if (!confirm('Delete this appointment permanently?')) return;
    this.http.delete(`${API}/appointments/${id}`, { responseType: 'text' }).subscribe({
      next: () => {
        this.appointments = this.appointments.filter(a => a.id !== id);
        this.cd.detectChanges();
      }
    });
  }

  trackById(_: number, item: any) { return item.id; }
}