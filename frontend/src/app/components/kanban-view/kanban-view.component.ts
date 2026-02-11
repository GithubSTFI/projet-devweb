import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, ApiService } from '../../api.service';

@Component({
    selector: 'app-kanban-view',
    standalone: true,
    imports: [CommonModule, DragDropModule],
    templateUrl: './kanban-view.component.html',
    styleUrls: ['./kanban-view.component.scss']
})
export class KanbanViewComponent {
    private api = inject(ApiService);

    @Input() set tasks(value: Task[]) {
        this.allTasks.set(value);
        this.distributeTasks();
    }

    @Output() taskUpdated = new EventEmitter<void>();

    allTasks = signal<Task[]>([]);
    todo = signal<Task[]>([]);
    inProgress = signal<Task[]>([]);
    done = signal<Task[]>([]);
    archived = signal<Task[]>([]);

    distributeTasks() {
        const tasks = this.allTasks();
        this.todo.set(tasks.filter(t => t.status === 'TODO'));
        this.inProgress.set(tasks.filter(t => t.status === 'IN_PROGRESS'));
        this.done.set(tasks.filter(t => t.status === 'DONE'));
        this.archived.set(tasks.filter(t => t.status === 'ARCHIVED'));
    }

    drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            const task = event.previousContainer.data[event.previousIndex];
            const newStatus = event.container.id as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );

            // Update backend
            this.api.updateTask(task.id, { status: newStatus }).subscribe({
                next: () => this.taskUpdated.emit(),
                error: (err) => {
                    console.error('Failed to update task status', err);
                    // Rollback on error if necessary
                    this.distributeTasks();
                }
            });
        }
    }

    getPriorityClass(priority: string): string {
        return 'priority-' + priority.toLowerCase();
    }
}
