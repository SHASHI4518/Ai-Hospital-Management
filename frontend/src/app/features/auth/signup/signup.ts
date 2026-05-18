import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './signup.html'
})
export class SignupComponent {

  name = '';
  mobile = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}
goLogin() {
  this.router.navigate(['/login']);
}
  signup() {
    const data = {
      name: this.name,
      mobile: this.mobile,
      password: this.password
    };
      

    this.authService.signup(data).subscribe({
      next: (res: any) => {
        alert(res);
      },
      error: () => {
        alert("Signup failed");
      }
    });
  }
}