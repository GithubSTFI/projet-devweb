import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Task } from '../../api.service';
import { ToastService } from '../toast/toast.component';
import { LoaderComponent } from '../loader/loader.component';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-admin-tasks',
    standalone: true,
    imports: [CommonModule, LoaderComponent, FormsModule, ConfirmDialogComponent],
    template: `
        <div class="admin-container">
            <div class="header-section">
                <div class="title-row">
                    <h1>Gestion Globale des Tâches</h1>
                    <span class="badge">{{ totalTasks() }} Tâches au total</span>
                </div>
                <p>Visualisez et gérez toutes les tâches créées sur la plateforme.</p>
            </div>

            <div class="filter-bar">
                <div class="search-box">
                    <span class="material-icons">search</span>
                    <input type="text" placeholder="Filtrer par titre ou description..." [(ngModel)]="searchQuery" (input)="loadTasks()">
                </div>
                <div class="status-filters">
                    <select [(ngModel)]="statusFilter" (change)="loadTasks()">
                        <option value="all">Tous les status</option>
                        <option value="TODO">À faire</option>
                        <option value="IN_PROGRESS">En cours</option>
                        <option value="DONE">Terminées</option>
                        <option value="ARCHIVED">Archivées</option>
                    </select>
                </div>
            </div>

            <div class="table-card">
                <app-loader *ngIf="isLoading()" message="Récupération de la base de données..."></app-loader>
                
                <table class="admin-table" *ngIf="!isLoading()">
                    <thead>
                        <tr>
                            <th>Tâche</th>
                            <th>Propriétaire</th>
                            <th>Assigné à</th>
                            <th>Priorité</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let t of tasks()">
                            <td class="task-col">
                                <div class="task-info">
                                    <span class="title">{{ t.title }}</span>
                                    <span class="date">Créée le {{ t.createdAt | date:'shortDate' }}</span>
                                </div>
                            </td>
                            <td>
                                <div class="user-chip">
                                    <span class="material-icons">person</span>
                                    {{ t.owner?.username }}
                                </div>
                            </td>
                            <td>
                                <div class="user-chip" *ngIf="t.assignedUser">
                                    <span class="material-icons">assignment_ind</span>
                                    {{ t.assignedUser.username }}
                                </div>
                                <span class="unassigned" *ngIf="!t.assignedUser">-</span>
                            </td>
                            <td>
                                <span class="badge-priority" [class]="t.priority.toLowerCase()">{{ t.priority }}</span>
                            </td>
                            <td>
                                <span class="badge-status" [class]="t.status.toLowerCase()">{{ t.status }}</span>
                            </td>
                            <td class="actions">
                                <button class="btn-icon" (click)="requestDelete(t.id)" title="Supprimer">
                                    <span class="material-icons">delete</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div *ngIf="tasks().length === 0 && !isLoading()" class="empty-state">
                    <span class="material-icons">assignment_late</span>
                    <p>Aucune tâche ne correspond aux critères.</p>
                </div>

                <div class="pagination" *ngIf="totalPages() > 1 && !isLoading()">
                    <button [disabled]="page() === 1" (click)="setPage(page() - 1)">
                        <span class="material-icons">chevron_left</span>
                    </button>
                    <span>Page {{ page() }} / {{ totalPages() }}</span>
                    <button [disabled]="page() === totalPages()" (click)="setPage(page() + 1)">
                        <span class="material-icons">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <app-confirm-dialog *ngIf="showConfirm"
            title="Supprimer la tâche ?"
            message="Cette action est irréversible et supprimera également les fichiers liés."
            (confirm)="deleteTask()"
            (cancel)="showConfirm = false">
        </app-confirm-dialog>
    `,
    styles: [`
        .admin-container { padding: 32px; animation: fadeIn 0.4s ease; max-width: 1300px; margin: 0 auto; }
        .header-section { margin-bottom: 32px; }
        .title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        h1 { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .badge { background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(99, 102, 241, 0.2); }
        p { color: var(--text-muted); font-size: 1rem; margin: 0; }

        .filter-bar { display: flex; gap: 20px; margin-bottom: 24px; }
        .search-box { flex: 1; display: flex; align-items: center; background: var(--bg-card-solid); border: 1px solid var(--border-light); border-radius: 14px; padding: 0 16px; box-shadow: var(--shadow-sm); transition: all 0.2s;
            &:focus-within { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
            input { background: transparent; border: none; color: var(--text-primary); padding: 12px; width: 100%; outline: none; font-size: 0.95rem; }
            .material-icons { color: var(--text-muted); font-size: 22px; }
        }
        .status-filters select { background: var(--bg-card-solid); border: 1px solid var(--border-light); color: var(--text-primary); padding: 12px 20px; border-radius: 14px; outline: none; font-size: 0.95rem; cursor: pointer; box-shadow: var(--shadow-sm); transition: all 0.2s; &:focus { border-color: #6366f1; } }

        .table-card { background: var(--bg-card-solid); border: 1px solid var(--border-light); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-lg); }
        .admin-table { width: 100%; border-collapse: collapse; }
        th { padding: 18px 24px; text-align: left; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); border-bottom: 2px solid var(--border-light); background: rgba(0,0,0,0.01); letter-spacing: 1.5px; }
        td { padding: 18px 24px; color: var(--text-secondary); border-bottom: 1px solid var(--border-light); font-size: 0.9rem; }
        tr:hover:not(thead tr) { background: var(--bg-hover); }

        .task-col { min-width: 250px; .task-info { display: flex; flex-direction: column; .title { font-weight: 700; color: var(--text-primary); margin-bottom: 2px; } .date { font-size: 0.75rem; color: var(--text-muted); } } }
        .user-chip { display: inline-flex; align-items: center; gap: 8px; background: var(--bg-hover); padding: 6px 12px; border-radius: 10px; font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; .material-icons { font-size: 16px; color: var(--text-muted); } }
        .unassigned { color: var(--text-muted); font-style: italic; opacity: 0.5; }

        .badge-priority, .badge-status { padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .badge-priority.high { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .badge-priority.medium { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .badge-priority.low { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        
        .badge-status.todo { background: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border-light); }
        .badge-status.in_progress { background: rgba(99, 102, 241, 0.1); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.2); }
        .badge-status.done { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

        .actions { text-align: right; .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; transition: all 0.2s; .material-icons { font-size: 22px; } &:hover { color: #ef4444; transform: scale(1.1); } } }

        .pagination { padding: 20px; display: flex; justify-content: center; align-items: center; gap: 24px; border-top: 1px solid var(--border-light); background: rgba(0,0,0,0.01); }
        .pagination button { background: var(--bg-card-solid); border: 1px solid var(--border-light); color: var(--text-primary); width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); transition: all 0.2s; &:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; transform: translateY(-2px); } &:disabled { opacity: 0.3; cursor: not-allowed; } }
        .pagination span { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); }

        .empty-state { padding: 100px; text-align: center; color: var(--text-muted); .material-icons { font-size: 72px; margin-bottom: 20px; opacity: 0.3; } p { font-size: 1.1rem; font-weight: 500; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class AdminTasksComponent implements OnInit {
    private api = inject(ApiService);
    private toast = inject(ToastService);

    tasks = signal<Task[]>([]);
    totalTasks = signal(0);
    isLoading = signal(false);
    showConfirm = false;
    taskToDelete: number | null = null;

    // Filters & Pagination
    searchQuery = '';
    statusFilter = 'all';
    page = signal(1);
    limit = 10;
    totalPages = signal(1);

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        this.isLoading.set(true);
        this.api.getTasks(this.statusFilter, 'all', this.searchQuery, this.page(), this.limit, undefined, true).subscribe({
            next: (res: any) => {
                this.tasks.set(res.data);
                this.totalTasks.set(res.pagination.total);
                this.totalPages.set(res.pagination.totalPages);
                this.isLoading.set(false);
            },
            error: () => {
                this.toast.show('Erreur de chargement des tâches globales', 'error');
                this.isLoading.set(false);
            }
        });
    }

    setPage(p: number) {
        this.page.set(p);
        this.loadTasks();
    }

    requestDelete(id: number) {
        this.taskToDelete = id;
        this.showConfirm = true;
    }

    deleteTask() {
        if (!this.taskToDelete) return;
        this.api.deleteTask(this.taskToDelete).subscribe({
            next: () => {
                this.toast.show('Tâche supprimée (Action Admin)', 'success');
                this.loadTasks();
                this.showConfirm = false;
            },
            error: () => this.toast.show('Erreur lors de la suppression', 'error')
        });
    }
}
