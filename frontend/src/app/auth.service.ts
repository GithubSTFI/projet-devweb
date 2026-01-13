import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    id?: number;
    username: string;
    role: 'USER' | 'ADMIN';
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = 'http://localhost:3000/api/auth';
    private tokenKey = 'auth_token';
    private userKey = 'auth_user';

    // Signals to track state
    currentUser = signal<User | null>(this.loadUser());
    isLoggedIn = signal<boolean>(!!localStorage.getItem(this.tokenKey));

    private loadUser(): User | null {
        const userStr = localStorage.getItem(this.userKey);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    register(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, credentials);
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {
                const user: User = { username: res.username, role: res.role || 'USER' };
                this.saveSession(res.token, user);
                this.router.navigate(['/dashboard']);
            })
        );
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUser.set(null);
        this.isLoggedIn.set(false);
        this.router.navigate(['/auth']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    private saveSession(token: string, user: User) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
    }
}
