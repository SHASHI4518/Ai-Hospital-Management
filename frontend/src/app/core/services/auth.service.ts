import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  signup(data: any) {
    return this.http.post("http://localhost:8080/signup", data, { responseType: 'text' });
  }

  login(data: any) {
    return this.http.post("http://localhost:8080/login", data, { responseType: 'text' });
  }
}