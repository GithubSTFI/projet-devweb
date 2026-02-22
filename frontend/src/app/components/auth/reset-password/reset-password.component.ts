import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    private auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    token = '';
    password = '';
    confirmPassword = '';
    showPassword = false;
    loading = signal(false);
    message = signal('');
    error = signal('');

    ngOnInit() {
        this.token = this.route.snapshot.params['token'];
        if (!this.token) {
            this.router.navigate(['/auth']);
        }
    }

    submit() {
        if (this.password !== this.confirmPassword) {
            this.error.set('Les mots de passe ne correspondent pas.');
            return;
        }

        this.loading.set(true);
        this.error.set('');
        this.message.set('');

        this.auth.resetPassword(this.token, this.password).subscribe({
            next: (res: any) => {
                this.message.set('Mot de passe changé ! Redirection...');
                setTimeout(() => this.router.navigate(['/auth']), 2000);
            },
            error: (err) => {
                this.error.set(err.error?.error || 'Lien invalide ou expiré.');
                this.loading.set(false);
            }
        });
    }
}
