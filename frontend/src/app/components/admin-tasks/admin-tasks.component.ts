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
        .admin-container { padding: 24px; animation: fadeIn 0.4s ease; }
        .header-section { margin-bottom: 24px; }
        .title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
        h1 { font-size: 1.5rem; color: white; margin: 0; }
        .badge { background: rgba(99, 102, 241, 0.2); color: #818cf8; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        p { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin: 0; }

        .filter-bar { display: flex; gap: 16px; margin-bottom: 20px; }
        .search-box { flex: 1; display: flex; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0 12px;
            input { background: transparent; border: none; color: white; padding: 10px; width: 100%; outline: none; font-size: 0.85rem; }
            .material-icons { color: rgba(255,255,255,0.2); font-size: 20px; }
        }
        .status-filters select { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 16px; border-radius: 10px; outline: none; font-size: 0.85rem; cursor: pointer; }

        .table-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; }
        th { padding: 16px; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.05); letter-spacing: 1px; }
        td { padding: 16px; color: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 0.85rem; }

        .task-col { min-width: 250px; .task-info { display: flex; flex-direction: column; .title { font-weight: 600; color: white; } .date { font-size: 0.7rem; color: rgba(255,255,255,0.3); } } }
        .user-chip { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.04); padding: 4px 10px; border-radius: 10px; font-size: 0.8rem; .material-icons { font-size: 14px; opacity: 0.5; } }
        .unassigned { color: rgba(255,255,255,0.2); }

        .badge-priority, .badge-status { padding: 3px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .badge-priority.high { color: #f87171; background: rgba(248, 113, 113, 0.1); }
        .badge-priority.medium { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
        .badge-priority.low { color: #34d399; background: rgba(52, 211, 153, 0.1); }
        
        .badge-status.todo { border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; }
        .badge-status.in_progress { border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; }
        .badge-status.done { border: 1px solid rgba(52, 211, 153, 0.3); color: #34d399; }

        .actions { text-align: right; .btn-icon { background: transparent; border: none; color: rgba(239, 68, 68, 0.5); cursor: pointer; &:hover { color: #f87171; } } }

        .pagination { padding: 16px; display: flex; justify-content: center; align-items: center; gap: 20px; border-top: 1px solid rgba(255,255,255,0.05); }
        .pagination button { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:disabled { opacity: 0.3; cursor: not-allowed; } }
        .pagination span { font-size: 0.8rem; color: rgba(255,255,255,0.4); }

        .empty-state { padding: 80px; text-align: center; color: rgba(255,255,255,0.15); .material-icons { font-size: 60px; margin-bottom: 20px; } }
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
        this.api.getTasks(this.statusFilter, 'all', this.searchQuery, this.page(), this.limit).subscribe({
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
