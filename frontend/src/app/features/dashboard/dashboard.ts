import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {

  selectedDoctorId: number | null = null;

  doctors: any[] = [];
  appointments: any[] = [];

  selectedDate = '';
  selectedTime = '';
  today: string = new Date().toISOString().split('T')[0]; 

  slots: string[] = [
    "09:00","10:00","11:00","12:00",
    "13:00","14:00","15:00","16:00",
    "17:00","18:00","19:00","20:00","21:00"
  ];

 
  doctorSlots: { [doctorId: number]: { [time: string]: number } } = {};

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

  // LOAD DOCTORS
  loadDoctors() {
    this.doctorService.getDoctors().subscribe((res: any) => {
      this.doctors = res;
     
    });
  }

  loadSlots(doctorId: number) {
    this.http.get<any[]>(`http://localhost:8080/slots/${doctorId}`)
      .subscribe({
        next: (res) => {
          const map: { [time: string]: number } = {};
          res.forEach((s: any) => {
            map[s.time] = Number(s.available);
          });
          this.doctorSlots[doctorId] = map;
          this.cd.detectChanges();
        },
        error: () => {
          console.error(`Failed to load slots for doctor ${doctorId}`);
        }
      });
  }


  onDoctorChange() {
    this.selectedTime = '';
    this.selectedDate = '';
    if (this.selectedDoctorId) {
      this.loadSlots(this.selectedDoctorId);
    }
  }

  
  isSlotDisabled(docId: number, time: string): boolean {
    const map = this.doctorSlots[docId];

    if (!map) return true;

    if (map[time] === undefined) return true;

    return map[time] === 0;
  }

  // LOAD APPOINTMENTS
  loadAppointments() {
    const mobile = localStorage.getItem("user");
    if (!mobile) return;

    this.http.get<any[]>(`http://localhost:8080/appointments/${mobile}`)
      .subscribe({
        next: (res) => {
          this.appointments = res;
          this.cd.detectChanges();
        },
        error: () => {
          console.error("Failed to load appointments");
        }
      });
  }

  // BOOK
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

    this.http.post("http://localhost:8080/book", data, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          alert(res);
          this.loadAppointments();
          this.loadSlots(doctorId); 
          this.selectedDate = '';
          this.selectedTime = '';
        },
        error: () => {
          alert("Error booking appointment");
        }
      });
  }

  // CANCEL
  cancel(id: number) {
    this.http.delete(`http://localhost:8080/appointments/${id}`, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          alert(res);
          this.loadAppointments();
        },
        error: () => {
          alert("Error cancelling appointment");
        }
      });
  }

  // HELPERS
  getDoctorName(id: number) {
    const doc = this.doctors.find(d => d.id === id);
    return doc ? doc.name : 'Unknown';
  }

  logout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  trackById(index: number, item: any) {
    return item.id;
  }
}