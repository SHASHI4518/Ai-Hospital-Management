import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent {

  mobile = '';
  password = '';

  constructor(private http: HttpClient, private router: Router) {}

 login() {

  const data = {
    mobile: this.mobile,
    password: this.password
  };

  this.http.post("http://localhost:8080/admin/login", data)
    .subscribe((res: any) => {

      localStorage.setItem("admin", JSON.stringify(res.admin));

      this.router.navigate(['/admin']);

    }, () => {
      alert("Invalid admin login");
    });
}}