import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthUser {
    id?: number;
    username: string;
    role: 'USER' | 'ADMIN';
    email?: string;
    avatarUrl?: string; // Ajout photo de profil
    createdAt?: string;
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
    currentUser = signal<AuthUser | null>(this.loadUser());
    isLoggedIn = signal<boolean>(!!localStorage.getItem('auth_token'));

    private loadUser(): AuthUser | null {
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
                const user: AuthUser = {
                    id: res.id,
                    username: res.username,
                    role: res.role || 'USER',
                    email: res.email,
                    avatarUrl: res.avatarUrl,
                    createdAt: res.createdAt
                };
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

    updateCurrentUser(user: AuthUser) {
        this.currentUser.set(user);
        this.saveUser(user);
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(token: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, { token, password });
    }

    private saveUser(user: AuthUser) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    private saveSession(token: string, user: AuthUser) {
        localStorage.setItem(this.tokenKey, token);
        this.saveUser(user);
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
    }
}
