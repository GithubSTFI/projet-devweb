import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Task } from '../../api.service';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './task-detail.component.html',
    styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnChanges {
    @Input() task: Partial<Task> = {};
    @Input() isNew = false;
    @Output() closeEvent = new EventEmitter<void>();
    @Output() updateEvent = new EventEmitter<void>();

    private api = inject(ApiService);
    files = signal<any[]>([]);
    users = signal<any[]>([]);
    isUploading = false;
    editTask: Partial<Task> = {};

    // Mode Management
    mode = signal<'VIEW' | 'EDIT'>('VIEW');

    ngOnInit() {
        this.loadUsers();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['task'] || changes['isNew']) {
            this.editTask = { ...this.task };
            this.mode.set(this.isNew ? 'EDIT' : 'VIEW');
            if (this.editTask.id) {
                this.loadFiles();
            } else {
                this.files.set([]);
                // Defaults for new task
                this.editTask.priority = this.editTask.priority || 'MEDIUM';
                this.editTask.status = 'TODO';
                this.editTask.assignedUserId = null;
            }
        }
    }

    loadUsers() {
        this.api.listUsers().subscribe({
            next: (res: any) => this.users.set(res.data),
            error: (err) => console.error(err)
        });
    }

    setMode(newMode: 'VIEW' | 'EDIT') {
        this.mode.set(newMode);
    }

    close() {
        this.closeEvent.emit();
    }

    save() {
        if (!this.editTask.title) return;

        const payload = {
            title: this.editTask.title,
            description: this.editTask.description,
            priority: this.editTask.priority,
            status: this.editTask.status,
            dueDate: this.editTask.dueDate,
            assignedUserId: this.editTask.assignedUserId
        };

        if (this.isNew) {
            this.api.createTask(payload).subscribe({
                next: () => {
                    this.updateEvent.emit();
                    this.close();
                }
            });
        } else {
            if (!this.task.id) return;
            this.api.updateTask(this.task.id, payload).subscribe({
                next: () => {
                    this.updateEvent.emit();
                    this.close();
                }
            });
        }
    }

    loadFiles() {
        if (!this.task.id) return;
        this.api.getFiles(this.task.id).subscribe({
            next: (res: any) => this.files.set(res.files),
            error: (err) => console.error(err)
        });
    }

    uploadFile(event: any) {
        if (!this.task.id) return;
        const file = event.target.files[0];
        if (!file) return;

        this.isUploading = true;
        this.api.uploadFile(file, this.task.id).subscribe({
            next: () => {
                this.loadFiles();
                this.isUploading = false;
            },
            error: () => this.isUploading = false
        });
    }

    getDownloadUrl(filename: string) {
        return `http://localhost:3000/api/download/${filename}`;
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
}
