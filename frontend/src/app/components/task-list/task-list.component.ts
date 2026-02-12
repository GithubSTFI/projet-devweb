import { Component, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Task } from '../../api.service';
import { TaskDetailComponent } from '../task-detail/task-detail.component';
import { KanbanViewComponent } from '../kanban-view/kanban-view.component';
import { ToastService } from '../toast/toast.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LoaderComponent } from '../loader/loader.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TaskDetailComponent, ConfirmDialogComponent, KanbanViewComponent, LoaderComponent],
    templateUrl: './task-list.component.html',
    styleUrls: ['./task-list.component.scss'],
    animations: [
        trigger('staggerList', [
            transition(':enter', [
                query('.stagger-card, .stagger-row', [
                    style({ opacity: 0, transform: 'translateY(15px)' }),
                    stagger('60ms', [
                        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ])
    ]
})
export class TaskListComponent implements OnInit {
    private api = inject(ApiService);
    private toast = inject(ToastService);

    tasks = signal<Task[]>([]);
    filter = signal<string>('all');
    priorityFilter = signal<string>('all');
    searchQuery = signal<string>('');
    viewMode = signal<'list' | 'kanban'>('list');
    isLoading = signal<boolean>(false);

    // Pagination
    page = signal<number>(1);
    limit = signal<number>(10);
    totalPages = signal<number>(1);
    totalItems = signal<number>(0);

    showModal = false;
    selectedTask: Partial<Task> = {};
    isNewMode = false;

    showConfirmDialog = false;
    taskToDelete: number | null = null;

    filters = [
        { label: 'Toutes', value: 'all' },
        { label: 'À faire', value: 'TODO' },
        { label: 'En cours', value: 'IN_PROGRESS' },
        { label: 'Terminées', value: 'DONE' },
        { label: 'Archivées', value: 'ARCHIVED' }
    ];

    priorities = [
        { label: 'Toutes', value: 'all' },
        { label: 'Haute', value: 'HIGH' },
        { label: 'Moyenne', value: 'MEDIUM' },
        { label: 'Basse', value: 'LOW' }
    ];

    // Effect déclenché par tout changement de filtre, recherche, pagination ou vue
    effectRef = effect(() => {
        // Nous accédons explicitement aux signaux pour garantir le tracking
        this.filter();
        this.priorityFilter();
        this.searchQuery();
        this.page();
        this.viewMode();

        this.loadTasks();
    });

    ngOnInit() { }

    setViewMode(mode: 'list' | 'kanban') {
        this.page.set(1);
        this.viewMode.set(mode);
    }

    setFilter(status: string) {
        this.page.set(1);
        this.filter.set(status);
    }

    setPriority(priority: string) {
        this.page.set(1);
        this.priorityFilter.set(priority);
    }

    onSearch(event: any) {
        this.page.set(1);
        this.searchQuery.set(event.target.value);
    }

    loadTasks() {
        this.isLoading.set(true);
        // En mode Kanban, on charge "tout" (ex: 1000 items) pour avoir une vue complète
        // En mode Liste, on utilise la pagination standard
        const limit = this.viewMode() === 'kanban' ? 1000 : this.limit();

        this.api.getTasks(
            this.filter(),
            this.priorityFilter(),
            this.searchQuery(),
            this.page(),
            limit
        ).subscribe({
            next: (res: any) => {
                this.tasks.set(res.data);
                this.totalPages.set(res.pagination.totalPages);
                this.totalItems.set(res.pagination.total);
                this.isLoading.set(false);
            },
            error: () => {
                this.toast.show('Erreur de chargement', 'error');
                this.isLoading.set(false);
            }
        });
    }

    nextPage() {
        if (this.page() < this.totalPages()) {
            this.page.update(p => p + 1);
        }
    }

    prevPage() {
        if (this.page() > 1) {
            this.page.update(p => p - 1);
        }
    }

    getStatusLabel(status: string): string {
        const labels: any = {
            'TODO': 'À faire',
            'IN_PROGRESS': 'En cours',
            'DONE': 'Terminé',
            'ARCHIVED': 'Archivé'
        };
        return labels[status] || status;
    }

    getPriorityLabel(priority: string): string {
        const labels: any = {
            'LOW': 'Basse',
            'MEDIUM': 'Moyenne',
            'HIGH': 'Haute'
        };
        return labels[priority] || priority;
    }

    openNewTask() {
        this.selectedTask = { priority: 'MEDIUM', status: 'TODO' };
        this.isNewMode = true;
        this.showModal = true;
    }

    openDetail(task: Task) {
        this.selectedTask = task;
        this.isNewMode = false;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.selectedTask = {};
    }

    refresh() {
        this.loadTasks();
        this.toast.show(this.isNewMode ? 'Tâche créée !' : 'Tâche mise à jour !', 'success');
    }

    toggleStatus(task: Task) {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        this.api.updateTask(task.id, { status: newStatus }).subscribe(() => {
            this.loadTasks();
            this.toast.show(`Tâche ${newStatus === 'DONE' ? 'terminée' : 'réouverte'}`, 'info');
        });
    }

    deleteTask(id: number) {
        this.taskToDelete = id;
        this.showConfirmDialog = true;
    }

    confirmDelete() {
        if (this.taskToDelete !== null) {
            this.api.deleteTask(this.taskToDelete).subscribe(() => {
                this.loadTasks();
                this.toast.show('Tâche supprimée', 'info');
                this.showConfirmDialog = false;
                this.taskToDelete = null;
            });
        }
    }

    updatePriority(task: Task, newPriority: string) {
        if (task.priority === newPriority) return;
        this.api.updateTask(task.id, { priority: newPriority as any }).subscribe({
            next: () => {
                this.loadTasks();
                this.toast.show('Priorité mise à jour', 'info');
            },
            error: () => this.toast.show('Erreur de mise à jour', 'error')
        });
    }

    cancelDelete() {
        this.showConfirmDialog = false;
        this.taskToDelete = null;
    }

    isOverdue(task: Task): boolean {
        if (task.status === 'DONE' || !task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
    }
}
