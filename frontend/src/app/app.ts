import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html'
})
export class AppComponent {

  constructor(private router: Router) {}

  showLayout() {
    const currentUrl = this.router.url;
    return currentUrl !== '/login' && currentUrl !== '/signup';
  }
}