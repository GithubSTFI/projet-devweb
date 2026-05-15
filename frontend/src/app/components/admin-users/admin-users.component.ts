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
        .admin-container { padding: 32px; animation: fadeIn 0.4s ease; max-width: 1200px; margin: 0 auto; }
        .header-section { margin-bottom: 32px; h1 { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; } p { color: var(--text-muted); font-size: 1rem; } }
        .table-card { background: var(--bg-card-solid); border: 1px solid var(--border-light); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-lg); }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 18px 24px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1.5px; border-bottom: 2px solid var(--border-light); background: rgba(0,0,0,0.01); }
        .admin-table td { padding: 18px 24px; color: var(--text-secondary); border-bottom: 1px solid var(--border-light); font-size: 0.95rem; }
        .admin-table tr:hover:not(thead tr) { background: var(--bg-hover); }
        .user-info { display: flex; flex-direction: column; .username { font-weight: 700; color: var(--text-primary); } .email { font-size: 0.8rem; color: var(--text-muted); } }
        .role-select { background: var(--bg-hover); border: 1px solid var(--border-light); color: var(--text-primary); padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; outline: none; cursor: pointer; transition: all 0.2s; &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); } &.admin { color: #6366f1; background: rgba(99, 102, 241, 0.05); border-color: rgba(99, 102, 241, 0.2); } }
        .btn-delete { background: none; border: none; color: var(--text-muted); cursor: pointer; transition: all 0.2s; .material-icons { font-size: 20px; } &:hover:not(:disabled) { color: #f43f5e; transform: scale(1.1); } &:disabled { opacity: 0.2; cursor: not-allowed; } }
        .empty-state { padding: 80px; text-align: center; color: var(--text-muted); .material-icons { font-size: 64px; margin-bottom: 16px; opacity: 0.5; } p { font-weight: 600; font-size: 1.1rem; } }
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
