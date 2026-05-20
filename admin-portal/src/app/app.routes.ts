import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { DashboardComponent } from './features/admin/dashboard/dashboard';
import { SignupComponent } from './features/auth/signup/signup';
import { AppointmentsComponent } from './features/admin/appointments/appointments';
import { DoctorsComponent } from './features/admin/doctors/doctors';
import { EditDoctorComponent } from './features/admin/edit-doctor/edit-doctor';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'admin', component: DashboardComponent },
  { path: 'appointments', component: AppointmentsComponent },
  { path: 'admin/doctors', component: DoctorsComponent },
  { path: 'admin/edit-doctor', redirectTo: 'admin/doctors', pathMatch: 'full' }
];
