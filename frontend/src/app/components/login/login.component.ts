import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    auth = inject(AuthService);
    @Output() switchMode = new EventEmitter<void>();

    username = '';
    password = '';
    error = '';

    login() {
        if (!this.username || !this.password) return;
        this.auth.login({ username: this.username, password: this.password }).subscribe({
            next: () => { /* OK */ },
            error: (err) => {
                this.error = err.error?.error || 'Identifiants incorrects';
            }
        });
    }
}
