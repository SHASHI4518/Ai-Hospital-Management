import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.css']
})
export class AppointmentsComponent implements OnInit {

  appointments: any[] = [];
  filteredAppointments: any[] = [];
  loading = false;
  filterStatus = 'all';
  searchText = '';

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

  ngOnInit() { this.loadAppointments(); }

  loadAppointments() {
    this.loading = true;
    this.http.get<any[]>('http://localhost:8080/admin/appointments').subscribe({
      next: (res) => {
        this.appointments = res;
        this.applyFilter();
        this.loading = false;
        this.cdRef.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    let list = [...this.appointments];
    if (this.filterStatus !== 'all') {
      list = list.filter(a => a.status === this.filterStatus);
    }
    if (this.searchText.trim()) {
      const t = this.searchText.toLowerCase();
      list = list.filter(a =>
        a.patient_name?.toLowerCase().includes(t) ||
        a.doctor_name?.toLowerCase().includes(t)
      );
    }
    this.filteredAppointments = list;
  }

  onFilterChange() { this.applyFilter(); }
  onSearch()       { this.applyFilter(); }

  // Change 6: Cancel = PUT to update status, NOT delete
  cancel(id: number) {
    if (!confirm('Cancel this appointment?')) return;

    // Optimistically update UI
    const appt = this.appointments.find(a => a.id === id);
    if (appt) appt.status = 'cancelled';
    this.applyFilter();
    this.cdRef.detectChanges();

    this.http.put(`http://localhost:8080/appointments/${id}/cancel`, {}, { responseType: 'json' })
      .subscribe({
        next: () => {
          // Already updated optimistically, just reload for consistency
          this.loadAppointments();
        },
        error: () => {
          // Revert on error
          if (appt) appt.status = 'booked';
          this.applyFilter();
          this.cdRef.detectChanges();
          alert('Error cancelling appointment. Please try again.');
        }
      });
  }

  // Hard delete (separate action, if needed)
  hardDelete(id: number) {
    if (!confirm('Permanently delete this appointment? This cannot be undone.')) return;
    this.http.delete(`http://localhost:8080/appointments/${id}`, { responseType: 'text' }).subscribe({
      next: () => {
        this.appointments = this.appointments.filter(a => a.id !== id);
        this.applyFilter();
        this.cdRef.detectChanges();
      },
      error: () => alert('Error deleting appointment.')
    });
  }
}
