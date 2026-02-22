import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
    private auth = inject(AuthService);
    email = '';
    loading = signal(false);
    message = signal('');
    error = signal('');

    submit() {
        this.loading.set(true);
        this.error.set('');
        this.message.set('');

        this.auth.forgotPassword(this.email).subscribe({
            next: (res: any) => {
                this.message.set('Un email a été envoyé avec les instructions.');
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.error || 'Erreur lors de la demande.');
                this.loading.set(false);
            }
        });
    }
}
