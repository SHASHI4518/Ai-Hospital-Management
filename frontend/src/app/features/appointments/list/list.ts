import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.html'
})
export class AppointmentListComponent implements OnInit {

  appointments: any[] = [];
  doctors: any[] = [];
  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {

    // Load immediately
    this.loadAppointments();
    this.loadDoctors();

    // Reload when navigating back
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadAppointments();
      }
    });
  }

  // Load appointments
  loadAppointments() {
    this.loading = true;

    const mobile = localStorage.getItem("user");

    this.http.get(`http://localhost:8080/appointments/${mobile}`)
      .subscribe((res: any) => {
        this.appointments = [...res];
        this.loading = false;
        this.cd.detectChanges();
      });
  }

  // Load doctors
  loadDoctors() {
    this.http.get("http://localhost:8080/doctors")
      .subscribe((res: any) => {
        this.doctors = [...res];
        this.cd.detectChanges();
      });
  }
  // helper function
  getDoctor(id: number) {
  return this.doctors.find(d => d.id === id);
}

  // Cancel appointment
cancel(id: number) {
  this.http.put(`http://localhost:8080/appointments/${id}`, {})
    .subscribe((res: any) => {

      //  Update UI instantly
      this.appointments = this.appointments.map(a =>
        a.id === id ? { ...a, status: res.status } : a
      );

      this.appointments = [...this.appointments]; // force update
      this.cd.detectChanges();
    });
}

  // Delete history 
  deleteHistory(id: number) {

    if (!confirm("Delete this appointment permanently?")) return;

    this.http.delete(`http://localhost:8080/appointments/${id}`, { responseType: 'text' })
      .subscribe(() => {

        // Remove from UI instantly
        this.appointments = this.appointments.filter(a => a.id !== id);

        this.cd.detectChanges();
      });
  }

  // Get doctor name
  getDoctorName(id: number) {
    const doc = this.doctors.find(d => d.id === id);
    return doc ? doc.name : 'Unknown';
  }

  // TrackBy
  trackById(index: number, item: any) {
    return item.id;
  }

}