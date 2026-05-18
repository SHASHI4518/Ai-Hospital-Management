import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  signup() {

    //  Basic validation
    if (!this.name || !this.mobile || !this.password) {
      alert("Please fill all fields");
      return;
    }

    const data = {
      name: this.name,
      mobile: this.mobile,
      password: this.password
    };

    console.log("Signup Data:", data); // Debug

    this.http.post("http://localhost:8080/admin/signup", data)
      .subscribe({
        next: (res: any) => {

          alert(res.message || "Admin registered successfully");

          //  Clear form
          this.name = '';
          this.mobile = '';
          this.password = '';

          //  Redirect to login
          this.router.navigate(['/']);

        },
        error: (err) => {

          console.log("Signup error:", err);
          alert("Error registering admin");

        }
      });
  }
}