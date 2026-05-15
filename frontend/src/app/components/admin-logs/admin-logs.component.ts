import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';
import { ToastService } from '../toast/toast.component';
import { LoaderComponent } from '../loader/loader.component';

@Component({
    selector: 'app-admin-logs',
    standalone: true,
    imports: [CommonModule, LoaderComponent],
    template: `
        <div class="admin-container">
            <div class="header-section">
                <h1>Journal d'Audit (Audit Trail)</h1>
                <p>Historique complet des actions effectuées sur la plateforme.</p>
            </div>

            <div class="table-card">
                <app-loader *ngIf="isLoading()" message="Chargement des journaux d'audit..."></app-loader>

                <table class="admin-table" *ngIf="!isLoading()">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Utilisateur</th>
                            <th>Action</th>
                            <th>Entité</th>
                            <th>Détails</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let log of logs()">
                            <td class="time-col">{{ log.createdAt | date:'medium' }}</td>
                            <td>
                                <span class="username-tag">{{ log.user?.username || 'Système' }}</span>
                            </td>
                            <td>
                                <span class="action-tag">{{ log.action }}</span>
                            </td>
                            <td>
                                <span class="entity-tag">{{ log.entityType }}</span>
                            </td>
                            <td class="id-col">ID #{{ log.entityId }}</td>
                        </tr>
                    </tbody>
                </table>

                <div *ngIf="logs().length === 0 && !isLoading()" class="empty-state">
                    <span class="material-icons">history_toggle_off</span>
                    <p>Aucune activité enregistrée.</p>
                </div>

                <!-- Simple Pagination -->
                <div class="pagination-footer" *ngIf="totalPages() > 1 && !isLoading()">
                    <button [disabled]="currentPage() === 1" (click)="loadLogs(currentPage() - 1)">Précédent</button>
                    <span>Page {{ currentPage() }} sur {{ totalPages() }}</span>
                    <button [disabled]="currentPage() === totalPages()" (click)="loadLogs(currentPage() + 1)">Suivant</button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .admin-container { padding: 32px; animation: fadeIn 0.4s ease; max-width: 1200px; margin: 0 auto; }
        .header-section { margin-bottom: 32px; h1 { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; } p { color: var(--text-muted); font-size: 1rem; } }
        .table-card { background: var(--bg-card-solid); border: 1px solid var(--border-light); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-lg); }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 18px 24px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1.5px; border-bottom: 2px solid var(--border-light); background: rgba(0,0,0,0.01); }
        .admin-table td { padding: 16px 24px; color: var(--text-secondary); border-bottom: 1px solid var(--border-light); font-size: 0.9rem; }
        .admin-table tr:hover:not(thead tr) { background: var(--bg-hover); }
        
        .time-col { color: var(--text-muted) !important; font-size: 0.8rem !important; font-weight: 500; }
        .username-tag { color: #6366f1; font-weight: 700; background: rgba(99, 102, 241, 0.05); padding: 4px 10px; border-radius: 8px; font-size: 0.85rem; }
        .action-tag { color: var(--text-primary); font-weight: 600; border: 1px solid var(--border-light); padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; background: var(--bg-card-solid); box-shadow: var(--shadow-sm); }
        .entity-tag { color: var(--text-muted); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; }
        .id-col { color: var(--text-muted); font-size: 0.8rem; opacity: 0.7; }

        .pagination-footer { padding: 20px; display: flex; justify-content: center; align-items: center; gap: 24px; border-top: 1px solid var(--border-light); background: rgba(0,0,0,0.01);
            button { background: var(--bg-card-solid); border: 1px solid var(--border-light); color: var(--text-primary); padding: 8px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem; box-shadow: var(--shadow-sm); transition: all 0.2s; &:disabled { opacity: 0.3; cursor: not-allowed; } &:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; transform: translateY(-2px); } }
            span { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
        }

        .empty-state { padding: 100px; text-align: center; color: var(--text-muted); .material-icons { font-size: 72px; margin-bottom: 20px; opacity: 0.3; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class AdminLogsComponent implements OnInit {
    private api = inject(ApiService);
    private toast = inject(ToastService);

    logs = signal<any[]>([]);
    currentPage = signal(1);
    totalPages = signal(1);
    isLoading = signal(false);

    ngOnInit() {
        this.loadLogs(1);
    }

    loadLogs(page: number) {
        this.isLoading.set(true);
        this.api.getLogs(page).subscribe({
            next: (res: any) => {
                this.logs.set(res.data);
                this.currentPage.set(res.pagination.page);
                this.totalPages.set(res.pagination.totalPages);
                this.isLoading.set(false);
            },
            error: () => {
                this.toast.show('Erreur de chargement des logs', 'error');
                this.isLoading.set(false);
            }
        });
    }
}
