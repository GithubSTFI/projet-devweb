import { Component, inject, signal, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, AuthUser } from '../../auth.service';
import { ApiService } from '../../api.service';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../toast/toast.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss']
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

  // Stats signal pour l'UI
  stats = signal({
    tasksCreated: 0,
    tasksCompleted: 0,
    efficiency: '0%'
  });

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.api.getStats().subscribe({
      next: (res: any) => {
        if (res && res.stats) {
          const total = res.stats.total || 0;
          const done = res.stats.done || 0;
          this.stats.set({
            tasksCreated: total,
            tasksCompleted: done,
            efficiency: total > 0 ? Math.round((done / total) * 100) + '%' : '0%'
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.isLoading.set(false);
      }
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
    if (file) {
      this.uploadAvatar(file);
    }
  }

  uploadAvatar(file: File) {
    this.isUploading.set(true);
    this.api.updateAvatar(file).subscribe({
      next: (res: any) => {
        // Update local user state
        const currentUser = this.user();
        if (currentUser) {
          const updatedUser = { ...currentUser, avatarUrl: res.avatarUrl };
          this.auth.updateCurrentUser(updatedUser);
        }
        this.isUploading.set(false);
        this.toast.show('Photo de profil mise à jour !', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isUploading.set(false);
        this.toast.show('Erreur lors de l\'envoi de l\'image', 'error');
      }
    });
  }

  toggleEdit() {
    this.isEditing.update(v => !v);
  }

  saveProfile() {
    this.isEditing.set(false);
    this.toast.show('Profil mis à jour', 'success');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
