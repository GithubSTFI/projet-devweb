import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    auth = inject(AuthService);
    @Output() switchMode = new EventEmitter<void>();

    username = '';
    email = '';
    password = '';
    error = '';

    get hasMinLength() { return this.password.length >= 8; }
    get hasUppercase() { return /[A-Z]/.test(this.password); }
    get hasNumber() { return /[0-9]/.test(this.password); }
    get isPasswordValid() { return this.hasMinLength && this.hasUppercase && this.hasNumber; }

    register() {
        if (!this.username || !this.email || !this.password) {
            this.error = "Veuillez remplir tous les champs";
            return;
        }

        this.auth.register({ 
            username: this.username, 
            email: this.email, 
            password: this.password 
        }).subscribe({
            next: () => {
                alert('✅ Compte créé avec succès ! Connectez-vous.');
                this.switchMode.emit();
            },
            error: (err) => {
                console.error('Registration Error Full:', err);
                if (err.status === 0) {
                    this.error = "Impossible de contacter le serveur (Backend HS ?)";
                } else {
                    // Extract detail if validation failed
                    const details = err.error?.details;
                    if (details && details.length > 0) {
                        this.error = details[0].msg;
                    } else {
                        this.error = err.error?.error || 'Erreur lors de l\'inscription. Essayez un autre nom.';
                    }
                }
            }
        });
    }
}
