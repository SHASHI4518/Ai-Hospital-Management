import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {

  name = '';
  specialization = '';
  experience = '';
  location = '';
  clinic = '';
  fee = '';
  image = '';
  available = true;

  doctors: any[] = [];

  //  Initialize stats properly
  stats = {
    doctors: 0,
    appointments: 0,
    today: 0
  };

  // EDIT VARIABLES
  editMode = false;
  editId: number | null = null;

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDoctors();
    this.loadStats(); 
  }

  // ANIMATION FUNCTION
  animateValue(key: string, target: number) {
    let current = 0;

    const interval = setInterval(() => {
      current++;


      if (current >= target) {
        clearInterval(interval);
      }
    }, 30);
  }

  //  UPDATED STATS LOADER
  loadStats() {
    this.http.get("http://localhost:8080/stats")
      .subscribe((res: any) => {

        console.log("STATS:", res);

      this.stats = res;

      this.cd.detectChanges();
        this.animateValue('doctors', res.doctors);
        this.animateValue('appointments', res.appointments);
        this.animateValue('today', res.today);
      });
  }

  // LOAD DOCTORS
  loadDoctors() {
    this.http.get("http://localhost:8080/doctors")
      .subscribe((res: any) => {
        this.doctors = [...res];
        this.cd.detectChanges();
      });
  }

  // ADD / UPDATE
  addDoctor() {

    const data = {
      name: this.name,
      specialization: this.specialization,
      experience: this.experience,
      location: this.location,
      clinic: this.clinic,
      fee: this.fee,
      image: this.image,
      available: this.available
    };

    console.log(data);
    console.log("EDIT ID:", this.editId);

    // UPDATE MODE
    if (this.editMode && this.editId !== null) {

      this.http.put(`http://localhost:8080/doctors/${this.editId}`, data, { responseType: 'text' })
        .subscribe(res => {

          alert("Doctor updated");

          this.resetForm();
          this.loadDoctors();

          const modalElement = document.getElementById('editModal');
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          modal?.hide();
        });

    } else {

      // ADD MODE
      this.http.post("http://localhost:8080/doctors", data, { responseType: 'text' })
        .subscribe(res => {

          alert(res);

          this.resetForm();
          this.loadDoctors();
        });
    }
  }

  // EDIT (FILL FORM)
  editDoctor(doc: any) {
    this.editMode = true;
    this.editId = doc.id;

    this.name = doc.name;
    this.specialization = doc.specialization;
    this.experience = doc.experience;
    this.location = doc.location;
    this.clinic = doc.clinic;
    this.fee = doc.fee;
    this.image = doc.image;
    this.available = doc.available;
  }

  // OPEN MODAL
  openEditModal(doc: any) {
    this.editDoctor(doc);

    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('editModal')
    );

    modal.show();
  }

  // RESET FORM
  resetForm() {
    this.name = '';
    this.specialization = '';
    this.experience = '';
    this.location = '';
    this.clinic = '';
    this.fee = '';
    this.image = '';
    this.available = true;

    this.editMode = false;
    this.editId = null;
  }

  // DELETE
  deleteDoctor(id: number) {
    this.http.delete(`http://localhost:8080/doctors/${id}`, { responseType: 'text' })
      .subscribe(res => {
        alert(res);
        this.doctors = this.doctors.filter(d => d.id !== id);
        this.cd.detectChanges();
        this.loadDoctors();
      });
  }

  // OPTIONAL UPDATE METHOD
  updateDoctor() {
    const data = {
      name: this.name,
      specialization: this.specialization,
      experience: this.experience,
      location: this.location,
      clinic: this.clinic,
      fee: this.fee,
      image: this.image,
      available: this.available
    };

    this.http.put(`http://localhost:8080/doctors/${this.editId}`, data, { responseType: 'text' })
      .subscribe(res => {
        alert("Doctor updated");
        this.loadDoctors();
      });
  }

  // TRACK BY
  trackById(index: number, item: any) {
    return item.id;
  }
}