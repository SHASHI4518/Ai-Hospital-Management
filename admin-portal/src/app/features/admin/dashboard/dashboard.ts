import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { Router } from '@angular/router';
import{RouterModule} from '@angular/router';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, SidebarComponent, ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  // Change 4: date picker for appointments count
  selectedDate: string = '';

  stats = {
    doctors: 0,       
    appointments: 0,
    today: 0,         
    selectedDate: ''
  };

  recentAppointments: any[] = [];
  doctors: any[] = [];
  loading = false;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    // Default to today
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.loadStats();
    this.loadRecentAppointments();
  }

  // Change 4 & 5: load stats for selected date
  loadStats() {
    this.loading = true;
    this.http.get(`http://localhost:8080/stats?date=${this.selectedDate}`)
      .subscribe({
        next: (res: any) => {
          this.stats = res;
          this.loading = false;
          this.cd.detectChanges();
        },
        error: () => { this.loading = false; }
      });
  }

  onDateChange() {
    this.loadStats();
  }

  loadRecentAppointments() {
    this.http.get<any[]>('http://localhost:8080/admin/appointments').subscribe({
      next: (res) => {
        this.recentAppointments = res.slice(0, 5);
        this.cd.detectChanges();
      },
      error: () => {}
    });
  }

  trackById(index: number, item: any) { return item.id; }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
