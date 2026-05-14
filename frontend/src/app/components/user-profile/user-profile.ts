import { Component, inject, signal, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthUser } from '../../auth.service';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../toast/toast.component';
import { LoaderComponent } from '../loader/loader.component';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoaderComponent],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfile implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);

  user: Signal<AuthUser | null> = this.auth.currentUser;
  isEditing = signal(false);
  isUploading = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);

  // Edit form
  editEmail = '';

  // Password modal
  showPasswordModal = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordSaving = signal(false);
  passwordError = signal('');
  showCurrentPw = signal(false);
  showNewPw = signal(false);

  // Stats signal
  stats = signal({ tasksCreated: 0, tasksCompleted: 0, efficiency: '0%' });

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.api.getStats().subscribe({
      next: (res: any) => {
        if (res?.stats) {
          const total = res.stats.total ?? res.stats.totalTasks ?? 0;
          const done = res.stats.done || 0;
          this.stats.set({
            tasksCreated: total,
            tasksCompleted: done,
            efficiency: total > 0 ? Math.round((done / total) * 100) + '%' : '0%'
          });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getInitials(name: string | undefined): string {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  }

  getAvatarUrl(url: string | undefined): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) this.uploadAvatar(file);
  }

  uploadAvatar(file: File) {
    this.isUploading.set(true);
    this.api.updateAvatar(file).subscribe({
      next: (res: any) => {
        const currentUser = this.user();
        if (currentUser) {
          this.auth.updateCurrentUser({ ...currentUser, avatarUrl: res.avatarUrl });
        }
        this.isUploading.set(false);
        this.toast.show('Photo de profil mise à jour !', 'success');
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.show('Erreur lors de l\'envoi de l\'image', 'error');
      }
    });
  }

  toggleEdit() {
    if (!this.isEditing()) {
      // Pre-fill form with current values
      const u = this.user();
      this.editEmail = u?.email || '';
    }
    this.isEditing.update(v => !v);
  }

  saveProfile() {
    if (!this.editEmail || !this.editEmail.includes('@')) {
      this.toast.show('Veuillez saisir un email valide', 'error');
      return;
    }
    this.isSaving.set(true);
    this.api.updateProfile({ email: this.editEmail }).subscribe({
      next: (res: any) => {
        const currentUser = this.user();
        if (currentUser && res.data) {
          this.auth.updateCurrentUser({ ...currentUser, email: res.data.email });
        }
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.toast.show('Profil mis à jour avec succès !', 'success');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        const msg = err?.error?.error || 'Erreur lors de la mise à jour';
        this.toast.show(msg, 'error');
      }
    });
  }

  // ─── PASSWORD MODAL ──────────────────────────────────────────────────────────

  openPasswordModal() {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
    this.passwordError.set('');
    this.passwordSaving.set(false);
  }

  toggleCurrentPwVisibility() { this.showCurrentPw.update(v => !v); }
  toggleNewPwVisibility() { this.showNewPw.update(v => !v); }

  get passwordStrength(): { label: string; level: number; color: string } {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { label: 'Très faible', level: 1, color: '#f43f5e' };
    if (score === 2) return { label: 'Faible', level: 2, color: '#f97316' };
    if (score === 3) return { label: 'Moyen', level: 3, color: '#f59e0b' };
    if (score === 4) return { label: 'Fort', level: 4, color: '#22c55e' };
    return { label: 'Très fort', level: 5, color: '#10b981' };
  }

  submitChangePassword() {
    this.passwordError.set('');

    if (!this.currentPassword) {
      this.passwordError.set('Veuillez saisir votre mot de passe actuel');
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(this.newPassword)) {
      this.passwordError.set('Le nouveau mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[0-9]/.test(this.newPassword)) {
      this.passwordError.set('Le nouveau mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas');
      return;
    }
    if (this.currentPassword === this.newPassword) {
      this.passwordError.set('Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }

    this.passwordSaving.set(true);
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.closePasswordModal();
        this.toast.show('Mot de passe modifié avec succès !', 'success');
      },
      error: (err: any) => {
        this.passwordSaving.set(false);
        const msg = err?.error?.error || 'Erreur lors du changement de mot de passe';
        this.passwordError.set(msg);
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
