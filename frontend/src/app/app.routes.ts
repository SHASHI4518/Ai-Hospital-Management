import { Routes } from '@angular/router';
import { SignupComponent } from './features/auth/signup/signup';
import { LoginComponent } from './features/auth/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';
import { AppointmentListComponent } from './features/appointments/list/list';
export const routes: Routes = [

  { path: '', redirectTo: 'signup', pathMatch: 'full' },  

  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  
  { path: 'appointments', component: AppointmentListComponent },


];
