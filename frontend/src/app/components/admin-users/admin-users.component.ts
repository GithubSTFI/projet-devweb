import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../api.service';
import { ToastService } from '../toast/toast.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LoaderComponent } from '../loader/loader.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, ConfirmDialogComponent, LoaderComponent, FormsModule],
    template: `
        <div class="admin-container">
            <div class="header-section">
                <h1>Gestion des Utilisateurs</h1>
                <p>Consultez et gérez les comptes utilisateurs du système.</p>
            </div>

            <div class="table-card">
                <app-loader *ngIf="isLoading()" message="Chargement des utilisateurs..."></app-loader>

                <table class="admin-table" *ngIf="!isLoading()">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Utilisateur</th>
                            <th>Rôle</th>
                            <th>Date d'inscription</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let u of users()">
                            <td>#{{ u.id }}</td>
                            <td>
                                <div class="user-info">
                                    <span class="username">{{ u.username }}</span>
                                    <span class="email">{{ u.email || 'Email non fourni' }}</span>
                                </div>
                            </td>
                            <td>
                                <select [ngModel]="u.role" (ngModelChange)="updateRole(u, $event)" 
                                    [disabled]="u.id === currentUser()?.id" class="role-select" [class]="u.role.toLowerCase()">
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </td>
                            <td>{{ u.createdAt | date:'medium' }}</td>
                            <td>
                                <button class="btn-delete" [disabled]="u.id === currentUser()?.id" (click)="requestDelete(u.id)">
                                    <span class="material-icons">delete</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div *ngIf="users().length === 0 && !isLoading()" class="empty-state">
                    <span class="material-icons">people_outline</span>
                    <p>Aucun utilisateur trouvé.</p>
                </div>
            </div>
        </div>

        <app-confirm-dialog *ngIf="showConfirm"
            title="Supprimer l'utilisateur ?"
            message="Attention: Cette action supprimera également toutes les tâches et fichiers associés à cet utilisateur. Continuer ?"
            (confirm)="deleteUser()"
            (cancel)="showConfirm = false">
        </app-confirm-dialog>
    `,
    styles: [`
        .admin-container { padding: 24px; animation: fadeIn 0.4s ease; }
        .header-section { margin-bottom: 24px; h1 { font-size: 1.5rem; color: white; margin-bottom: 4px; } p { color: rgba(255,255,255,0.4); font-size: 0.9rem; } }
        .table-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 16px; font-size: 0.75rem; text-transform: uppercase; color: rgba(255,255,255,0.3); letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .admin-table td { padding: 16px; color: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 0.9rem; }
        .user-info { display: flex; flex-direction: column; .username { font-weight: 600; color: white; } .email { font-size: 0.75rem; color: rgba(255,255,255,0.3); } }
        .role-select { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; outline: none; cursor: pointer; &.admin { color: #818cf8; border-color: rgba(99, 102, 241, 0.3); } &.user { color: rgba(255,255,255,0.5); } }
        .btn-delete { background: none; border: none; color: rgba(239, 68, 68, 0.5); cursor: pointer; transition: color 0.2s; &:hover:not(:disabled) { color: #ef4444; } &:disabled { opacity: 0.2; cursor: not-allowed; } }
        .empty-state { padding: 60px; text-align: center; color: rgba(255,255,255,0.2); .material-icons { font-size: 48px; margin-bottom: 12px; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class AdminUsersComponent implements OnInit {
    private api = inject(ApiService);
    private toast = inject(ToastService);

    users = signal<any[]>([]);
    currentUser = signal<any>(null);
    isLoading = signal(false);
    showConfirm = false;
    userToDelete: number | null = null;

    ngOnInit() {
        this.loadUsers();
        // Simple profile load to get self ID
        this.api.getProfile().subscribe((res: any) => this.currentUser.set(res.data));
    }

    loadUsers() {
        this.isLoading.set(true);
        this.api.getUsers().subscribe({
            next: (res: any) => {
                this.users.set(res.data);
                this.isLoading.set(false);
            },
            error: () => {
                this.toast.show('Erreur de chargement des utilisateurs', 'error');
                this.isLoading.set(false);
            }
        });
    }

    requestDelete(id: number) {
        this.userToDelete = id;
        this.showConfirm = true;
    }

    deleteUser() {
        if (!this.userToDelete) return;
        this.api.deleteUser(this.userToDelete).subscribe({
            next: () => {
                this.toast.show('Utilisateur supprimé avec succès', 'success');
                this.loadUsers();
                this.showConfirm = false;
            },
            error: (err) => this.toast.show(err.error?.message || 'Erreur lors de la suppression', 'error')
        });
    }

    updateRole(user: any, newRole: string) {
        if (user.role === newRole) return;
        this.api.updateUser(user.id, { role: newRole }).subscribe({
            next: () => {
                this.toast.show(`Rôle de ${user.username} mis à jour en ${newRole}`, 'success');
                this.loadUsers();
            },
            error: (err) => {
                this.toast.show(err.error?.message || 'Erreur de mise à jour', 'error');
                this.loadUsers(); // Refresh to revert UI
            }
        });
    }
}
