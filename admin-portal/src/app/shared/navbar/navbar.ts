import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html'
})
export class NavbarComponent {

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem("admin");
    this.router.navigate(['/']);
  }
}