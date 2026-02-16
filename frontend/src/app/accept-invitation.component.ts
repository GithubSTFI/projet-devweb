import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from './project.service';
import { ToastService } from './components/toast/toast.component';

@Component({
    selector: 'app-accept-invitation',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="accept-container">
      <div class="card" *ngIf="status() === 'loading'">
        <div class="spinner"></div>
        <p>Traitement de votre invitation...</p>
      </div>

      <div class="card success" *ngIf="status() === 'success'">
        <span class="material-icons">check_circle</span>
        <h2>Félicitations !</h2>
        <p>Vous avez rejoint le projet avec succès.</p>
        <button routerLink="/dashboard/projects" class="btn-primary">Aller à mes projets</button>
      </div>

      <div class="card error" *ngIf="status() === 'error'">
        <span class="material-icons">error_outline</span>
        <h2>Oups !</h2>
        <p>{{ errorMessage() }}</p>
        <button routerLink="/dashboard" class="btn-secondary">Retour au tableau de bord</button>
      </div>
    </div>
  `,
    styles: [`
    .accept-container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: white; }
    .card { background: #1e293b; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .success .material-icons { font-size: 64px; color: #10b981; margin-bottom: 20px; }
    .error .material-icons { font-size: 64px; color: #f43f5e; margin-bottom: 20px; }
    h2 { margin-bottom: 12px; }
    p { color: #94a3b8; margin-bottom: 32px; }
    .btn-primary { background: #6366f1; color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 600; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AcceptInvitationComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private projectService = inject(ProjectService);
    private router = inject(Router);
    private toast = inject(ToastService);

    status = signal<'loading' | 'success' | 'error'>('loading');
    errorMessage = signal('');

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const token = params['token'];
            if (token) {
                this.projectService.acceptInvitation(token).subscribe({
                    next: () => this.status.set('success'),
                    error: (err: any) => {
                        this.status.set('error');
                        this.errorMessage.set(err.error?.error || 'L\'invitation est invalide ou a expiré.');
                    }
                });
            } else {
                this.status.set('error');
                this.errorMessage.set('Jeton d\'invitation manquant.');
            }
        });
    }
}
