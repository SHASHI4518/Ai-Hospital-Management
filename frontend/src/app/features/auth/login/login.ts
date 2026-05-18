import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule,],
  templateUrl: './login.html'
})
export class LoginComponent {

  mobile = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}
login() {
  const data = {
    mobile: this.mobile,
    password: this.password
  };

  this.http.post("http://localhost:8080/login", data, { responseType: 'text' })
    .subscribe({
      next: (res: string) => {

        if (res.includes("Login")) {

          localStorage.setItem("user", this.mobile);

          alert("Login Success");

          this.router.navigate(['/dashboard']);
        } else {
          alert("Invalid credentials");
        }
      }
    });
}
}