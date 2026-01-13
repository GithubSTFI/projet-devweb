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
    password = '';
    error = '';

    register() {
        if (!this.username || !this.password) {
            this.error = "Veuillez remplir tous les champs";
            return;
        }

        this.auth.register({ username: this.username, password: this.password }).subscribe({
            next: () => {
                alert('✅ Compte créé avec succès ! Connectez-vous.');
                this.switchMode.emit();
            },
            error: (err) => {
                console.error('Registration Error Full:', err);
                if (err.status === 0) {
                    this.error = "Impossible de contacter le serveur (Backend HS ?)";
                } else {
                    this.error = err.error?.error || 'Erreur lors de l\'inscription. Essayez un autre nom.';
                }
            }
        });
    }
}
