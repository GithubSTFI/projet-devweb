import { Component, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Task } from '../../api.service';
import { TaskDetailComponent } from '../task-detail/task-detail.component';
import { KanbanViewComponent } from '../kanban-view/kanban-view.component';
import { ToastService } from '../toast/toast.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TaskDetailComponent, ConfirmDialogComponent, KanbanViewComponent],
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
    searchQuery = signal<string>('');
    viewMode = signal<'list' | 'kanban'>('list');

    filteredTasks = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const allTasks = this.tasks();
        if (!query) return allTasks;
        return allTasks.filter(t =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
    });

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

    effectRef = effect(() => {
        this.loadTasks(this.filter());
    });

    ngOnInit() { }

    setFilter(status: string) {
        this.filter.set(status);
    }

    loadTasks(status: string) {
        this.api.getTasks(status).subscribe({
            next: (res: any) => {
                const data = res.data as Task[];
                this.tasks.set(data);
            },
            error: () => this.toast.show('Erreur de chargement', 'error')
        });
    }

    getCountByStatus(status: string): number {
        return this.tasks().filter(t => t.status === status).length;
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
        this.loadTasks(this.filter());
        this.toast.show(this.isNewMode ? 'Tâche créée !' : 'Tâche mise à jour !', 'success');
    }

    toggleStatus(task: Task) {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        this.api.updateTask(task.id, { status: newStatus }).subscribe(() => {
            this.loadTasks(this.filter());
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
                this.loadTasks(this.filter());
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
                this.loadTasks(this.filter());
                this.toast.show('Priorité mise à jour', 'info');
            },
            error: () => this.toast.show('Erreur de mise à jour', 'error')
        });
    }

    cancelDelete() {
        this.showConfirmDialog = false;
        this.taskToDelete = null;
    }
}
