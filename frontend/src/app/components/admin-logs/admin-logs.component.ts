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
        .admin-container { padding: 24px; animation: fadeIn 0.4s ease; }
        .header-section { margin-bottom: 24px; h1 { font-size: 1.5rem; color: white; margin-bottom: 4px; } p { color: rgba(255,255,255,0.4); font-size: 0.9rem; } }
        .table-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden; }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 16px; font-size: 0.75rem; text-transform: uppercase; color: rgba(255,255,255,0.3); letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .admin-table td { padding: 14px 16px; color: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 0.85rem; }
        
        .time-col { color: rgba(255,255,255,0.4) !important; font-size: 0.8rem !important; }
        .username-tag { color: #818cf8; font-weight: 700; }
        .action-tag { color: white; border: 1px solid rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; background: rgba(255,255,255,0.02); }
        .entity-tag { color: rgba(255,255,255,0.5); font-family: monospace; }
        .id-col { color: rgba(255,255,255,0.3); font-size: 0.8rem; }

        .pagination-footer { padding: 16px; display: flex; justify-content: center; align-items: center; gap: 20px; border-top: 1px solid rgba(255,255,255,0.05);
            button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 6px 16px; border-radius: 6px; cursor: pointer; &:disabled { opacity: 0.3; cursor: not-allowed; } &:hover:not(:disabled) { background: rgba(255,255,255,0.1); } }
            span { font-size: 0.85rem; color: rgba(255,255,255,0.4); }
        }

        .empty-state { padding: 60px; text-align: center; color: rgba(255,255,255,0.2); .material-icons { font-size: 48px; margin-bottom: 12px; } }
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
