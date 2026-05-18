import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  imports: [RouterModule]
})
export class NavbarComponent {

  constructor(private router: Router) {}

  logout() {
  localStorage.removeItem("user");

  this.router.navigate(['/login']);
}
}