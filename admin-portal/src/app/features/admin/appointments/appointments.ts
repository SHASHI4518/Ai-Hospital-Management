import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { ChangeDetectorRef } from '@angular/core';
@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './appointments.html'
})
export class AppointmentsComponent implements OnInit {

  appointments: any[] = [];
  appointmentsCache: any[] = [];
loading = false;
  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadAppointments();
  }
  

  loadAppointments() {

 

  this.loading = true;

  this.http.get("http://localhost:8080/admin/appointments")
    .subscribe({
      next: (res: any) => {
        console.log("DATA FROM API:", res);

        this.appointments = res;
        this.appointmentsCache = res; //  store cache

        this.loading = false;
        this.cdRef.detectChanges(); //  make sure name matches constructor
      },
      error: (err) => {
        console.error("Error fetching appointments:", err);
        this.loading = false;
      }
    });
}

  cancel(id: number) {
     this.appointments = this.appointments.filter(a => a.id !== id);
    this.http.delete(`http://localhost:8080/appointments/${id}`, { responseType: 'text' })
      .subscribe(res => {
        alert(res);
        this.cdRef.detectChanges();
        this.loadAppointments();
      });
  }
}